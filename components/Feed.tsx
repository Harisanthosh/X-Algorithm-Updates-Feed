"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SlideData } from "@/lib/cards";
import { Card } from "./Card";
import { FilterBar } from "./FilterBar";
import { Progress } from "./Progress";
import { SpecialCard } from "./SpecialCard";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  slides: SlideData[];
  /** Card slug from /c/[slug]. The feed opens already on that card. */
  initialSlug?: string | null;
  /** "about" when the URL is /#about. */
  initialHash?: string | null;
};

/** The URL that represents a slide. Cards get stable deep links. */
function urlFor(slide: SlideData) {
  if (slide.kind === "cover") return "/";
  if (slide.kind === "about") return "/#about";
  return `/c/${slide.slug}`;
}

function slideId(slide: SlideData) {
  return `slide-${slide.slug}`;
}

export function Feed({ slides, initialSlug = null, initialHash = null }: Props) {
  const [topic, setTopic] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => slides.filter((s) => s.kind !== "card" || topic === null || s.topics.includes(topic)),
    [slides, topic],
  );

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const s of slides) if (s.kind === "card") s.topics.forEach((t) => set.add(t));
    return [...set].sort();
  }, [slides]);

  // Where the feed should open. Computed once from the URL it was rendered for.
  const [initialIndex] = useState(() => {
    if (initialSlug) {
      const i = visible.findIndex((s) => s.slug === initialSlug);
      if (i >= 0) return i;
    }
    if (initialHash === "about") {
      const i = visible.findIndex((s) => s.kind === "about");
      if (i >= 0) return i;
    }
    return 0;
  });

  const [active, setActive] = useState(initialIndex);
  const current = Math.min(active, Math.max(visible.length - 1, 0));

  // Jump to the deep-linked slide before the first paint. No animation.
  useLayoutEffect(() => {
    const el = feedRef.current;
    if (el && initialIndex > 0) el.scrollTop = initialIndex * el.clientHeight;
  }, [initialIndex]);

  // Keep the address bar in step with the card on screen, without remounting.
  useEffect(() => {
    const slide = visible[current];
    if (!slide) return;
    const url = urlFor(slide);
    if (window.location.pathname + window.location.hash !== url) {
      window.history.replaceState(window.history.state, "", url);
    }
    document.title = slide.kind === "card" ? `${slide.title} | X Algorithm Scroll` : "X Algorithm Scroll";
  }, [current, visible]);

  const goTo = (index: number) => {
    const el = feedRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(visible.length - 1, index));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: clamped * el.clientHeight, behavior: reduce ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = feedRef.current;
    if (!el || !el.clientHeight) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    const clamped = Math.max(0, Math.min(visible.length - 1, i));
    if (clamped !== active) setActive(clamped);
  };

  const onTopicChange = (next: string | null) => {
    setTopic(next);
    setActive(0);
    feedRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };

  // Keyboard: J/K, arrows, space, page keys, Home/End.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const el = feedRef.current;
      if (!el) return;
      const go = (i: number) => {
        const clamped = Math.max(0, Math.min(visible.length - 1, i));
        el.scrollTo({ top: clamped * el.clientHeight, behavior: reduce ? "auto" : "smooth" });
      };

      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          go(current + 1);
          break;
        case " ":
          e.preventDefault();
          go(e.shiftKey ? current - 1 : current + 1);
          break;
        case "k":
        case "K":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          go(current - 1);
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(visible.length - 1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, visible.length]);

  return (
    <div className="app">
      <header className="chrome">
        <div className="chrome-row">
          <span className="brand">X Algorithm Scroll</span>
          <div className="chrome-right">
            <Progress index={current} total={visible.length} />
            <ThemeToggle />
          </div>
        </div>
        <FilterBar topics={topics} active={topic} onChange={onTopicChange} />
      </header>

      <div
        ref={feedRef}
        className="feed"
        onScroll={onScroll}
        tabIndex={0}
        role="region"
        aria-label="Cards"
      >
        {visible.map((s) =>
          s.kind === "card" ? (
            <Card key={s.slug} id={slideId(s)} slide={s} />
          ) : (
            <SpecialCard key={s.slug} id={slideId(s)} slide={s} />
          ),
        )}
      </div>

      <div className="edge-nav" aria-hidden="false">
        <button type="button" className="btn btn-ghost" onClick={() => goTo(current - 1)} aria-label="Previous card">
          Up
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => goTo(current + 1)} aria-label="Next card">
          Down
        </button>
      </div>
    </div>
  );
}
