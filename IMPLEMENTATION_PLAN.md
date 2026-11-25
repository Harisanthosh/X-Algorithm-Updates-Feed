# X Algorithm Scroll

**Implementation plan for Hari to build in Cursor.**
Written 25 November 2026 (Europe/Berlin). Seed facts were checked against Hari's Day 1–6 material in `/workspace/daily-post/x-algo/` and a local clone of [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) at commit `e005f95` (24 November 2026, 09:24 Europe/Berlin).

This is a build plan, not public copy. Public-facing text (card titles, body, launch post, share text) has its own style rules in [§12](#12-public-copy-rules). Anything marked **TODO-verify** must be re-checked in the live repo before it goes on a card.

---

## Contents

1. [Goal and success metrics](#1-goal-and-success-metrics)
2. [What we are building](#2-what-we-are-building)
3. [User experience](#3-user-experience)
4. [Tech stack](#4-tech-stack)
5. [Content schema](#5-content-schema)
6. [Repo and folder structure](#6-repo-and-folder-structure)
7. [Seed cards (v0)](#7-seed-cards-v0)
8. [Update pipeline](#8-update-pipeline)
9. [Grok Bot routine prompt](#9-grok-bot-routine-prompt)
10. [X sharing and launch](#10-x-sharing-and-launch)
11. [Analytics](#11-analytics)
12. [Public copy rules](#12-public-copy-rules)
13. [Phased milestones](#13-phased-milestones)
14. [Cursor prompts (paste per phase)](#14-cursor-prompts-paste-per-phase)
15. [Risks](#15-risks)
16. [Checklist](#16-checklist)

---

## 1. Goal and success metrics

### Product

A TikTok / Reels style vertical scroll, in the same spirit as [Megha Joshi's alphaXiv Scroll](https://alphaxiv-scroll.vercel.app/) (one paper per full-screen card). Here, every meaningful finding or commit in X's open source For You repo becomes one full-screen card:

- a plain English title
- what changed
- a short, real code snippet with file path and line links back to GitHub
- what it means for creators, plus one action line

A Grok Bot routine watches the repo. When a new commit lands, it drafts a card and opens a pull request (or, after review, commits it) so the site keeps itself updated. The site carries a visible credit: **built with Grok Bot**.

This is the public artifact of the "Breaking down the X algorithm" series. The series is the credibility. The scroll is the thing people save, share, and come back to.

### Who it is for

Creators with small or mid-size accounts who already care about how For You works, plus builders who like seeing real code next to a plain English explanation.

### What success looks like in the first 30 days

| Signal | Why it matters | Early target (directional, not a promise) |
|---|---|---|
| People finish more than one card | The format works | Median cards viewed per session ≥ 5 |
| Unique card URLs get shared | Deep links and OG images work | At least a few shares that land on a card, not only the homepage |
| Return visits after a new commit | The update loop is the product | A visible bump in visits within a day of a new card going live |
| Launch post reach | The dense format plus "proof in the code" holds attention | Judge against your own recent original posts, not against viral accounts |
| A Grok Bot drafted PR you can merge with light edits | The "built with Grok Bot" story is real | First auto-drafted card merged within a week of v2 |

Do not optimize for raw pageviews at the cost of accuracy. One wrong weight will follow you around.

---

## 2. What we are building

### In scope for v0–v2

- A static, fast, mobile-first scroll site you can host on Vercel for close to nothing
- About 22 seed cards drawn from Days 1–6, plus a cover card and an about card
- Per-card URLs and Open Graph images, so a shared card looks like itself on X
- A share button that opens an X intent link for that card
- Light / dark theme, keyboard + swipe, topic filters, a "new" badge
- A typed content schema and a drafting pipeline (Grok Bot routine, with a GitHub Action as a backup)
- Human review of every new card via pull request

### Out of scope until v3

- A "will this post get reach?" checker (link it later, do not build it now)
- Accounts, comments, likes, or a CMS
- Signing into x.com, posting, liking, following, or DMing on anyone's behalf
- Recreating the whole series as long articles (the articles already exist; the scroll is the new surface)
- Auto-merging cards without a human reading them

### Design principles

1. **Proof, not vibes.** Every finding card cites a file and line in `xai-org/x-algorithm`, or it is marked unverified and does not ship.
2. **Defaults are not the live site.** X's live settings can differ from the defaults in the repo. Say this on the cover, the about card, and in a short footer on finding cards.
3. **Short snippets, full links.** Quote only the lines you need. Send the reader to GitHub for the rest.
4. **Cheap and static.** Prefer build-time content. No database in v0–v2.
5. **The bot does ongoing work.** The interesting story is not a one-off demo. It is a routine that drafts a new card when the repo moves.

---

## 3. User experience

Model the feel of alphaXiv Scroll: one idea fills the viewport, the next idea is a flick away. Do not clone their visual design. Make this feel like a document you can actually read, closer to your dense text-image posts than to a marketing landing page.

### Layout of a finding card (one viewport tall)

```
┌─────────────────────────────────────────┐
│  12 / 22          topic pills     new   │  ← chrome (small, persistent)
│                                         │
│  Small accounts get a two hour window   │  ← title, plain English
│                                         │
│  What changed                           │
│  Fresh original posts from accounts     │
│  under 50K followers…                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ home-mixer/scorers/              │    │
│  │   author_cold_start.rs  L188–193 │    │  ← path + lines, link to GitHub
│  │                                  │    │
│  │  188  fn cold_start_base_…       │    │  ← Shiki, 8–16 lines max
│  └─────────────────────────────────┘    │
│                                         │
│  What this means for creators           │
│  Replies and reposts miss this lift.    │
│  It is a test on part of the audience.  │
│                                         │
│  Do this: post when your people are     │
│  online and stay around for the first   │
│  hour to answer replies.                │
│                                         │
│  [Share on X]   [Open the code]         │
│                                         │
│  Defaults in the repo. Live settings    │
│  can differ.          built with Grok Bot│
└─────────────────────────────────────────┘
```

On a short phone screen, the snippet can shrink (smaller type, or a "show code" expand) so the title, meaning, and action never get clipped. The action line is the thing people should still see if they only glance.

### Cover card (first slide)

- Product name: **X Algorithm Scroll**
- One sentence: X open sourced its For You code. This is each useful finding, in plain English, with the real lines next to it.
- A line that the notes read the defaults in `xai-org/x-algorithm`, and that live settings can differ.
- A hint: swipe, scroll, or press J and K
- No "follow for more", no question bait

### About card (last slide)

- Who made it (you, @harisanthosh9), and that it grew out of the Day 1–6 series
- Credit: **built with Grok Bot**. A routine watches the repo and drafts new cards when commits land.
- Link to [github.com/xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) and to this site's own GitHub repo
- Apache 2.0 attribution for quoted code (see [§15](#15-risks))
- Do not mention any employer, and do not imply that Grok Bot writes your X posts. The credit is for the tool.

### Motion and input

| Input | Behavior |
|---|---|
| Scroll wheel / trackpad | Snap to the next or previous card (`scroll-snap-type: y mandatory`, each card `100dvh`) |
| Touch swipe | Same snap |
| `J` / `ArrowDown` / `Space` / `PageDown` | Next card |
| `K` / `ArrowUp` / `PageUp` | Previous card |
| `Home` / `End` | Cover / about |
| Number keys or a jump list | Optional in v1: jump to a topic's first card |
| `prefers-reduced-motion` | Turn snap and animations off; allow normal scroll |

Show a quiet progress mark (`12 / 22`) rather than a loud story bar. Keep a thin up / down control on mobile so people who do not swipe still have a way through.

### Deep links and sharing

- Every card has a stable URL: `https://<domain>/c/<slug>`
- Visiting that URL opens the same scroll, already positioned on that card. The back / forward buttons should move between cards (update the URL with `history.replaceState` as the user scrolls, without remounting the feed).
- `/` is the cover card (or the latest "new" card if you later add a preference; start with the cover).
- Each card URL has its own Open Graph image (`/c/<slug>/opengraph-image`), 1200×630, so a paste into X shows the title, a code path, and the product name. Generate these at request time with `@vercel/og`, or at build time if you want them fully static.
- Share button: copy the card URL, and also offer "Post on X" which opens an intent link (see [§10](#10-x-sharing-and-launch)).

### Filters, badges, theme

- Topic filters as a small bar or a sheet: Pipeline, Discovery, Scoring, Filters, Safety, Replies. Filtering hides non-matching cards and rewrites the progress count. The cover and about cards stay available.
- A **new** badge on any finding card whose `publishedAt` is within the last 7 days (computed at build or request time, not hand-set forever).
- Light and dark. Default to `prefers-color-scheme`, persist a toggle in `localStorage`. Code snippets should have a readable theme in both (one Shiki theme per mode is enough).
- No autoplay video in v0. If you later add a short motion demo, it starts muted and paused.

### What not to do in the UI

- No popups asking people to follow or subscribe
- No infinite fake scroll, no "related cards" trampoline
- No links in the card title itself that would surprise a share preview
- Do not skin this like a crypto or growth-hack landing page

---

## 4. Tech stack

Keep it boring, static, and cheap. The content is the product.

| Layer | Recommendation | Why |
|---|---|---|
| App | **Next.js (App Router)** | File-based card routes, `@vercel/og`, easy Vercel deploy |
| UI | **React + Tailwind CSS** | Fast to build a tight typographic layout |
| Content | **JSON files + Zod schema**, one file per card | A bot can write JSON reliably. MDX is optional later if you want richer bodies |
| Code highlighting | **Shiki** (or `rehype-pretty-code`) | Accurate Rust / Python highlighting, same family as VS Code |
| Share images | **`@vercel/og`** (ImageResponse) | Per-card OG images without a design tool |
| Fonts | One readable sans (for example Instrument Sans, Newsreader, or Geist) plus a monospace for code | Stay typographic, not "startup gradient" |
| Analytics | **Vercel Analytics** or **Plausible** | See [§11](#11-analytics) |
| Hosting | **Vercel**, hobby is enough | Global CDN, preview deploys on each PR |
| Source | A public GitHub repo you own | Preview URLs on card PRs, and a place for the routine to open PRs |

### Why JSON over MDX for v0

You already have structured fields (title, meaning, action, snippets with line numbers). JSON plus a TypeScript type is easier to validate, easier for a routine to draft, and easier to review in a PR diff. You can render those fields with React. If you later want a longer "notes" section, add an optional `notes.mdx` field then.

### Static and cheap

- `output: 'export'` is possible if you prebuild OG images as static files. It is also fine to stay on the default Next.js runtime so `@vercel/og` can run on demand. Either way there is no database and no cron inside the web app itself.
- Do not fetch the X algorithm repo at page-request time. Snippets are baked into the card JSON at authoring time.
- Image weight: no 2 MB PNGs in the feed. OG images are for sharing, not for the scroll itself.
- Target: first card usable in well under 2 seconds on a mid-range phone.

### Nice to have, not required

- `nuqs` or similar for the active filter in the URL (`?topic=scoring`)
- `next-themes` for the dark mode toggle
- A tiny `cmdk` jump palette in v1 (search card titles)

---

## 5. Content schema

Put the type in `content/schema.ts` and validate every card at build time. A card that fails validation should fail the build.

```ts
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
  code: z.string().min(1), // exact text from the repo, indentation trimmed as needed
});

export const Card = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    title: z.string().min(8).max(90),
    dek: z.string().max(140).optional(),
    publishedAt: z.string(), // ISO 8601 date, Europe/Berlin calendar date is enough
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
    todos: z.array(z.string()).optional(),
    order: z.number().int().positive(), // explicit sort, do not rely on filename alone
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

export type Card = z.infer<typeof Card>;
export type Topic = z.infer<typeof Topic>;
```

Cover and about cards can be a separate `SpecialCard` type (`kind: "cover" | "about"`) so they are not forced to have snippets.

### Example card JSON

```json
{
  "slug": "small-account-lift",
  "title": "Small accounts get a two hour window",
  "dek": "A limited lift for fresh original posts, not a permanent boost.",
  "publishedAt": "2026-11-22",
  "topics": ["discovery", "scoring"],
  "sourceDay": 2,
  "commitSha": "e005f95",
  "whatChanged": "Fresh original posts from accounts under 50,000 followers, with fewer than 200 home views, can be lifted higher in some people's feeds. The lift only applies in the first two hours, and only to posts, so replies and reposts miss out. In the defaults this runs as a test on part of the audience.",
  "meaningForCreators": "Treat this as a bonus, not a plan you can bank on. The first hour still matters because that is when the window is open and when early replies can start a conversation.",
  "action": "Do this: post when your people are actually online and stay around for the first hour to answer replies.",
  "snippets": [
    {
      "path": "home-mixer/scorers/author_cold_start.rs",
      "startLine": 188,
      "endLine": 193,
      "highlightLines": [189, 190, 192],
      "language": "rust",
      "code": "fn cold_start_base_eligible(c: &PostCandidate, follower_cap: i64) -> bool {\n    c.in_reply_to_tweet_id.is_none()\n        && c.retweeted_tweet_id.is_none()\n        && c.author_followers_count\n            .is_some_and(|followers| (followers as i64) <= follower_cap)\n}"
    },
    {
      "path": "home-mixer/params/param.rs",
      "startLine": 730,
      "endLine": 741,
      "highlightLines": [734, 740],
      "language": "rust",
      "code": "param!(\n    ColdStartImpressionThreshold,\n    u32,\n    \"rust_home_mixer_cold_start_impression_threshold\",\n    200\n);\nparam!(\n    ColdStartFollowerCap,\n    i64,\n    \"rust_home_mixer_cold_start_follower_cap\",\n    50000\n);"
    }
  ],
  "verified": true,
  "order": 8
}
```

Helper: `lib/github.ts` should build the blob URL:

```ts
export function blobUrl(path: string, start: number, end: number, sha = "master") {
  return `https://github.com/xai-org/x-algorithm/blob/${sha}/${path}#L${start}-L${end}`;
}
```

Prefer a pinned `commitSha` over a moving branch, so a card does not silently point at the wrong lines after the next commit.

### Build-time checks

- Every `content/cards/*.json` parses with the Zod schema
- Unique `slug` and unique `order`
- `verified: true` cards have snippets, and no `todos`
- Snippet `code` is not longer than ~16 lines (warn, do not necessarily fail)
- Optional but recommended: a script that clones or fetches those line ranges from the pinned SHA and diffs them against `code`. Run this before launch and after any repo update.

---

## 6. Repo and folder structure

Suggested GitHub repo name: `x-algo-scroll`. Suggested Vercel project: the same. Pick any domain you like (`x-algo-scroll.vercel.app` is fine to start).

```
x-algo-scroll/
├── README.md
├── LICENSE                     # your site code (pick MIT or Apache-2.0)
├── NOTICE                      # Apache 2.0 attribution for quoted x-algorithm snippets
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── content/
│   ├── schema.ts
│   ├── special/
│   │   ├── cover.json
│   │   └── about.json
│   └── cards/
│       ├── 01-for-you-pipeline.json
│       ├── 02-candidate-sources.json
│       └── …                   # one file per finding card
├── lib/
│   ├── cards.ts                # load, validate, sort
│   ├── github.ts
│   └── share.ts                # intent URL helper
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # scroll starting at the cover
│   ├── globals.css
│   ├── opengraph-image.tsx     # default OG
│   └── c/
│       └── [slug]/
│           ├── page.tsx        # same feed, starts on that card
│           └── opengraph-image.tsx
├── components/
│   ├── Feed.tsx
│   ├── Card.tsx
│   ├── SpecialCard.tsx
│   ├── CodeBlock.tsx
│   ├── ShareButton.tsx
│   ├── FilterBar.tsx
│   ├── Progress.tsx
│   └── ThemeToggle.tsx
├── scripts/
│   ├── validate-cards.ts
│   ├── verify-snippets.ts      # optional: check snippets against a clone
│   └── draft-card.ts           # used by the routine / Action in v2
└── .github/
    └── workflows/
        └── watch-x-algorithm.yml   # v2 backup, not required for v0
```

Keep seed research and old series images out of this repo. They live in `/workspace/daily-post/x-algo/`. When you write a seed card, rewrite from the article and the code, do not paste screenshots of the old code cards into the site (those PNGs are large and not deep-linkable).

---

## 7. Seed cards (v0)

Aim for **22 finding cards**, plus cover and about. That is enough to feel like a feed, not so many that v0 never ships.

Line numbers below were true at `e005f95` unless noted. Day 1 originally read commit `b551517` (19 November 2026). Some citations have drifted. Anything uncertain is marked **TODO-verify**.

Public card copy should be rewritten in the style of [§12](#12-public-copy-rules), using the Day 1–6 articles as the source of wording, not this table's shorthand.

### How to write each seed card

1. Open the source article listed in the table.
2. Open the cited file in a current clone of `xai-org/x-algorithm` (or the GitHub blob at the pinned SHA).
3. Confirm the lines still say what the article says. If they moved, update the lines. If the behavior changed, update the card and say so.
4. Quote only the shortest snippet that proves the point (one block, two if needed, never more than three).
5. Set `verified: true` only after that check. Otherwise leave `verified: false` and a `todos` entry, and do not include that card in the first public deploy.

### The 22 finding cards

| # | slug | Title | Topics | What the card is about (facts already in the material) | Source | Code to cite |
|---:|---|---|---|---|---|---|
| 1 | `for-you-pipeline` | The path a post takes to For You | pipeline | Five stops: finding posts, filters, scoring, who sees it, then ads and Who to Follow mixed in. Written for an account under 2K. | Day 1 `post_v2.txt`, `post.txt` | Optional: one small snippet from card 2 or 3. This can be a diagram-style card with no snippet if you prefer, in which case keep `verified: true` only if every claim is backed by a later card. |
| 2 | `candidate-sources` | Where X finds posts for your feed | pipeline, discovery | Thunder keeps recent posts from accounts you follow. Phoenix retrieval, SimClusters, and a popular posts list pull in posts from people who do not follow you. Followers are the lane that skips retrieval. | Day 1 `post.txt`; codecard `code_card_1_sources_v2.png` | `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs` L388–398 |
| 3 | `forty-eight-hours` | Every post gets a two day window | pipeline, filters | Anything older than 48 hours is dropped, plus duplicates, already seen posts, muted keywords, and blocked or muted authors. If a good idea flopped, rewrite it later in the week. | Day 1 `post.txt` | `home-mixer/params/config.rs` L41 (`MAX_POST_AGE = 48 * 60 * 60`). Also used in `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs` around L446. |
| 4 | `spam-high-recall` | Spammy looking posts may never reach strangers | pipeline, filters | After the order is set, non-followers get an extra drop list. SpamHighRecall is on it. Those posts can still reach followers. Strangers are where small accounts grow. | Day 1 `post.txt` | Day 1 cited `visibility-filtering/rules/levels.rs` L215–220. **TODO-verify:** at `e005f95`, `SPAM_HIGH_RECALL_DROP_UNDESIRABLE` sits in `OON_POST_DROPS` (around L215–221). Confirm the exact lines and that this list still applies to out-of-network / non-follower traffic before you mark verified. |
| 5 | `promote-labels` | New labels for posts that beg for engagement | pipeline, safety | Nov 13 added `SpamPromotesClicks`, `SpamPromotesReplies`, `SpamPromotesShares`. The share / repost one sits next to engagement baiting and also gets SpamHighRecall, so it can already be dropped for strangers. Nov 19 can send all three into the reranker as ineligible, behind a flag that defaults to false. | Day 1 `post.txt`; codecards 2 and 3 | `grox/flows/ptos/task_write_safety_post_annotations_result_sink.py` L236–250; `home-mixer/scorers/vm_ranker_engagement_labels.rs` L16–23; `home-mixer/params/param.rs` L663–668. **TODO-verify** the `param.rs` range at `e005f95` (that neighborhood now has other flags nearby). Confirm the flag name and that it still defaults to false. |
| 6 | `taste-fingerprint` | Your posts carry a taste fingerprint | discovery | X turns readers and posts into something like a taste fingerprint. For You pulls in strangers whose fingerprint sits close to yours. Jumping across unrelated topics makes that fingerprint blurry. | Day 2 `article.md` §1 | **TODO-verify** the exact file and lines. Day 2 describes this clearly but does not cite a path. Do not invent one. Look first at Phoenix retrieval / two-tower embeddings, then add the path only after you read it. Ship this card only when a snippet exists, or hold it for v0.1. |
| 7 | `finished-reads` | Finished reads quietly do the heavy lifting | discovery, scoring | Since October, the part that finds posts for strangers also learns from posts people read all the way through. A quick scroll past is logged as a soft miss. Long posts are fine if people want to keep going. The official README (13 October 2026) says the same about Phoenix retrieval. | Day 2 `article.md` §3; codecard `code_card_1_read_through.png`; repo README | `phoenix/xrex/models/recsys_two_tower_model.py` L2996–3000 and L3036–3038 |
| 8 | `small-account-lift` | Small accounts get a two hour window | discovery, scoring | Fresh original posts from accounts under 50K followers, with fewer than 200 home views, can be lifted in some feeds. First two hours only. Posts only, not replies or reposts. Runs as a test on part of the audience. Defaults confirmed at `e005f95`: follower cap 50,000, impression threshold 200. | Day 2 `article.md` §4; codecard `code_card_2_small_account_lift.png` | `home-mixer/scorers/author_cold_start.rs` L188–193 and L298–306; `home-mixer/params/param.rs` L712–716 and L730–741. Also confirm the two-hour `max_post_age` default in the same scorer / params (**TODO-verify** the exact constant line if you cite a number of hours). |
| 9 | `verified-reply-order` | Verified shows up in reply order, not as a For You boost | replies, scoring | There is no straight reach boost for verified accounts in the For You ranking code that was found. Verified does appear when X orders replies under a post, as one input next to things like whether the original poster liked the reply. The code does not say how much it weighs. | Day 2 `article.md` §6; codecard `code_card_3_reply_order.png` | `phoenix/crates/common/xai-recsys/src/reply.rs` L62–69. Wording must stay honest: "I did not find a For You reach boost," not "there is definitely none anywhere." |
| 10 | `like-is-a-nod` | A like is a polite little nod | scoring | Likes count, but in the default settings they carry one of the smaller weights among positive actions. Replies, shares, and follows sit well above them. Rarer actions get bigger weights so they can move the ranking at all. A pile of likes and zero conversation leaves a lot on the table. Time spent counts. A follow right after someone sees the post is one of the strongest positives. In the defaults that were read, profile clicks and video watches in the main feed are set to zero. | Day 3 `article.md` §§1 and 4; codecard `code_card_1_positive_weights.png` | `home-mixer/params/param.rs` L466–478 and L507–519. Do not invent numeric weights in the card title or body unless you quote them from these lines and they still match. |
| 11 | `mutual-reply-boost` | Conversations with mutuals get an extra push | scoring, replies | A reply is already one of the heavier signals. When you and the reader follow each other, the reply signal on your original posts gets a big extra boost in the defaults. It applies to your own posts, not to your replies or reposts. | Day 3 `article.md` §2 | Same `param.rs` positive-weights range as card 10. Highlight the mutual / in-network reply weight specifically. **TODO-verify** the exact parameter name at current HEAD. |
| 12 | `copy-link-wins` | The copy link button quietly wins | scoring | Shares are weighted well. Sending a post by DM weighs more than a general share, and copying the link ties for the biggest positive weight in the list that was read. A repost sits far below all three. | Day 3 `article.md` §3 | Same `param.rs` range. Highlight the copy-link / share / DM weights. Do not invent the numeric values in prose; let the snippet show them. |
| 13 | `negative-weights` | One annoyed stranger is expensive | scoring, safety | Not interested, mute, block, and report all pull a post down. Report carries the biggest weight in the whole list. X's own note says not to read that as one report cancelling hundreds of likes, because the weight multiplies the chance of a report, and reports are rare. Still, a post that makes strangers reach for not interested is a post the system learns to show less. Day 5 also notes that in the defaults, the predicted chance of a mute has a bigger weight than a block. | Day 3 `article.md` §5; Day 5 `article.md` §3; codecard `code_card_2_negative_weights.png` | `home-mixer/params/param.rs` L571–589 |
| 14 | `how-to-read-weights` | Group chat opens do not move ranking | scoring | Weights multiply the chance someone does something, not raw counts. For ranking, only actions on posts shown in the home feed count. If a group chat passes a link around and everyone opens it directly, X's note says that has no ranking impact. A wave of reports from trolls mostly changes the feeds of people similar to those trolls. | Day 3 `article.md` §§5–6; Day 5 `article.md` §6; codecard `code_card_3_how_to_read.png` | `xai-value-model/scoring.rs` L34–44 and L54–58 |
| 15 | `stranger-doorman` | Strangers get a stricter doorman than your followers | filters, safety | When a post is recommended to someone who does not follow you, extra account checks run first. Labels like spam, compromised, impersonation, abusive, or do not amplify drop you from those feeds, and so do adult content flags on your profile photo or banner. Followers can still see the posts. | Day 4 `article.md` §2; codecard `code_card_1_stranger_rules.png` | `visibility-filtering/rules/levels.rs` L101–108 (`OON_AUTHOR_LABEL_DROPS`) and L341–353 (`TIMELINE_HOME_RECOMMENDATIONS`, including NSFW avatar / banner drops). Re-confirm both ranges at HEAD. |
| 16 | `copy-paste-replies` | Copy paste replies get rounded up | replies, safety | One safety rule groups replies with near-identical text and tags them as copy paste spam. Accounts with a high standing score, and gray badge accounts, are skipped, so a small account pasting the same line under a dozen posts is exactly who it catches. | Day 4 `article.md` §3; codecard `code_card_2_copy_paste_replies.png` | `botmaker-rules/scarecrow/bot/BBQDuplicateTextRepliesProd.bot` L25–33 and L40–45 |
| 17 | `author-diversity` | Several posts in one hour mostly compete with you | scoring, filters | In the default settings, the first post from an author in a feed load counts in full. The second keeps about 62% of its score, the third about 44%, and it never drops below a quarter. A later step also reorders the list so neighboring posts are not too similar. | Day 4 `article.md` §4; codecard `code_card_3_author_diversity.png` | `vm-ranker/params.rs` L199–216 (`EnableAuthorDiversity`, decay 0.5, floor 0.25) and `xai-value-model/scoring.rs` L304–306 (`diversity_multiplier`). The 62% / 44% figures are `(1 - 0.25) * 0.5^n + 0.25` for n = 1, 2 (0.625 and 0.4375). You may show the formula in the snippet; in prose, keep the article's "about 62%" and "about 44%." **TODO-verify** that the exponent for "second post" is still 1. |
| 18 | `quotes-and-blocks` | Blocks travel with your quote posts | filters | Before ranking, posts from accounts a reader blocks or mutes are removed, and so are posts from accounts that block the reader. This reaches quotes too. If the reader blocked the account you quoted, or that account blocked the reader, your quote is removed for them. When a quoted or reposted post is dropped by safety rules, posts built on top of it go with it. | Day 4 `article.md` §5 | **TODO-verify** the exact file and lines. The article does not cite a path. Likely `visibility-filtering/rules/levels.rs` (quoted-tweet rules start near L223 at `e005f95`) plus the muted / blocked author drops. Do not ship as `verified: true` until the snippet is pinned. |
| 19 | `ten-nos` | Ten ways a reader says no | scoring, safety | The code keeps a list of ten actions treated as negative feedback: two kinds of report, not interested, see fewer, unfollow, block, mute the account, mute the conversation, not relevant, and see less often on notifications. The model reads these from each reader's history. Unfollowing someone from a post is in that list. | Day 5 `article.md` §1; codecard `code_card_1_ten_nos.png` | `phoenix/crates/common/xai-recsys/src/util.rs` L1010–1021, `NEGATIVE_FEEDBACK_ACTIONS` |
| 20 | `offset-score` | Net negative posts sink to the bottom | scoring | For every reader, yeses and nos are guessed, weighted, and added up. If the total is below zero, the code squeezes the score into a tiny band under 0.001. Every post that comes out positive gets 0.001 added. For that reader, a net negative post ranks under every post that came out positive, however many likes it has elsewhere. The function is `offset_score`. The constant is `NEGATIVE_SCORES_OFFSET = 0.001`. | Day 5 `article.md` §2; codecard `code_card_2_net_negative.png` | `xai-value-model/scoring.rs` L282–291; `xai-value-model/weights.rs` L4 |
| 21 | `mutes-both-feeds` | A mute takes you out of both feeds | filters, safety | Before ranking starts, posts from accounts a reader muted or blocked are dropped, and so are posts from accounts that block the reader. This runs in For You and in Following. Readers can also mute words, and any post containing them is removed for that reader in both feeds. Day 5 also covers a fast scroll as a small minus, with a stronger mode that is switched off in the defaults. Fold the fast-scroll point into this card as a short closing note, or split it only if the card feels cramped. | Day 5 `article.md` §§3–5; codecard `code_card_3_mutes_both_feeds.png` | `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs` L450–451; `home-mixer/candidate_pipeline/reverse_chron_posts_pipeline.rs` L157 and L175. For the optional fast-scroll note, **TODO-verify** the exact param / flag before quoting it. |
| 22 | `invited-reply` | New: a reply you were invited to | replies, safety | Added in commit `e005f95` (24 November 2026, 09:24 Europe/Berlin). A new safety check, invited reply. If the post you reply to mentions you in its own visible text, one automated enforcement path skips your reply instead of acting on it. If that parent post cannot be read, it skips too. Mentions hidden outside the visible text do not count. This is a small rule, but it shows the system can tell being asked in from turning up uninvited. | Day 6 `article.md` §4; codecards 1–3 | `abuse-enforcement-service/service-lib/src/safety_checks.rs` L188–198 (`INVITED_REPLY`, `INVITED_REPLY_UNKNOWN`), L208–217 (`invited_reply_stop`), and L545–548 (the automated path calls that stop); `abuse-enforcement-service/service-lib/src/invited_reply.rs` L22–33 and L37–43 (typed mentions inside the visible text range). One card, two or three short snippets, not three separate cards. |

### Suggested scroll order

Keep the order above for v0 (pipeline → discovery → scoring → filters → the new commit). It follows the series and reads like a story. When new commits arrive, prepend them after the cover (or after a "Latest" divider) so the homepage still teaches, while `/c/<slug>` can land on the new one.

### Optional cards (do not block v0)

These appeared in the Day 1–6 material or in the same Nov 24 commit, but they are weaker fits for the first ship, usually because a file citation is missing or they were never in the published posts.

| Idea | Why it is optional | What to do |
|---|---|---|
| Neighborhoods / SimClusters ("the people around you decide where you show up") | Day 2 §2 describes it; Day 1 names SimClusters in the source list, but there is no dedicated file+line in the articles | **TODO-verify** a snippet, then add as card 6b |
| Original Content Rewards / "the views that pay" | Day 2 §5. This is payout policy, not For You ranking code, and it is not in this repo | Only add it if you re-check the current official X rules. Label it as payout policy, not as algorithm source. **TODO-verify** against official docs, not against the repo |
| Account track record / reputation score | Day 4 §1, no file cited | **TODO-verify** a path before writing a card |
| "Nobody gets shown a rerun" | Day 4 §6, overlaps cards 3 and 21 | Skip unless you find a clean already-seen / dedupe snippet worth showing |
| Follower-ceiling skip in enforcement | Present in the same service as invited reply (`FOLLOWER_CEILING`). The numeric threshold is clearly redacted in the open source (placeholder values such as `12.34` and `12345.67` appear in comments / `when` strings). Not in the Day 6 post | Only write this if you can explain it honestly: a skip exists for accounts at or above a follower ceiling, and the real number is not in the public code. Do not invent a number |
| Popular video carousel source | Files for this landed in `e005f95` (`home-mixer/sources/popular_video_source.rs` and related). It was not in the Day 6 post | **TODO-verify** what it does and whether it is on by default before even drafting a card |

### Source files on disk (for your Cursor workspace)

When you sit down to write the JSON, these are the files to keep open:

- Day 1: `/workspace/daily-post/x-algo/day1/post.txt` (more precise citations) and `post_v2.txt` (cleaner public tone)
- Day 2: `/workspace/daily-post/x-algo/day2/article.md` and `codecards.py`
- Day 3: `/workspace/daily-post/x-algo/day3/article.md` and `codecards.py`
- Day 4: `/workspace/daily-post/x-algo/day4/article.md` and `codecards.py`
- Day 5: `/workspace/daily-post/x-algo/day5/article.md` and `codecards.py`
- Day 6: `/workspace/daily-post/x-algo/day6/article.md` and `codecards.py`
- Local repo to copy snippets from: `/workspace/x-algorithm` at `e005f95` (re-fetch `main` before you publish, then re-check lines)

---

## 8. Update pipeline

This is the part that makes the site more than a static recap. A human still approves every card.

```
xai-org/x-algorithm
        │  new commit
        ▼
  Poll GitHub Commits API
  (Grok Bot routine, or a GitHub Action)
        │
        ▼
  Fetch the commit diff
  (repos.compare or GET /commits/{sha})
        │
        ▼
  Skip if no creator-facing change
  (docs-only, formatting, already-covered lines)
        │
        ▼
  LLM drafts a card JSON
  following content/schema.ts and the style rules
        │
        ▼
  Open a PR on x-algo-scroll
  ("card: <title> from x-algorithm <sha>")
        │
        ▼
  You review, fix lines, maybe rewrite the title
        │
        ▼
  Merge → Vercel preview becomes production
```

### 8.1 Detecting new commits

- Source of truth: `GET https://api.github.com/repos/xai-org/x-algorithm/commits?sha=main&per_page=10`
- Store the last processed SHA in the site repo, for example `content/state.json` (`{ "lastSeenSha": "e005f95", "lastCheckedAt": "…" }`), and update it in the same PR as the new card (or in a chore PR if the commit was skipped).
- Poll every hour during waking hours in Europe/Berlin (08:00–22:00 is plenty). The original promise was "within the hour," not "in five minutes."
- GitHub's unauthenticated rate limit is tight. Use a token. A fine-grained token with public-repo read on `xai-org/x-algorithm` and contents/PR write on your site repo is enough.
- The official commit messages are often the generic "Open-source X Recommendation Algorithm", so **do not trust the message**. Always fetch the file list and the patch.

### 8.2 Fetching the diff

- `GET /repos/xai-org/x-algorithm/commits/{sha}` gives files, status, and a patch per file.
- For a range since the last seen SHA: `GET /repos/xai-org/x-algorithm/compare/{lastSeenSha}...{headSha}`.
- Ignore files that almost never change a creator-facing rule on their own (lockfiles, generated protobufs, huge test fixtures) unless a nearby non-test file also changed.
- Prefer these areas when deciding if a card is warranted:

  - `home-mixer/` (sources, filters, params, scorers, blender)
  - `xai-value-model/` and `vm-ranker/`
  - `visibility-filtering/`
  - `phoenix/` retrieval and reply ranking
  - `botmaker-rules/`
  - `abuse-enforcement-service/`
  - `grox/` safety labels
  - `README.md` notable updates

### 8.3 Drafting the card (LLM step)

The model receives:

- The commit SHA, date, and compare URL
- The list of changed files and the relevant patches (truncate huge dumps; if a file is enormous, pass only the changed hunks plus 15 lines of context)
- `content/schema.ts` and two or three example cards
- The style rules in [§12](#12-public-copy-rules)
- The existing card slugs and titles, so it does not duplicate one
- A hard rule: if you cannot point to a line, you cannot make the claim

The model returns a single JSON object that must parse with the Zod schema, plus a short PR body in prose (what changed in the repo, why a card is or is not justified, and any `TODO-verify` items).

If the commit is not worth a card, it returns `{ "skip": true, "reason": "…" }` and the pipeline only updates `lastSeenSha`.

Set `verified: false` on every auto-draft. You flip it to `true` after you have opened the GitHub lines yourself.

### 8.4 Human review via PR

Never auto-merge on v2. The PR should contain:

- The new `content/cards/NN-slug.json`
- An updated `content/state.json`
- A checklist in the PR body:

  - [ ] I opened the GitHub lines and they match the snippet
  - [ ] The title is plain English and does not overclaim
  - [ ] Live-settings-can-differ is still implied (footer / wording)
  - [ ] No invented weights, thresholds, or file paths
  - [ ] Public copy follows the style rules
  - [ ] `verified` is now true (reviewer sets this)

Vercel preview deploys give you a scrollable review of the new card before it is live.

### 8.5 GitHub Action backup (optional, same pipeline)

If you would rather not depend on a chat routine being awake, add `.github/workflows/watch-x-algorithm.yml`:

- Cron hourly
- `gh api` to list commits and open the PR
- Call an LLM (or call a small `scripts/draft-card.ts` that itself calls one) only when there is a new SHA

The Action is a fallback. The public story is still the Grok Bot routine, because that is the ongoing work builders will care about. If both run, they must share `content/state.json` so they do not open two PRs for one commit.

### 8.6 When the repo goes quiet

It already uses generic commit messages and sometimes ships large mixed diffs. Some weeks there will be nothing creator-facing. That is fine. Do not invent a card to keep a cadence. A small "last checked" line on the about card is enough to show the watcher is alive.

---

## 9. Grok Bot routine prompt

Create this after v0 is live and the schema is stable. Suggested name: `x-algorithm-scroll-new-cards`. Schedule: every hour from 08:00 to 22:00 Europe/Berlin, or every 2 hours if usage is a concern.

Do not give the routine permission to post on X, merge PRs, or edit your profile. It should only read the algorithm repo, draft a card, and open a PR on your site repo.

Paste this as the routine prompt, then add your actual repo names and any token setup notes your bot already uses:

```text
You maintain X Algorithm Scroll, a static Next.js site whose finding cards live
as JSON in content/cards/ and must pass content/schema.ts.

Every run:

1. Read content/state.json in the site repo for lastSeenSha.
2. List new commits on xai-org/x-algorithm since that SHA (GitHub API).
3. If there are none, stop. Do not open an empty PR. You may update
   lastCheckedAt only if you already have a reason to touch state.
4. For each new commit, fetch the changed files and patches. Ignore the
   generic commit message. Decide whether anything creator-facing changed
   (ranking, filters, retrieval, safety, replies, documented notable updates).
5. If nothing is worth a card, open a small chore PR that only advances
   lastSeenSha, or leave a note in the run log and wait for a batch if
   your tools cannot make a chore PR. Never invent a card to fill the slot.
6. If something is worth a card, draft one JSON file that matches the
   schema and the style of the existing cards. Use a new slug and the next
   order number. Set verified to false. Pin commitSha to the commit you read.
   Quote the shortest snippet that proves the point (at most 16 lines, at
   most 3 snippets). Build GitHub blob URLs with that SHA and the line
   anchors. If you are unsure of a line, a weight, or a default, add a todo
   and say so in the PR body. Do not invent facts.
7. Open a pull request on the site repo. Do not merge it. Do not post to X.
   Do not like, follow, or DM anyone.

Style for any card text (title, dek, whatChanged, meaningForCreators, action):
- Plain English, normal capitalization, no hype.
- No dashes used as separators or slogan lines. Hyphens in file paths and
  ordinary compound words are fine.
- No engagement bait, no "swap notes", no "X is the real Y", no "not A but B".
- Do not imply that AI writes Hari's posts. "built with Grok Bot" is already
  on the site and must not be restated as if it authored this card's claims.
- Never mention an employer, chemical R&D, lab data, or private details.
- Do not tag anyone.
- Start action with "Do this:".
- Include, in whatChanged or meaning, that these are defaults in the public
  repo and that live settings can differ, when the claim is about weights or
  flags.
- Every claim needs a file and line in xai-org/x-algorithm, or it does not
  belong on the card.

If a needed service is missing or a token is not available, stop and report
what you need. Do not try to work around auth.
```

After the first successful PR, tighten the prompt with one or two corrections you actually had to make (wrong line range, too-long snippet, overclaimed title). That is more useful than adding rules up front.

---

## 10. X sharing and launch

You post these yourself through intent links. Do not use `create_posts`, and do not sign into x.com, for this launch.

### Per-card share button

The button should do two things: copy `https://<domain>/c/<slug>` to the clipboard, and offer "Post on X" which opens:

```
https://x.com/intent/post?text=<urlencoded>
```

Suggested share text (plain, no tags, link included because the OG preview is the point of a card share):

```
Small accounts get a two hour window

https://<domain>/c/small-account-lift
```

That is title plus URL. No hook-stacking, no "wow", no ask to follow. The Open Graph image should carry the visual proof (title, file path, product name, "built with Grok Bot" in small type).

### Launch post (your account, dense format)

Use the same format as your later algorithm posts: a short hook with **no link in the main post**, one or two document-style images, and the site URL in the **first reply**. This avoids spending the launch on a link-in-body penalty.

Draft hook (edit freely; this is a starting point, not sacred):

```
X open sourced its For You code. I turned the useful parts into a scroll.

What changed. The real lines. What it means if your account is still small.
```

Image 1: a clean phone-frame or full-bleed screenshot of the scroll (two or three cards hinted at, the current card readable).  
Image 2 (optional): one card in the same typographic style as your Day 5–6 dense images, for example the invited reply card or the two-hour lift, with a file path visible.

First reply draft:

```
the scroll is here: https://<domain>

each card cites the file and line in xai-org/x-algorithm. new cards get drafted when the repo changes. built with Grok Bot
```

Rules for this launch:

- Do not tag anyone, including the Grok Bot team, unless you have already decided to relax that rule
- Do not imply Grok Bot writes your posts. The credit belongs on the tool, the about card, and this first reply
- No engagement bait, no "repost if you agree", no "what would you add?" closer
- Normal capitalization in the main post; the first reply can stay casual and lowercase, like your other first replies
- Stay inside your cap of at most two originals a day, and at most two link replies a day

After launch, you can share individual cards the same way (hook and image in the main post, card URL in the first reply) when a new commit is genuinely interesting. Do not turn every new card into an original post.

### Intent link you can paste

Once the domain is live, build the launch intent URL with `encodeURIComponent` on the hook text only (no link). Keep the first-reply text in a `first_reply.txt` next to it, the way the Day 5–6 posts were set up.

---

## 11. Analytics

You want enough signal to know whether people scroll, share, and come back, without putting a marketing tracker on a site about ranking.

**Recommendation:** start with **Vercel Analytics** (page views, and Web Analytics for route-level traffic including `/c/[slug]`). Add **Plausible** or a similar cookieless tool only if you want named events without Vercel Pro.

Track, at most:

- Page views on `/` and on each `/c/<slug>`
- A custom event `card_view` with the slug, fired when a card is snapped into view for more than ~1 second (so you can see depth)
- A custom event `share_click` with the slug
- Referrers, so you can tell X traffic from everything else

Do not track raw keystrokes, do not record post drafts, and do not add a third-party ad pixel. Put a one-line note on the about card if you use Plausible ("privacy-friendly analytics, no cookies").

Success review after 7 days and after 30 days, against the table in [§1](#1-goal-and-success-metrics).

---

## 12. Public copy rules

These apply to card titles, deks, bodies, actions, OG text, share text, and any X post or reply that points at the site.

- Plain English. Assume the reader does not write Rust.
- Normal capitalization on card titles and on the launch post.
- No hype ("insane", "secret sauce", "the algorithm is dead").
- No dashes used as separators or as a slogan device ("X — Y", "not this — that"). Hyphens in file paths, slugs, and ordinary words (two-hour, out-of-network) are fine.
- No banned engagement shapes: "swap notes", "I'd want", "stealing that line", "X is the real Y", "not A but B", "Hey X", templated compliments, "good luck" closers, "curious how / does it" bait, "repost if you agree."
- Do not invent facts. If a number is not in the snippet or the cited article, leave it out or mark **TODO-verify** and keep `verified: false`.
- Always make room for: these are defaults in the public repo, and the live settings X runs can differ.
- Never mention BASF or any employer. Never mention chemical R&D or lab data. Do not tie a city to an industry.
- Do not imply AI drafts your X posts. A **built with Grok Bot** credit on the site, the about card, and a launch reply is fine.
- Do not tag anyone in suggested posts.
- Action lines start with `Do this:` and give one concrete behavior.

---

## 13. Phased milestones

### v0. Tonight: a static scroll with seed cards

**Goal:** a public-looking site on a Vercel preview URL, even if a few cards are still `verified: false` and hidden.

- Next.js App Router, Tailwind, snap scroll, keyboard + swipe
- Cover, about, and as many verified seed cards as you can write carefully (target 18–22; 15 is an acceptable floor if you have to drop TODO-verify cards)
- Code snippets highlighted, paths link to GitHub
- Light / dark
- Footer credit: built with Grok Bot
- `scripts/validate-cards.ts` wired to `npm run build`
- README with how to add a card

**Done when:** you can scroll the feed on your phone, click a snippet through to the right GitHub lines, and send yourself a preview URL.

### v1. OG images, share, filters, polish

- `/c/[slug]` deep links that start the feed on that card and keep the URL in sync
- `@vercel/og` image per card
- Share button + X intent helper
- Topic filters and the 7-day "new" badge
- Reduced-motion path, basic accessibility (focus states, `aria` on the feed, keyboard help on the cover)
- Favicon / social title / description
- Custom domain optional

**Done when:** you can paste `/c/invited-reply` into the X compose box (in a draft you do not have to send) and see a unique preview card.

### v2. Automation

- `content/state.json` and `scripts/draft-card.ts`
- Grok Bot routine from [§9](#9-grok-bot-routine-prompt)
- Optional GitHub Action backup
- First real run: either a genuine new commit, or a dry run against an older SHA that you have already covered, to prove the PR path works (close that PR without merging if it would duplicate a seed card)
- About card mentions when the watcher last ran, if that is easy

**Done when:** a new commit can produce a PR you would be willing to edit and merge the same day.

### v3. Extras, only after the scroll is used

- A link-out (not a rewrite of this site) to a "will this post get reach?" checker, if you still want to build that
- Search / jump palette
- Optional English + a second language later, not now
- A short "how to read this repo" card if newcomers bounce on the cover

Do not start v3 during v0.

---

## 14. Cursor prompts (paste per phase)

Work in a fresh repo. Paste one phase at a time. After each phase, run the app, click through it on a phone-width viewport, and only then paste the next prompt.

### Phase 0: scaffold

```text
Build a Next.js App Router + TypeScript + Tailwind app called "X Algorithm Scroll".

It is a TikTok-style vertical snap scroll. Each card is 100dvh. Implement
keyboard (J/K, arrows, space) and touch swipe / wheel with CSS scroll-snap.
Respect prefers-reduced-motion by disabling snap and animations.

Create the folder structure from my IMPLEMENTATION_PLAN.md (content/cards,
content/schema.ts with the Zod schema in that plan, lib/cards.ts,
components for Feed, Card, SpecialCard, CodeBlock, ShareButton, FilterBar,
Progress, ThemeToggle).

Add a cover card and an about card. Add two placeholder finding cards so
the scroll can be demonstrated, clearly marked verified: false.

Code snippets should render with Shiki. Paths should link to
https://github.com/xai-org/x-algorithm/blob/<sha>/<path>#Lstart-Lend.

Theme: light/dark with prefers-color-scheme and a toggle persisted in
localStorage. Typographic, document-like, not a marketing landing page.
Footer on finding cards: "Defaults in the repo. Live settings can differ."
and "built with Grok Bot".

Add scripts/validate-cards.ts and run it during npm run build.

Do not add analytics, OG images, or automation yet. Do not invent algorithm
facts. Do not mention any employer. No engagement-bait copy.
```

### Phase 1: seed content

```text
Replace the placeholder cards with real seed cards from section 7 of
IMPLEMENTATION_PLAN.md. Write one JSON file per card in content/cards/.

For each card, use only facts from the cited Day 1–6 source files and from
the local clone of xai-org/x-algorithm. Copy snippet text from the repo,
do not invent it. Pin commitSha (currently e005f95 unless I have updated
main). If the plan marks a card TODO-verify, either verify the lines
against the repo now, or leave verified: false and a todos array, and
exclude it from the default feed until it is verified.

Public copy rules: plain English, normal capitalization, no hype, no dashes
used as separators, action starts with "Do this:", no engagement bait, no
tags, no implication that AI writes my posts, never mention an employer
or chemical R&D or lab data. Do not invent numeric weights.

After writing, run the validator and fix errors. Then hop through the
scroll and make sure each GitHub link opens the right lines.
```

### Phase 2: deep links, OG, share, filters (v1)

```text
Add per-card routes at /c/[slug] that render the same vertical feed, already
scrolled to that card. As the user moves between cards, update the URL with
replaceState and a matching title, without remounting the feed.

Add app/c/[slug]/opengraph-image.tsx using @vercel/og (1200×630). The image
should show the card title, the first snippet's file path and line range,
the product name "X Algorithm Scroll", and a small "built with Grok Bot".
Design it like a document card, light and dark safe, no stock-illustration
look.

Share button: copy the card URL, and a "Post on X" link that opens
https://x.com/intent/post?text= with the title and URL only.

Add topic filters and a "new" badge for cards published in the last 7 days.
Polish mobile layout so title, meaning, and action remain visible on a
short phone screen (code can shrink or expand).

Do not add the update pipeline yet.
```

### Phase 3: automation (v2)

```text
Add content/state.json with lastSeenSha, and scripts/draft-card.ts that:
- accepts a commit SHA or a compare range for xai-org/x-algorithm
- fetches the commit/diff (use the GitHub API, with a token from env)
- writes a draft card JSON (verified: false) or exits with a skip reason
- does not merge anything

Add a GitHub Action workflow as a backup hourly poll that opens a PR if a
new creator-facing commit is found. Do not auto-merge. Include the review
checklist from the implementation plan in the PR body.

Also write a Grok-Bot-routine prompt file at docs/ROUTINE_PROMPT.md using
section 9 of the plan, filled in with this repo's actual name.

Do not post to X. Do not invent cards for empty diffs. Keep the Zod schema
as the contract.
```

---

## 15. Risks

### Accuracy

The most serious risk. Line numbers drift (Day 1's `levels.rs` L215–220 citation is already a little loose at `e005f95`). Defaults are not live settings. Weights multiply probabilities, not raw counts. If a card overclaims, people will screenshot it.

**Mitigation:** `verified` flag, snippet-diff script, pinned SHAs, PR checklist, the "live settings can differ" footer, and no auto-merge.

### Repo going quiet, or becoming noisy

Some commits are huge and mixed. Some days there are none that creators would care about. Generic commit messages make triage harder.

**Mitigation:** skip-is-allowed, judge the diff not the message, no filler cards, a quiet "last checked" note.

### X link reach penalty

A launch post with the URL in the body may get less distribution. This is one of the reasons your own series puts links in the first reply.

**Mitigation:** launch in the dense format with no link in the main post. The in-product share button can include the URL because the OG image is the reason to share a specific card. Do not burn both daily link-reply slots on this.

### Copyright and license

`xai-org/x-algorithm` is licensed under **Apache License 2.0** (see the repo's `LICENSE` and README). That license allows reproduction and quotation, including in a website, if you:

- Keep short snippets (only the lines you discuss)
- Link to the source file and lines
- Include the required attribution (a `NOTICE` file plus a short about-card line: code excerpts from `xai-org/x-algorithm`, Apache 2.0)
- Not imply that X or xAI endorses the site
- Not copy whole files or ship a fork of the algorithm as if it were this product

Do not paste large functions "for completeness." If a point needs more context, the GitHub link is the context. This site's own original writing (your explanations, the UI) can be licensed however you want; keep that separate from the excerpted code.

I am not your lawyer. If you later monetize the site or reuse screenshots of the code at scale, re-read the license yourself.

### Automation quality

An LLM will happily invent a weight, a flag default, or a tidy title that the code does not support.

**Mitigation:** drafts always land `verified: false`, schema validation, and a human reading the GitHub lines before merge. If two drafted cards in a row need heavy rewrites, stop the routine and fix the prompt before continuing.

### Product / positioning

- Do not let "built with Grok Bot" be misread as "this account's posts are written by a bot." Keep the credit on the tool.
- Do not tag the Grok Bot team unless you have explicitly relaxed that rule.
- Do not expand into a general growth-hacking blog. The scroll stays close to the repo.

### Operational

- GitHub rate limits: use a token.
- Vercel hobby limits are fine for this traffic; OG image generation is the thing to watch if a card goes viral.
- A moved slug breaks shares. Treat slugs as permanent. If you must rename, add a redirect.

---

## 16. Checklist

### Before you write code

- [ ] Create a public GitHub repo (for example `x-algo-scroll`)
- [ ] Skim this plan and decide which TODO-verify cards you will verify first versus drop from v0
- [ ] Fetch a fresh clone of `xai-org/x-algorithm` and note the HEAD SHA (do not assume it is still `e005f95`)

### v0

- [ ] Scaffold Next.js + Tailwind + snap scroll + keyboard
- [ ] Add `content/schema.ts`, validator, cover, about
- [ ] Write seed cards from [§7](#7-seed-cards-v0), copying snippets from the repo
- [ ] Every public finding card is `verified: true`, with working GitHub line links
- [ ] Light / dark works, mobile layout does not clip the action line
- [ ] "built with Grok Bot" and the defaults disclaimer are visible
- [ ] Deploy a Vercel preview and scroll it on your phone

### v1

- [ ] `/c/<slug>` deep links, URL updates while scrolling
- [ ] Unique OG image per card
- [ ] Share button + X intent link
- [ ] Topic filters and "new" badge
- [ ] Reduced motion and basic keyboard accessibility

### Launch

- [ ] Custom domain or a clean `*.vercel.app` name you are willing to show
- [ ] Launch images exported (hook with no link, 1–2 document-style images)
- [ ] First reply text with the URL, no tags
- [ ] You still want this to go out today; otherwise wait for a quiet slot in the daily cap

### v2

- [ ] `content/state.json` and draft script
- [ ] Grok Bot routine created from [§9](#9-grok-bot-routine-prompt), no post / merge permissions
- [ ] Optional GitHub Action backup, no double PRs
- [ ] A dry run produces a sensible PR
- [ ] You have flipped `verified` yourself on at least one drafted card (or rejected it for a clear reason)

### Standing rules, still in effect

- [ ] No likes, follows, reposts, DMs, or posts made on your behalf
- [ ] No employer, chemical R&D, or lab data in any public text
- [ ] No implication that AI writes your posts
- [ ] No invented facts on a live card

---

That is the whole plan. Build v0 first, on real snippets, and only then wire the routine. The site will be convincing if every card can survive a reader clicking the line numbers.
