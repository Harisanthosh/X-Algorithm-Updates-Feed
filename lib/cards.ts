import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Card, SpecialCard } from "@/content/schema";
import { blobUrl } from "@/lib/github";
import { highlightSnippet } from "@/lib/highlight";

/** A card is "new" for this many days after its publishedAt date. */
export const NEW_WINDOW_DAYS = 7;

export type SnippetView = {
  path: string;
  startLine: number;
  endLine: number;
  url: string;
  html: string;
};

/** Plain, serializable slide data. Safe to pass from server to client components. */
export type SlideData = {
  kind: "cover" | "about" | "card";
  slug: string;
  title: string;
  order: number;
  topics: string[];
  // cover / about
  body?: string[];
  links?: { label: string; href: string }[];
  // finding cards
  dek?: string;
  whatChanged?: string;
  meaningForCreators?: string;
  action?: string;
  publishedAt?: string;
  commitSha?: string;
  isNew?: boolean;
  snippets?: SnippetView[];
};

const CONTENT_DIR = path.join(process.cwd(), "content");

async function readJsonDir(dir: string): Promise<{ file: string; data: unknown }[]> {
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json")).sort();
  return Promise.all(
    names.map(async (name) => ({
      file: path.join(dir, name),
      data: JSON.parse(await readFile(path.join(dir, name), "utf8")) as unknown,
    })),
  );
}

/** Loads and validates every card. Throws (fails the build) on any invalid file. */
export async function loadCards() {
  "use cache";
  const entries = await readJsonDir(path.join(CONTENT_DIR, "cards"));
  return entries.map(({ file, data }) => {
    const parsed = Card.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Invalid card ${file}: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

export async function loadSpecials() {
  const entries = await readJsonDir(path.join(CONTENT_DIR, "special"));
  return entries.map(({ file, data }) => {
    const parsed = SpecialCard.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Invalid special card ${file}: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

/** True when publishedAt falls within the last NEW_WINDOW_DAYS days. */
export function isNewCard(publishedAt: string, now: Date = new Date()) {
  const published = Date.parse(`${publishedAt}T00:00:00Z`);
  if (Number.isNaN(published)) return false;
  const ageDays = (now.getTime() - published) / 86_400_000;
  return ageDays >= 0 && ageDays <= NEW_WINDOW_DAYS;
}

/**
 * Everything the feed needs, in display order: cover first, finding cards by
 * order, about last. Only verified finding cards are shown. Unverified cards
 * stay in content/cards but are hidden, as the plan requires.
 */
export async function getSlides(): Promise<SlideData[]> {
  "use cache";
  const [cards, specials] = await Promise.all([loadCards(), loadSpecials()]);

  const cover = specials.filter((s) => s.kind === "cover");
  const about = specials.filter((s) => s.kind === "about");

  const cardSlides: SlideData[] = await Promise.all(
    cards
      .filter((c) => c.verified)
      .sort((a, b) => a.order - b.order)
      .map(async (c) => ({
        kind: "card" as const,
        slug: c.slug,
        title: c.title,
        order: c.order,
        topics: c.topics,
        dek: c.dek,
        whatChanged: c.whatChanged,
        meaningForCreators: c.meaningForCreators,
        action: c.action,
        publishedAt: c.publishedAt,
        commitSha: c.commitSha,
        isNew: isNewCard(c.publishedAt),
        snippets: await Promise.all(
          c.snippets.map(async (s) => ({
            path: s.path,
            startLine: s.startLine,
            endLine: s.endLine,
            url: blobUrl(s.path, s.startLine, s.endLine, c.commitSha ?? "master"),
            html: await highlightSnippet(s),
          })),
        ),
      })),
  );

  const coverSlides: SlideData[] = cover.map((s) => ({
    kind: "cover" as const,
    slug: s.slug,
    title: s.title,
    order: s.order,
    topics: [],
    body: s.body,
  }));

  const aboutSlides: SlideData[] = about.map((s) => ({
    kind: "about" as const,
    slug: s.slug,
    title: s.title,
    order: s.order,
    topics: [],
    body: s.body,
    links: s.links,
  }));

  return [...coverSlides, ...cardSlides, ...aboutSlides];
}

export async function getCardSlugs(): Promise<string[]> {
  "use cache";
  const slides = await getSlides();
  return slides.filter((s) => s.kind === "card").map((s) => s.slug);
}

