"use client";

import { MoonIcon, SunIcon } from "./icons";

/**
 * Flips between light and dark and persists the choice in localStorage.
 * The first paint is set by the inline script in app/layout.tsx.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = root.dataset.theme ?? (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable (private mode); the switch still works for this visit.
    }
  };

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Toggle light and dark theme" title="Toggle theme">
      <SunIcon size={18} className="icon-sun" />
      <MoonIcon size={18} className="icon-moon" />
    </button>
  );
}
