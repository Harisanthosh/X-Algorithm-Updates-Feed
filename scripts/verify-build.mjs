#!/usr/bin/env node
/**
 * Post-build guard. Runs after `next build` (see the postbuild script).
 *
 * The feed is prerendered into .next/server/app/index.html. This check reads the
 * built HTML and fails the build unless every expected slide is present, in order:
 * cover, every verified finding card sorted by `order`, then about.
 *
 * It catches the "only 3 cards shipped" class of bug at build time instead of on
 * the live site. Pass --html <file> to check a different file.
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

async function expectedSlugs() {
  const cards = await readJsonDir(path.join(ROOT, "content", "cards"));
  const specials = await readJsonDir(path.join(ROOT, "content", "special"));
  const cover = specials.filter((s) => s.kind === "cover").map((s) => s.slug);
  const about = specials.filter((s) => s.kind === "about").map((s) => s.slug);
  const cards2 = cards
    .filter((c) => c.verified === true)
    .sort((a, b) => a.order - b.order)
    .map((c) => c.slug);
  return [...cover, ...cards2, ...about];
}

async function main() {
  const htmlPath = path.resolve(ROOT, argValue("--html", path.join(".next", "server", "app", "index.html")));
  if (!existsSync(htmlPath)) {
    console.error(`verify-build: ${path.relative(ROOT, htmlPath)} not found. Run next build first.`);
    process.exit(1);
  }

  const html = await readFile(htmlPath, "utf8");
  // One section id per slide. The title headings use "slide-<slug>-title", so skip those.
  const rendered = [...html.matchAll(/id="slide-([a-z0-9-]+)"/g)]
    .map((m) => m[1])
    .filter((id, i, all) => !id.endsWith("-title") && all.indexOf(id) === i);

  const expected = await expectedSlugs();
  const missing = expected.filter((s) => !rendered.includes(s));
  const orderOk = JSON.stringify(rendered.filter((s) => expected.includes(s))) === JSON.stringify(expected.filter((s) => rendered.includes(s)));

  console.log(`verify-build: ${rendered.length} slides rendered, ${expected.length} expected`);
  if (missing.length || rendered.length !== expected.length || !orderOk) {
    if (missing.length) console.error(`verify-build: missing slides: ${missing.join(", ")}`);
    if (!orderOk) console.error("verify-build: rendered slides are out of order");
    console.error(`verify-build: rendered = [${rendered.join(", ")}]`);
    process.exit(1);
  }
  console.log("verify-build: feed renders every expected slide in order.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
