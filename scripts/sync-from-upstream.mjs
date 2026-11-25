#!/usr/bin/env node
/**
 * Sync check against the upstream source repo (xai-org/x-algorithm).
 *
 * What it does:
 *   1. Resolves the upstream default branch and its latest commit.
 *   2. For each distinct `commitSha` pin used by the cards, compares that pin with the
 *      latest commit (GitHub compare API).
 *   3. Flags a card with `needsReview: true` when the content of a cited range changed
 *      upstream: a removed or changed line inside startLine..endLine, lines inserted
 *      inside the range, or a file-level event (renamed, removed, added, no patch
 *      returned, or a truncated compare). Line numbers that only shifted (the content
 *      is the same) are reported as info, not flagged.
 *   4. Writes content/upstream.json (latest SHA, lastCheckedAt) and
 *      content/sync-report.json (every changed file, per-card reasons and shifts).
 *
 * What it does NOT do:
 *   - It never rewrites card prose, claims, snippet text, or `commitSha`. A human
 *     re-checks the lines, updates the pin and the snippet, then removes the flag.
 *     The blob links on a card are pinned to its commitSha, so they keep working.
 *   - It needs no token (xai-org/x-algorithm is public). If GITHUB_TOKEN or GH_TOKEN is
 *     set it is used for a higher rate limit. Network errors and rate limits end the
 *     run with status "skipped" and exit 0 (exit 1 with --strict). Nothing is changed.
 *
 * Flags:
 *   --dry-run        print the result, write nothing
 *   --offline        make no network calls (status "skipped")
 *   --fixture <json> read API responses from a JSON file keyed by API path (for tests)
 *   --pr-body <file> write a markdown PR body when there is something to review
 *   --strict         exit 1 when the run is skipped
 *
 * Outputs for GitHub Actions: `changed=true|false` and `status=...` go to $GITHUB_OUTPUT.
 */
import { existsSync, readFileSync } from "node:fs";
import { appendFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARDS_DIR = path.join(ROOT, "content", "cards");
const UPSTREAM_FILE = path.join(ROOT, "content", "upstream.json");
const REPORT_FILE = path.join(ROOT, "content", "sync-report.json");

const REPO = "xai-org/x-algorithm";
const API = "https://api.github.com";
const COMPARE_FILE_LIMIT = 300; // GitHub returns at most 300 files per compare call
const TIMEOUT_MS = 15_000;

class SyncError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind;
  }
}

function parseArgs(argv) {
  const opts = { dryRun: false, offline: false, strict: false, fixture: null, prBody: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--offline") opts.offline = true;
    else if (a === "--strict") opts.strict = true;
    else if (a === "--fixture") opts.fixture = argv[++i];
    else if (a === "--pr-body") opts.prBody = argv[++i];
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

/** Returns a function that GETs an API path and resolves to parsed JSON. */
function makeClient(opts) {
  if (opts.fixture) {
    const table = JSON.parse(readFileSync(opts.fixture, "utf8"));
    return async (apiPath) => {
      if (!(apiPath in table)) throw new Error(`fixture has no response for ${apiPath}`);
      // A fixture entry of the form {"__error": {"kind": "rate-limit", "message": "..."}} simulates a failed call.
      if (table[apiPath] && table[apiPath].__error) {
        throw new SyncError(table[apiPath].__error.message, table[apiPath].__error.kind);
      }
      return table[apiPath];
    };
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "x-algo-scroll-sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return async (apiPath) => {
    let res;
    try {
      res = await fetch(`${API}${apiPath}`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      throw new SyncError(`network error for ${apiPath}: ${err.message}`, "network");
    }
    if (res.status === 403 || res.status === 429) {
      throw new SyncError(`GitHub rate limit or access refused (HTTP ${res.status}) for ${apiPath}`, "rate-limit");
    }
    if (!res.ok) throw new SyncError(`HTTP ${res.status} for ${apiPath}`, "http");
    return res.json();
  };
}

async function loadCards() {
  const names = (await readdir(CARDS_DIR)).filter((n) => n.endsWith(".json")).sort();
  return Promise.all(
    names.map(async (name) => {
      const file = path.join("content", "cards", name);
      const raw = await readFile(path.join(ROOT, file), "utf8");
      return { file, raw, data: JSON.parse(raw) };
    }),
  );
}

async function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Parses a unified diff patch (from the compare API) into line changes on the old side.
 *   del: old line `old` was removed or changed.
 *   ins: new lines were inserted between old lines `a` and `b` (b = a + 1).
 */
function parsePatch(patch) {
  const changes = [];
  let oldLine = 0;
  for (const line of patch.split("\n")) {
    const m = /^@@ -(\d+)(?:,(\d+))? \+\d+(?:,\d+)? @@/.exec(line);
    if (m) {
      const oldStart = Number(m[1]);
      const oldLen = m[2] === undefined ? 1 : Number(m[2]);
      // A zero-length old range means "insert after line oldStart".
      oldLine = oldLen === 0 ? oldStart + 1 : oldStart;
      continue;
    }
    if (oldLine === 0) continue;
    if (line.startsWith("-")) {
      changes.push({ type: "del", old: oldLine });
      oldLine++;
    } else if (line.startsWith("+")) {
      changes.push({ type: "ins", a: oldLine - 1, b: oldLine });
    } else if (line.startsWith(" ")) {
      oldLine++;
    }
  }
  return changes;
}

/** Where old line `line` ends up after the patch: net shift from insertions and deletions above it. */
function mapOldToNew(line, changes) {
  let shift = 0;
  for (const c of changes) {
    if (c.type === "ins" && c.b <= line) shift++;
    if (c.type === "del" && c.old < line) shift--;
  }
  return line + shift;
}

function dedupeReasons(list) {
  const seen = new Set();
  return list.filter((r) => {
    if (seen.has(r.reason)) return false;
    seen.add(r.reason);
    return true;
  });
}

/**
 * Impact of one compare on one cited snippet.
 *   reasons: why the cited content may no longer match (flags the card).
 *   shifted: the content is the same but its line numbers moved (info only), or null.
 * `files` is the compare result for the card's pinned commit -> latest commit.
 */
function snippetImpact(snippet, files) {
  const p = snippet.path;
  const range = `L${snippet.startLine}-L${snippet.endLine}`;
  const fileEntry = files.find((f) => f.filename === p);

  if (!fileEntry) {
    const moved = files.find((f) => f.previous_filename === p);
    if (moved) return { reasons: [{ path: p, range, reason: `renamed to ${moved.filename} upstream` }], shifted: null };
    return { reasons: [], shifted: null };
  }
  if (fileEntry.status === "removed") {
    return { reasons: [{ path: p, range, reason: "file removed upstream" }], shifted: null };
  }
  if (fileEntry.status === "renamed") {
    return { reasons: [{ path: p, range, reason: `file renamed from ${fileEntry.previous_filename}` }], shifted: null };
  }
  if (fileEntry.status === "added") {
    return { reasons: [{ path: p, range, reason: "file did not exist at the pinned commit" }], shifted: null };
  }
  if (typeof fileEntry.patch !== "string") {
    return { reasons: [{ path: p, range, reason: "file changed, no patch returned; review manually" }], shifted: null };
  }

  const s = snippet.startLine;
  const e = snippet.endLine;
  const changes = parsePatch(fileEntry.patch);
  const reasons = [];
  for (const c of changes) {
    if (c.type === "del" && c.old >= s && c.old <= e) {
      reasons.push({ path: p, range, reason: `line ${c.old} changed upstream` });
    }
    // Inserted between two old lines that are both inside the cited range.
    if (c.type === "ins" && c.a >= s && c.b <= e) {
      reasons.push({ path: p, range, reason: `lines inserted inside the range, after line ${c.a}` });
    }
  }

  const newStart = mapOldToNew(s, changes);
  const newEnd = mapOldToNew(e, changes);
  const shifted =
    newStart !== s || newEnd !== e ? { path: p, range, newRange: `L${newStart}-L${newEnd}` } : null;
  return { reasons: dedupeReasons(reasons), shifted };
}

/** Adds or removes the `"needsReview": true` line. A text edit, so the card's formatting is kept. */
function withNeedsReview(raw, value) {
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  let next;
  if (value) {
    if (/^[ \t]*"needsReview":\s*true/m.test(raw)) return raw;
    const m = /^([ \t]*)"verified":/m.exec(raw);
    if (!m) throw new Error('cannot place needsReview: no "verified" line found');
    next = raw.slice(0, m.index) + `${m[1]}"needsReview": true,${eol}` + raw.slice(m.index);
  } else {
    next = raw.replace(/^[ \t]*"needsReview":\s*(?:true|false)[ \t]*,?[ \t]*\r?\n/m, "");
  }
  JSON.parse(next); // never write a card that no longer parses
  return next;
}

function summarizeFile(f) {
  return {
    filename: f.filename,
    status: f.status,
    ...(f.previous_filename ? { previousFilename: f.previous_filename } : {}),
    additions: f.additions ?? 0,
    deletions: f.deletions ?? 0,
  };
}

function buildPrBody(report) {
  const lines = [];
  lines.push(`## Upstream sync: ${REPO}`);
  lines.push("");
  lines.push(
    `Latest \`${report.upstream.defaultBranch}\` is \`${report.upstream.latestSha.slice(0, 7)}\` (checked ${report.checkedAt}). ` +
      "This PR flags cards and records the upstream state. Card prose, claims, snippet text and `commitSha` are not changed.",
  );
  lines.push("");
  const flagged = report.cards.filter((c) => c.reasons.length > 0);
  lines.push(`### Cards flagged \`needsReview\` (${flagged.length})`);
  if (flagged.length === 0) lines.push("- none");
  for (const c of flagged) {
    lines.push(`- **${c.slug}** (\`${c.file}\`, pinned \`${c.commitSha ?? "none"}\`)`);
    for (const r of c.reasons) lines.push(`  - \`${r.path}\` ${r.range}: ${r.reason}`);
  }
  lines.push("");
  const shifted = report.cards.flatMap((c) => c.shifted.map((s) => ({ slug: c.slug, ...s })));
  lines.push(`### Line numbers moved, content unchanged (${shifted.length}, not flagged)`);
  if (shifted.length === 0) lines.push("- none");
  for (const s of shifted) lines.push(`- ${s.slug}: \`${s.path}\` ${s.range} is now ${s.newRange} at the latest commit`);
  lines.push("");
  lines.push(`### Tracked upstream files changed (${report.trackedChanges.length})`);
  if (report.trackedChanges.length === 0) lines.push("- none");
  for (const f of report.trackedChanges) lines.push(`- \`${f.filename}\` (${f.status}, +${f.additions} -${f.deletions})`);
  lines.push("");
  lines.push("### Review checklist");
  lines.push("- [ ] Open each flagged range at the new commit and confirm the snippet still says what the card says");
  lines.push("- [ ] If it does, update `commitSha` and `snippets` on the card, then remove `needsReview`");
  lines.push("- [ ] If the card's claim changed, rewrite it or set `verified: false` with a `todos` entry");
  lines.push("- [ ] Run `npm run validate` and the build before merging");
  lines.push("");
  lines.push("_Opened by the sync-upstream workflow. Not auto-merged._");
  return lines.join("\n") + "\n";
}

/** Fetches everything needed. Returns { skipped, ... } instead of throwing on network trouble. */
async function fetchUpstream(opts, cards) {
  const api = makeClient(opts);
  const pins = [...new Set(cards.map((c) => c.data.commitSha).filter(Boolean))].sort();
  try {
    const repo = await api(`/repos/${REPO}`);
    const defaultBranch = repo.default_branch;
    const head = await api(`/repos/${REPO}/commits/${defaultBranch}`);
    const compares = new Map(); // pin -> { resolvedSha, files, truncated }
    for (const pin of pins) {
      const resolvedSha = (await api(`/repos/${REPO}/commits/${pin}`)).sha;
      if (resolvedSha === head.sha) {
        compares.set(pin, { resolvedSha, files: [], truncated: false });
        continue;
      }
      const cmp = await api(`/repos/${REPO}/compare/${resolvedSha}...${head.sha}`);
      const files = cmp.files ?? [];
      compares.set(pin, { resolvedSha, files, truncated: files.length >= COMPARE_FILE_LIMIT });
    }
    return { ok: true, defaultBranch, head, pins, compares };
  } catch (err) {
    if (err instanceof SyncError) return { ok: false, kind: err.kind, reason: err.message };
    throw err;
  }
}

async function run(opts) {
  const checkedAt = new Date().toISOString();
  const cards = await loadCards();
  const prevReport = await readJsonIfExists(REPORT_FILE);

  if (opts.offline) {
    return { ok: false, kind: "offline", reason: "offline mode: no network calls were made" };
  }

  const up = await fetchUpstream(opts, cards);
  if (!up.ok) return up;
  const { defaultBranch, head, pins, compares } = up;

  // Upstream paths the site cites at all.
  const tracked = new Set(cards.flatMap((c) => (c.data.snippets ?? []).map((s) => s.path)));

  const cardResults = [];
  const edits = [];
  for (const c of cards) {
    const pin = c.data.commitSha ?? null;
    const snippets = c.data.snippets ?? [];
    let reasons = [];
    const shifted = [];

    if (snippets.length > 0) {
      if (!pin) {
        reasons = [{ path: "*", range: "", reason: "no commitSha pin to compare against" }];
      } else if (compares.get(pin).truncated) {
        reasons = [{ path: "*", range: "", reason: `compare truncated at ${COMPARE_FILE_LIMIT} files; review manually` }];
      } else {
        for (const s of snippets) {
          const impact = snippetImpact(s, compares.get(pin).files);
          reasons.push(...impact.reasons);
          if (impact.shifted) shifted.push(impact.shifted);
        }
        reasons = dedupeReasons(reasons);
      }
    }

    const needsReview = reasons.length > 0;
    if (needsReview !== (c.data.needsReview === true)) edits.push({ card: c, needsReview });
    cardResults.push({
      slug: c.data.slug,
      file: c.file.split(path.sep).join("/"),
      commitSha: pin,
      needsReview,
      reasons,
      shifted,
    });
  }

  // Every changed file across the pin groups, de-duplicated, plus which ones the site cites.
  const changedByKey = new Map();
  for (const pin of pins) {
    for (const f of compares.get(pin).files) changedByKey.set(`${f.filename}|${f.status}`, f);
  }
  const allChanged = [...changedByKey.values()].map((f) => {
    const summary = summarizeFile(f);
    const cited = tracked.has(f.filename) || (f.previous_filename ? tracked.has(f.previous_filename) : false);
    return { ...summary, tracked: cited };
  });
  allChanged.sort((a, b) => a.filename.localeCompare(b.filename) || a.status.localeCompare(b.status));
  const trackedChanges = allChanged.filter((f) => f.tracked);

  const flaggedCount = cardResults.filter((c) => c.needsReview).length;
  const status = flaggedCount > 0 ? "needs-review" : trackedChanges.length > 0 ? "tracked-changes" : "up-to-date";

  // Open a PR only when something new appeared, so the daily run does not reopen the same
  // review. lastCheckedAt alone never triggers a PR.
  const prevTracked = JSON.stringify(prevReport?.trackedChanges ?? []);
  const prevLatest = prevReport?.upstream?.latestSha ?? null;
  const changed =
    edits.length > 0 ||
    JSON.stringify(trackedChanges) !== prevTracked ||
    (trackedChanges.length > 0 && head.sha !== prevLatest);

  const report = {
    checkedAt,
    status,
    changed,
    upstream: {
      repo: REPO,
      defaultBranch,
      latestSha: head.sha,
      latestCommitDate: head.commit?.committer?.date ?? null,
    },
    pins: pins.map((pin) => {
      const cmp = compares.get(pin);
      return { commitSha: pin, resolvedSha: cmp.resolvedSha, changedFiles: cmp.files.length, truncated: cmp.truncated };
    }),
    trackedChanges,
    changedFiles: allChanged,
    cards: cardResults,
  };

  return { ok: true, report, edits, cards, head };
}

async function writeOutputs({ changed, status }) {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\nstatus=${status}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Upstream sync\n\nStatus: \`${status}\`, changed: \`${changed}\`\n\n`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result = await run(opts);

  if (!result.ok) {
    console.warn(`sync-upstream: skipped (${result.kind}): ${result.reason}`);
    console.warn("sync-upstream: no content was changed. Re-run later, or set GITHUB_TOKEN for a higher rate limit.");
    await writeOutputs({ changed: false, status: "skipped" });
    process.exit(opts.strict ? 1 : 0);
  }

  const { report, edits, cards, head } = result;
  console.log(`sync-upstream: ${REPO}@${report.upstream.defaultBranch} is ${head.sha.slice(0, 7)}`);
  for (const p of report.pins) {
    console.log(`  pin ${p.commitSha} -> ${p.changedFiles} changed file(s)${p.truncated ? " (truncated)" : ""}`);
  }
  console.log(`  tracked upstream files changed: ${report.trackedChanges.length}`);
  for (const c of report.cards.filter((x) => x.needsReview)) {
    console.log(`  needsReview ${c.slug}: ${c.reasons.map((r) => `${r.path} ${r.range} (${r.reason})`).join("; ")}`);
  }
  console.log(`  status=${report.status} changed=${report.changed}`);

  if (opts.dryRun) {
    console.log("sync-upstream: dry run, nothing written.");
    return;
  }

  // Cards: only the needsReview line is touched.
  for (const e of edits) {
    const card = cards.find((c) => c.data.slug === e.card.data.slug);
    await writeFile(path.join(ROOT, card.file), withNeedsReview(card.raw, e.needsReview), "utf8");
    console.log(`  wrote ${card.file} (needsReview ${e.needsReview})`);
  }

  await writeFile(
    UPSTREAM_FILE,
    JSON.stringify(
      {
        repo: REPO,
        defaultBranch: report.upstream.defaultBranch,
        latestSha: report.upstream.latestSha,
        latestCommitDate: report.upstream.latestCommitDate,
        lastCheckedAt: report.checkedAt,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2) + "\n", "utf8");

  if (report.changed && opts.prBody) {
    await writeFile(path.resolve(opts.prBody), buildPrBody(report), "utf8");
  }
  await writeOutputs({ changed: report.changed, status: report.status });
}

main().catch((err) => {
  console.error(`sync-upstream: failed: ${err.stack ?? err}`);
  process.exit(1);
});
