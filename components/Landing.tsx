"use client";

import { scenarios } from "@/lib/data";
import { ThemeToggle } from "@/components/ThemeToggle";

function compact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-IN");
}

export function Landing({ onEnter }: { onEnter: (id: string) => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line/25">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-panel border border-signal/35 bg-signal/10 font-mono text-[13px] font-semibold text-signal"
            >
              I
            </span>
            <span className="font-mono text-[12px] font-semibold tracking-[0.18em] text-ink">
              INNOVISION
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          Disaster cases
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Three events with published impact figures. Select one to open its
          workflow.
        </p>

        <ul className="mt-8 divide-y divide-line/20 border-y border-line/20">
          {scenarios.map((s) => {
            const f = s.meta.facts;
            const stats = [
              f.deaths != null && `${compact(f.deaths)} deaths`,
              f.affected != null && `${compact(f.affected)} affected`,
              f.displaced != null && `${compact(f.displaced)} displaced`,
            ].filter((s): s is string => typeof s === "string");

            return (
              <li key={s.meta.id}>
                <button
                  type="button"
                  onClick={() => onEnter(s.meta.id)}
                  className="press group flex w-full flex-wrap items-center gap-x-6 gap-y-3 py-5 text-left transition-colors hover:bg-panel-raised/40"
                >
                  <span
                    aria-hidden
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: s.meta.color }}
                  />
                  <span className="min-w-[220px] flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[16px] font-medium text-ink">
                        {s.meta.name}
                      </span>
                      <span className="font-mono text-[12px] text-faint">
                        {s.meta.year}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {s.meta.type} · {s.meta.place}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-faint">
                    {stats.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </span>
                  <span className="font-mono text-[12px] text-faint transition-colors group-hover:text-signal">
                    Open →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <footer className="border-t border-line/25">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-4 font-mono text-[9px] uppercase tracking-wider text-faint sm:px-6 lg:px-8">
          Impact figures sourced · relief flows and AI detection modelled
        </div>
      </footer>
    </div>
  );
}