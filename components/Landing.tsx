"use client";

import { SCENARIO } from "@/lib/data";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Minimal editorial landing page. No map, no dashboard cards. */
export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-line/25 px-6 py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[13px] font-semibold tracking-[0.2em] text-ink">
            INNOVISION
          </span>
          <span className="hidden text-[12px] text-faint sm:inline">
            Disaster Relief Intelligence
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-faint sm:inline">
            Demo data
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero — editorial, lots of whitespace */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
        <p className="reveal font-mono text-[11px] uppercase tracking-[0.25em] text-signal">
          Disaster Relief Intelligence
        </p>
        <h1 className="reveal reveal-1 mt-6 text-[44px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[56px]">
          From Damage
          <br />
          to Recovery
        </h1>
        <p className="reveal reveal-2 mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          Track disaster damage, relief distribution and restoration at
          village level — every rupee linked to a village, every
          intervention linked to recovery.
        </p>

        <div className="reveal reveal-3 mt-10 flex flex-wrap items-center justify-center gap-5">
          <button
            type="button"
            onClick={onEnter}
            className="press rounded-panel bg-signal px-5 py-2.5 text-[14px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90"
          >
            View Disaster Case
          </button>
          <span className="font-mono text-[11px] text-faint">
            Demo · Kerala Floods 2018
          </span>
        </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl border-t border-line/25 px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-faint">
        Prototype · {SCENARIO.place} · All figures demo data
      </footer>
    </div>
  );
}