# X Algorithm Scroll

A full-screen, snap-scroll feed of findings from X's open source For You code. Each card has a plain English title, what changed, short real code excerpts with links to the exact GitHub lines, what it means for creators, and one action line.

Built with Next.js (App Router), React, Tailwind CSS, Shiki, and Zod. No database, no paid services, no runtime fetch of the source repo. Snippets are copied into the card JSON at authoring time.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # validates all cards first, then builds
npm run start      # serve the production build
npm run validate   # card checks only
npm run lint
```

Routes:

- `/` opens on the cover card
- `/c/<slug>` opens the same feed already positioned on that card
- `/c/<slug>/opengraph-image` is the share image (1200 by 630)
- `/opengraph-image` is the site default

Controls: `J` / `ArrowDown` / `Space` / `PageDown` go to the next card, `K` / `ArrowUp` / `Shift+Space` / `PageUp` go back, `Home` and `End` jump to the cover and the about card. Touch and trackpad snap between cards. Topic filters sit in the top bar. The theme toggle is saved in `localStorage`. Reduced motion turns off snap and smooth scroll.

## Add or change a card

1. Create `content/cards/NN-slug.json` (copy an existing card). Validate against `content/schema.ts`.
2. Copy snippet text exactly from the repo at the pinned `commitSha`. Keep each snippet to 16 lines or fewer and at most three per card. `startLine`/`endLine` must match the number of code lines.
3. Set `verified: true` only after you have opened the GitHub lines and checked them. Unverified cards stay hidden from the feed. Put the open questions in `todos`.
4. Run `npm run validate`. The build fails on any invalid card.

`action` must start with `Do this:`. Public copy must not use en or em dashes as separators. The validator checks both.

## Content status (v0)

- 9 verified finding cards are live. Each one is checked against the cited lines at `xai-org/x-algorithm` commit `e005f95`.
- 1 finding card (`author-diversity`) is in the repo but hidden, with open todos about the per-position exponent and the default flag.
- Cover and about cards are included.
- The plan's seed list has 22 finding cards. The rest are not written yet, because each needs its lines checked against the source first. The plan allows only verified cards in the first public deploy.

Decisions made without asking (change them if you want):

- Publish dates for seed cards are the build date, `2026-11-25`, so the "new" badge shows for 7 days from then. The badge is computed at build time, and the cache refreshes it.
- Commit pin is `e005f95`, the commit the plan's line numbers refer to. The upstream `main` has moved on; re-verify against the current HEAD before adding new cards.
- Cards are static with a cached data loader (`"use cache"`), so the pages prerender.
- License for this site's own code is MIT. Quoted excerpts from `xai-org/x-algorithm` are Apache 2.0, attributed in `NOTICE`.
- Analytics are not added yet (the plan lists Vercel Analytics as an option).

## Not built yet (from the plan)

- v2 automation: `content/state.json`, a draft script, a GitHub Action, and the Grok Bot routine. These need tokens and a bot setup, and no card drafts are generated automatically yet.
- The snippet-diff check (`scripts/verify-snippets.ts`) that compares excerpts with the pinned commit.
- Custom domain.

## Credit

Built with Grok Bot. Code excerpts come from [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) under the Apache License 2.0. See `NOTICE`.
