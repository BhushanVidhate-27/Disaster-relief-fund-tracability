"use client";

import { useCaseStore, type Section } from "@/lib/useCaseStore";
import { Landing } from "@/components/Landing";
import { Overview } from "@/components/Overview";
import { DamageSection } from "@/components/DamageSection";
import { ReliefSection } from "@/components/ReliefSection";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV: { id: Section; label: string; number: string }[] = [
  { id: "overview", label: "Overview", number: "01" },
  { id: "damage", label: "Damage", number: "02" },
  { id: "relief", label: "Relief", number: "03" },
];

export default function App() {
  const s = useCaseStore();

  if (!s.hydrated) {
    return <div className="min-h-screen bg-ground" />;
  }

  if (s.screen === "home") {
    return <Landing onEnter={s.selectScenario} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[1001] border-b border-line/25 bg-ground-deep">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-panel border border-signal/35 bg-signal/10 font-mono text-[13px] font-semibold text-signal">I</span>
            <div className="min-w-0">
              <button
                type="button"
                onClick={s.openIndex}
                className="press block font-mono text-[12px] font-semibold tracking-[0.18em] text-ink"
              >
                INNOVISION
              </button>
            </div>
            <span aria-hidden className="mx-1 hidden h-8 w-px bg-line/25 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-[12px] font-medium text-ink">{s.scenario.meta.name} <span className="font-mono text-faint">{s.scenario.meta.year}</span></div>
              <div className="truncate text-[10px] text-faint">{s.scenario.meta.place}</div>
            </div>
          </div>
          <nav aria-label="Case workflow" className="flex max-w-full items-center gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={s.section === n.id ? "page" : undefined}
              onClick={() => s.setSection(n.id)}
              className={`press flex shrink-0 items-center gap-2 rounded-panel border px-3 py-2 text-[11px] transition-colors ${
                s.section === n.id
                  ? "border-signal/35 bg-signal/10 text-ink"
                  : "border-transparent text-muted hover:border-line/25 hover:bg-panel-raised/60 hover:text-ink"
              }`}
            >
              <span className={`font-mono text-[9px] ${s.section === n.id ? "text-signal" : "text-faint"}`}>{n.number}</span>
              <span>{n.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={s.reset}
            title="Clear the saved case state and reload the sample data"
            className="press ml-1 shrink-0 rounded-panel border border-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-faint transition-colors hover:border-line/25 hover:text-ink"
          >
            Reset
          </button>
          <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {s.section === "overview" && (
          <Overview
            scenario={s.scenario.meta}
            villages={s.villages}
            assessed={s.assessed}
            onSelectScenario={s.selectScenario}
            provider={s.tileProvider}
            onProviderChange={s.setTileProvider}
          />
        )}
        {s.section === "damage" && (
          <DamageSection
            scenario={s.scenario.meta}
            assessed={s.assessed}
            onAssess={() => s.setAssessed(true)}
            onNext={() => s.setSection("relief")}
            provider={s.tileProvider}
            onProviderChange={s.setTileProvider}
          />
        )}
        {s.section === "relief" && (
          <ReliefSection
            scenario={s.scenario.meta}
            villages={s.villages}
            selectedId={s.selectedId}
            onSelect={s.setSelectedId}
            onDisburse={s.disburse}
            provider={s.tileProvider}
            onProviderChange={s.setTileProvider}
          />
        )}
      </main>
    </div>
  );
}