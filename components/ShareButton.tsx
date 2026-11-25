"use client";

import { useState } from "react";
import { shareText, xIntentUrl } from "@/lib/share";

/** Copies the card URL, or opens an X compose window with the title and URL. */
export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const cardUrl = () => `${window.location.origin}/c/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the link is still shown in the address bar.
    }
  };

  const postOnX = () => {
    window.open(xIntentUrl(shareText(title, cardUrl())), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="share">
      <button type="button" className="btn" onClick={copy}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button type="button" className="btn btn-primary" onClick={postOnX}>
        Share on X
      </button>
    </div>
  );
}
