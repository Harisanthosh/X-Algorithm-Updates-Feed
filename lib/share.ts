/** Plain share text: the card title, a blank line, then the card URL. No tags. */
export function shareText(title: string, url: string) {
  return `${title}\n\n${url}`;
}

/** X intent link for a card. Used only on click, so the origin is always the live site. */
export function xIntentUrl(text: string) {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}
