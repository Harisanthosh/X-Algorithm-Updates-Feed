/**
 * Build-time content checks. Runs before `next build` (see the prebuild script).
 * Exits non-zero on any failure, so an invalid card fails the build.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Card, SpecialCard } from "../content/schema";

const root = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];

async function readDir(dir: string) {
  const names = (await readdir(path.join(root, "content", dir))).filter((n) => n.endsWith(".json")).sort();
  return Promise.all(
    names.map(async (name) => ({
      file: `content/${dir}/${name}`,
      data: JSON.parse(await readFile(path.join(root, "content", dir, name), "utf8")) as unknown,
    })),
  );
}

// Typographic dashes used as separators are not allowed in public copy (plan section 12).
const DASH = /[\u2013\u2014]/;

function checkPublicText(file: string, label: string, text: string) {
  if (DASH.test(text)) errors.push(`${file}: ${label} contains an en or em dash`);
}

async function main() {
  const cards = await readDir("cards");
  const specials = await readDir("special");

  const seenSlugs = new Map<string, string>();
  const seenOrders = new Map<number, string>();

  for (const { file, data } of cards) {
    const parsed = Card.safeParse(data);
    if (!parsed.success) {
      errors.push(`${file}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
      continue;
    }
    const c = parsed.data;

    if (seenSlugs.has(c.slug)) errors.push(`${file}: duplicate slug "${c.slug}" (also in ${seenSlugs.get(c.slug)})`);
    seenSlugs.set(c.slug, file);
    if (seenOrders.has(c.order)) errors.push(`${file}: duplicate order ${c.order} (also in ${seenOrders.get(c.order)})`);
    seenOrders.set(c.order, file);

    if (!c.action.startsWith("Do this:")) errors.push(`${file}: action must start with "Do this:"`);
    for (const label of ["title", "dek", "whatChanged", "meaningForCreators", "action"] as const) {
      const v = c[label];
      if (typeof v === "string") checkPublicText(file, label, v);
    }

    for (const s of c.snippets) {
      const lines = s.code.split("\n").length;
      const expected = s.endLine - s.startLine + 1;
      if (lines !== expected) {
        errors.push(`${file}: snippet ${s.path} L${s.startLine}-L${s.endLine} has ${lines} code lines, expected ${expected}`);
      }
      for (const h of s.highlightLines ?? []) {
        if (h < s.startLine || h > s.endLine) errors.push(`${file}: highlight L${h} is outside ${s.startLine}-${s.endLine}`);
      }
      if (lines > 16) warnings.push(`${file}: snippet ${s.path} is ${lines} lines (plan suggests 16 max)`);
    }

    if (c.verified && c.snippets.length === 0) errors.push(`${file}: verified card has no snippets`);
    if (c.needsReview) warnings.push(`${file}: needs review, cited upstream lines changed since ${c.commitSha ?? "no pin"}`);
    if (!c.verified) warnings.push(`${file}: unverified, hidden from the feed (${c.todos?.length ?? 0} todo)`);
  }

  for (const { file, data } of specials) {
    const parsed = SpecialCard.safeParse(data);
    if (!parsed.success) {
      errors.push(`${file}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
      continue;
    }
    const s = parsed.data;
    if (seenSlugs.has(s.slug)) errors.push(`${file}: duplicate slug "${s.slug}"`);
    seenSlugs.set(s.slug, file);
    for (const p of s.body) checkPublicText(file, "body", p);
  }

  const verifiedCount = cards.filter(({ data }) => (data as { verified?: boolean }).verified === true).length;
  console.log(`cards: ${cards.length} files (${verifiedCount} verified), specials: ${specials.length}`);
  for (const w of warnings) console.warn(`warn  ${w}`);
  for (const e of errors) console.error(`error ${e}`);

  if (errors.length > 0) {
    console.error(`\nCard validation failed with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log("Card validation passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
