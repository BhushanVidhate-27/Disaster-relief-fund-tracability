"use client";

import { SCENARIO } from "@/lib/data";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Editorial entry point for the disaster response case workspace. */
export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-line/25 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-9 place-items-center rounded-panel border border-signal/35 bg-signal/10 font-mono text-[13px] font-semibold text-signal">I</span>
          <div>
            <span className="block font-mono text-[12px] font-semibold tracking-[0.18em] text-ink">INNOVISION</span>
            <span className="block text-[10px] text-faint">Disaster response intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-panel border border-line/25 bg-panel px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted sm:flex">
            <span className="size-1.5 rounded-full bg-signal" />
            Prototype workspace
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 content-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.7fr)] lg:gap-20 lg:px-12 lg:py-24">
        <section className="max-w-3xl self-center">
          <p className="reveal flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-signal">
            <span className="h-px w-8 bg-signal" />
            Field intelligence · India
          </p>
          <h1 className="reveal reveal-1 mt-6 max-w-2xl text-[42px] font-semibold leading-[1.04] tracking-[-0.045em] text-ink sm:text-[58px] lg:text-[68px]">
            From damage
            <br />
            to <span className="text-signal">recovery.</span>
          </h1>
          <p className="reveal reveal-2 mt-6 max-w-lg text-[15px] leading-7 text-muted sm:text-[16px]">
            A clearer path from disaster evidence to village-level relief — with every allocation connected to the recovery it supports.
          </p>

          <div className="reveal reveal-3 mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onEnter}
              className="press inline-flex items-center gap-4 rounded-panel bg-signal px-5 py-3 text-[13px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90"
            >
              Open case workspace
              <span aria-hidden className="font-mono text-[15px]">→</span>
            </button>
            <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
              Demo case · {SCENARIO.name} {SCENARIO.year}
            </span>
          </div>
        </section>

        <aside className="reveal reveal-2 self-center rounded-panel border border-line/25 bg-panel p-5 sm:p-7" aria-label="Response workflow">
          <div className="flex items-center justify-between border-b border-line/25 pb-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">Response workflow</p>
              <p className="mt-1 text-[13px] font-medium text-ink">One traceable case</p>
            </div>
            <span className="rounded-panel border border-signal/30 px-2 py-1 font-mono text-[9px] text-signal">TRACEABLE</span>
          </div>
          <ol className="mt-2">
            {[
              { number: "01", title: "Observe the damage", detail: "Satellite change + local reports" },
              { number: "02", title: "Verify the need", detail: "Evidence linked to each village" },
              { number: "03", title: "Track recovery", detail: "Relief followed through to use" },
            ].map((step, index) => (
              <li key={step.number} className="relative flex gap-4 py-4">
                {index < 2 && <span aria-hidden className="absolute top-11 bottom-0 left-[13px] w-px bg-line/30" />}
                <span className={`z-10 grid size-[27px] shrink-0 place-items-center rounded-full border font-mono text-[9px] ${index === 0 ? "border-signal/50 bg-signal/10 text-signal" : "border-line/35 bg-ground-deep text-faint"}`}>
                  {step.number}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-ink">{step.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-2 grid grid-cols-2 border-t border-line/25 pt-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-faint">Villages affected</p>
              <p className="mt-1 font-mono text-[20px] text-ink">{SCENARIO.affectedVillages.toString().padStart(2, "0")}</p>
            </div>
            <div className="border-l border-line/25 pl-5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-faint">Relief tracked</p>
              <p className="mt-1 font-mono text-[20px] text-ink">₹{SCENARIO.totalFund.toFixed(1)}L</p>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-wrap justify-between gap-2 border-t border-line/25 px-4 py-4 font-mono text-[9px] uppercase tracking-wider text-faint sm:px-6 lg:px-8">
        <span>Prototype · {SCENARIO.place}</span>
        <span>All figures are demo data</span>
      </footer>
    </div>
  );
}
