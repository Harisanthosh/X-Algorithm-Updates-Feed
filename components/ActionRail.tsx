"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { shareText, xIntentUrl } from "@/lib/share";
import { CheckIcon, ExternalIcon, HeartIcon, LinkIcon, ShareIcon, XIcon } from "./icons";

const LIKE_EVENT = "scroll-likes-change";

function likeKey(slug: string) {
  return `liked:${slug}`;
}

function subscribeLikes(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LIKE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LIKE_EVENT, onChange);
  };
}

/** Right-hand action rail, TikTok style. Likes live in this browser only (no account, no backend). */
export function ActionRail({ slug, title, codeUrl }: { slug: string; title: string; codeUrl?: string }) {
  const liked = useSyncExternalStore(
    subscribeLikes,
    () => {
      try {
        return localStorage.getItem(likeKey(slug)) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const flash = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  const cardUrl = () => `${window.location.origin}/c/${slug}`;

  const toggleLike = () => {
    try {
      localStorage.setItem(likeKey(slug), liked ? "0" : "1");
      window.dispatchEvent(new Event(LIKE_EVENT));
    } catch {
      flash("Likes need local storage");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl());
      flash("Link copied");
    } catch {
      flash("Could not copy. Use the address bar.");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url: cardUrl() });
      } catch (err) {
        // The user closing the share sheet is not an error worth showing.
        if (err instanceof DOMException && err.name === "AbortError") return;
        await copyLink();
      }
      return;
    }
    await copyLink();
  };

  const openOnX = () => {
    window.open(xIntentUrl(shareText(title, cardUrl())), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="rail" role="group" aria-label="Card actions">
        <button
          type="button"
          className={`rail-btn${liked ? " is-on" : ""}`}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? `Unlike ${title}` : `Like ${title}`}
        >
          <HeartIcon size={24} filled={liked} />
          <span className="rail-label">Like</span>
        </button>
        <button type="button" className="rail-btn" onClick={share} aria-label={`Share ${title}`}>
          <ShareIcon size={24} />
          <span className="rail-label">Share</span>
        </button>
        <button type="button" className="rail-btn" onClick={copyLink} aria-label={`Copy link to ${title}`}>
          <LinkIcon size={24} />
          <span className="rail-label">Copy</span>
        </button>
        <button type="button" className="rail-btn" onClick={openOnX} aria-label={`Post ${title} on X`}>
          <XIcon size={22} />
          <span className="rail-label">On X</span>
        </button>
        {codeUrl && (
          <a
            className="rail-btn"
            href={codeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open the code for ${title} on GitHub`}
          >
            <ExternalIcon size={24} />
            <span className="rail-label">Code</span>
          </a>
        )}
      </div>
      <div className="toast" role="status" aria-live="polite">
        {toast && (
          <span className="toast-inner">
            <CheckIcon size={16} />
            {toast}
          </span>
        )}
      </div>
    </>
  );
}
