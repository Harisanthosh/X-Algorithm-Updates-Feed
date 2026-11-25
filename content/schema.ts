import { z } from "zod";

export const Topic = z.enum([
  "pipeline",
  "discovery",
  "scoring",
  "filters",
  "safety",
  "replies",
  "playbook",
]);

export const Snippet = z.object({
  path: z.string().min(1), // repo-relative, e.g. "home-mixer/params/param.rs"
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  highlightLines: z.array(z.number().int().positive()).optional(),
  language: z.enum(["rust", "python", "other"]),
  code: z.string().min(1), // exact text from the repo
});

export const Card = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    title: z.string().min(8).max(90),
    dek: z.string().max(140).optional(),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO calendar date
    updatedAt: z.string().optional(),
    topics: z.array(Topic).min(1),
    sourceDay: z.number().int().min(1).max(7).optional(), // seed cards only
    commitSha: z.string().min(7).optional(),
    commitDate: z.string().optional(),
    whatChanged: z.string().min(40).max(900),
    meaningForCreators: z.string().min(40).max(900),
    action: z.string().min(10).max(240), // starts with "Do this:"
    snippets: z.array(Snippet).max(3),
    verified: z.boolean(),
    // Set by scripts/sync-from-upstream.mjs when a cited upstream range changed since commitSha.
    // A human re-checks the lines, updates commitSha and snippets, then removes the flag.
    needsReview: z.boolean().optional(),
    todos: z.array(z.string()).optional(),
    order: z.number().int().positive(), // explicit sort
  })
  .refine((c) => c.snippets.every((s) => s.endLine >= s.startLine), {
    message: "endLine must be >= startLine",
  })
  .refine((c) => c.verified === false || !c.todos?.length, {
    message: "verified cards cannot still have todos",
  })
  .refine((c) => c.verified === false || c.snippets.length > 0, {
    message: "verified finding cards need at least one snippet",
  });

export const SpecialCard = z.object({
  kind: z.enum(["cover", "about"]),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  title: z.string().min(3).max(90),
  body: z.array(z.string().min(1)).min(1),
  links: z
    .array(z.object({ label: z.string().min(1), href: z.url() }))
    .optional(),
  order: z.number().int().positive(),
});

export type Card = z.infer<typeof Card>;
export type Snippet = z.infer<typeof Snippet>;
export type SpecialCard = z.infer<typeof SpecialCard>;
export type Topic = z.infer<typeof Topic>;

export const TOPICS = Topic.options;
