"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "disaster-theme";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function applyTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
}

/** Header theme switch — toggles data-theme on <html> and persists the choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const set = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div
      className="flex overflow-hidden rounded-panel border border-line/25 bg-panel"
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => set("dark")}
        aria-pressed={theme === "dark"}
        className={`press px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
          theme === "dark" ? "bg-panel-raised text-ink" : "text-muted hover:text-ink"
        }`}
      >
        DARK
      </button>
      <button
        type="button"
        onClick={() => set("light")}
        aria-pressed={theme === "light"}
        className={`press px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
          theme === "light" ? "bg-panel-raised text-ink" : "text-muted hover:text-ink"
        }`}
      >
        LIGHT
      </button>
    </div>
  );
}
