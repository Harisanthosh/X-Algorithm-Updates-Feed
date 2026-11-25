export const SOURCE_REPO = "xai-org/x-algorithm";
export const SOURCE_REPO_URL = `https://github.com/${SOURCE_REPO}`;

/** GitHub blob URL for a line range, pinned to a commit SHA. */
export function blobUrl(path: string, start: number, end: number, sha: string) {
  const range = end > start ? `#L${start}-L${end}` : `#L${start}`;
  return `${SOURCE_REPO_URL}/blob/${sha}/${path}${range}`;
}
