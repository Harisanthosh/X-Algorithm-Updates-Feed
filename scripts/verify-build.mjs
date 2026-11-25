#!/usr/bin/env node
/**
 * Post-build guard. Runs after `next build` (see the postbuild script).
 *
 * It checks the prerendered homepage feed against the card files in content/:
 * the expected sequence is cover, every verified finding card sorted by `order`,
 * then about. The check fails unless the built homepage renders exactly that.
 *
 * Where the homepage is found. Build output layout differs between a local build
 * and a Vercel build (for example, a restored build cache, or a Partial Prerender
 * route emitted as an RSC payload instead of HTML), so the script does not assume
 * one path. It looks, in order, for:
 *   1. .next/server/app/index.html
 *   2. .next/server/app/index.rsc
 *   3. any other .html or .rsc under .next/server/app that contains the cover slide
 *      and is not a /c/<slug> page
 * Each candidate is read for slide markers: `id="slide-<slug>"` in HTML and
 * `"slug":"<slug>"` in RSC payloads. The first candidate with slides is checked.
 * If no candidate has any slides, the script fails and lists every file it found.
 *
 * The expected list comes from content/ on every run, never from a previous
 * build, so a stale .next directory cannot make a bad build pass.
 *
 * Flags (for tests):
 *   --app-dir <dir>   use another directory instead of .next/server/app
 */
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function readJsonDir(dir) {
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json")).sort();
  return Promise.all(names.map(async (n) => JSON.parse(await readFile(path.join(dir, n), "utf8"))));
}

/** Expected feed order, computed from content/ on every run. */
async function expectedSlugs() {
  const cards = await readJsonDir(path.join(ROOT, "content", "cards"));
  const specials = await readJsonDir(path.join(ROOT, "content", "special"));
  const cover = specials.filter((s) => s.kind === "cover").map((s) => s.slug);
  const about = specials.filter((s) => s.kind === "about").map((s) => s.slug);
  const verified = cards
    .filter((c) => c.verified === true)
    .sort((a, b) => a.order - b.order)
    .map((c) => c.slug);
  return [...cover, ...verified, ...about];
}

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/** Slide slugs in the order they appear in a built file, first occurrence only. */
function slidesIn(text, file) {
  const re = file.endsWith(".html")
    ? /id="slide-([a-z0-9-]+)"/g
    : /"slug":"([a-z0-9-]+)"/g;
  const seen = [];
  for (const m of text.matchAll(re)) {
    const slug = m[1];
    if (slug.endsWith("-title")) continue;
    if (!seen.includes(slug)) seen.push(slug);
  }
  return seen;
}

function sameList(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

async function main() {
  const appDir = path.resolve(ROOT, argValue("--app-dir", path.join(".next", "server", "app")));
  const expected = await expectedSlugs();

  const files = (await walk(appDir)).filter((f) => f.endsWith(".html") || f.endsWith(".rsc"));
  const rel = (f) => {
    const r = path.relative(ROOT, f);
    return (r.startsWith("..") ? f : r).split(path.sep).join("/");
  };

  if (files.length === 0) {
    console.error(`verify-build: no .html or .rsc output found under ${rel(appDir)}.`);
    console.error("verify-build: run `next build` first. The build did not write route output where this check looks.");
    process.exit(1);
  }

  // Read every candidate once.
  const scanned = [];
  for (const f of files) {
    const text = await readFile(f, "utf8");
    scanned.push({ file: f, name: rel(f), slides: slidesIn(text, f) });
  }

  // Preference: the homepage file under its usual names first, then any other file with the cover.
  const named = ["index.html", "index.rsc"].map((n) => path.join(appDir, n));
  const preferred = named
    .map((n) => scanned.find((s) => s.file === n))
    .filter(Boolean);
  const fallback = scanned.filter((s) => {
    if (named.includes(s.file) || !s.slides.includes("cover")) return false;
    const top = path.relative(appDir, s.file).split(path.sep)[0];
    return top !== "c"; // /c/<slug> pages are not the homepage
  });
  const candidates = [...preferred, ...fallback];
  const source = candidates.find((s) => s.slides.length > 0);

  if (!source) {
    console.error("verify-build: could not find the rendered homepage feed in the build output.");
    console.error("verify-build: files checked (none contain slide markers):");
    for (const s of scanned) console.error(`  - ${s.name}`);
    process.exit(1);
  }

  const rendered = source.slides;
  const missing = expected.filter((s) => !rendered.includes(s));
  const extra = rendered.filter((s) => !expected.includes(s));
  const inOrder = sameList(rendered, expected);

  console.log(`verify-build: source ${source.name}: ${rendered.length} slides rendered, ${expected.length} expected`);
  if (missing.length || extra.length || !inOrder) {
    if (missing.length) console.error(`verify-build: missing slides: ${missing.join(", ")}`);
    if (extra.length) console.error(`verify-build: unexpected slides: ${extra.join(", ")}`);
    if (!inOrder && !missing.length && !extra.length) console.error("verify-build: rendered slides are out of order");
    console.error(`verify-build: rendered = [${rendered.join(", ")}]`);
    console.error(`verify-build: expected = [${expected.join(", ")}]`);
    process.exit(1);
  }
  console.log("verify-build: feed renders every expected slide in order.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
