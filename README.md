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

## Keep the cards in sync with upstream

A daily GitHub Action (`.github/workflows/sync-upstream.yml`) checks `xai-org/x-algorithm` and opens a pull request when a card's cited upstream lines have changed. The check is `scripts/sync-from-upstream.mjs`. It uses only Node built-ins, so it runs on Node 20 with no `npm install`.

How it works:

1. It reads the default branch's latest commit through the GitHub API.
2. For each distinct `commitSha` pin on the cards, it compares that pin with the latest commit (compare API).
3. A card gets `"needsReview": true` only when the content of a cited range changed: a line inside `startLine`..`endLine` was changed or removed, lines were inserted inside the range, or the file was renamed, removed, or added. Line numbers that only moved (same content, shifted by an edit above) are listed in the report but do not flag the card.
4. It writes `content/upstream.json` (`latestSha`, `lastCheckedAt`) and `content/sync-report.json` (every changed file, which cards are flagged, and shifted line ranges).
5. If a card was newly flagged, or a tracked upstream file changed, the workflow opens a pull request on branch `automated/sync-upstream`. It does not merge. A run where nothing new happened does not open a PR, so a daily run never reopens the same review.

What the sync never does: rewrite card prose, claims, or snippet text, or change `commitSha`. Those stay human-reviewed. To clear a flag, open the cited lines at the new commit, update the card's `snippets` and `commitSha` if they still match, and remove `needsReview`. Blob links are pinned to `commitSha`, so existing links keep working until you bump the pin.

Running it locally:

```bash
npm run sync:dry-run   # fetch, print the result, write nothing
npm run sync:upstream  # fetch and write content/upstream.json and content/sync-report.json
```

Options: `--offline` makes no network calls. `--fixture <file.json>` replays API responses from a file, for tests. `--pr-body <file>` writes the PR body. `--strict` exits 1 when the run is skipped. A token is not needed. Set `GITHUB_TOKEN` if you hit the unauthenticated rate limit (60 requests an hour). When GitHub is unreachable or rate-limits the run, the script logs `skipped`, changes nothing, and exits 0 (1 with `--strict`).

Repository setting: the workflow uses the built-in `GITHUB_TOKEN` and declares its own permissions (`contents: write`, `pull-requests: write`). One repo setting must be on: Settings, Actions, General, "Allow GitHub Actions to create and approve pull requests". The workflow needs no other secrets. The first run only happens on the daily schedule or from the Actions tab via "Run workflow".

`npm run build` also runs `scripts/verify-build.mjs` after the build. It fails if the prerendered feed does not contain every expected slide (cover, every verified card in `order`, about), so a missing or reordered card breaks the build instead of shipping.

## Not built yet (from the plan)

- The Grok Bot routine and card drafting (`scripts/draft-card.ts`). Cards are still written and checked by hand. The sync only flags cards.
- The snippet-diff check (`scripts/verify-snippets.ts`) that compares excerpts with the pinned commit's text.
- Custom domain.

## Credit

Built with Grok Bot. Code excerpts come from [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) under the Apache License 2.0. See `NOTICE`.
