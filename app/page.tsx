"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  DEFAULT_SCENARIO_ID,
  getScenario,
  type Village,
} from "@/lib/data";
import { Landing } from "@/components/Landing";
import { Overview } from "@/components/Overview";
import { DamageSection } from "@/components/DamageSection";
import { ReliefSection } from "@/components/ReliefSection";
import { Recovery } from "@/components/Recovery";
import { ThemeToggle } from "@/components/ThemeToggle";

const VillageMap = dynamic(
  () => import("@/components/VillageMap").then((m) => m.VillageMap),
  { ssr: false }
);

type Section = "overview" | "damage" | "relief" | "recovery";

const NAV: { id: Section; label: string; number: string }[] = [
  { id: "overview", label: "Overview", number: "01" },
  { id: "damage", label: "Damage", number: "02" },
  { id: "relief", label: "Relief", number: "03" },
  { id: "recovery", label: "Recovery", number: "04" },
];

export default function App() {
  const [screen, setScreen] = useState<"home" | "case">("home");
  const [section, setSection] = useState<Section>("overview");
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO_ID);
  const [villages, setVillages] = useState<Village[]>(getScenario(DEFAULT_SCENARIO_ID).villages);
  const [selectedId, setSelectedId] = useState<string | null>(getScenario(DEFAULT_SCENARIO_ID).villages[0]?.id ?? null);
  const [assessed, setAssessed] = useState(false);
  const [day, setDay] = useState(0);

  const scenario = getScenario(scenarioId);

  const selectScenario = useCallback((id: string) => {
    const s = getScenario(id);
    setScenarioId(id);
    setVillages(s.villages);
    setSelectedId(s.villages[0]?.id ?? null);
    setAssessed(false);
    setDay(0);
    setSection("overview");
  }, []);

  const disburse = useCallback((id: string) => {
    setVillages((vs) =>
      vs.map((v) =>
        v.id === id && (v.status === "PENDING" || v.status === "ALLOCATED")
          ? { ...v, status: "DISBURSED", disbursed: v.approved, utilized: v.approved * 0.8 }
          : v
      )
    );
  }, []);

  const advanceDay = useCallback(() => setDay((d) => (d >= 30 ? d : 30)), []);

  const complete = useCallback((id: string) => {
    setVillages((vs) =>
      vs.map((v) =>
        v.id === id && v.status === "DISBURSED"
          ? { ...v, status: "COMPLETED", progress: 100, completedOn: "Day 30 · 12 Oct 2018" }
          : v
      )
    );
  }, []);

  if (screen === "home") {
    return <Landing onEnter={() => setScreen("case")} />;
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
                onClick={() => setScreen("home")}
                className="press block font-mono text-[12px] font-semibold tracking-[0.18em] text-ink"
              >
                INNOVISION
              </button>
              <span className="block truncate text-[10px] text-faint">Disaster response intelligence</span>
            </div>
            <span aria-hidden className="mx-1 hidden h-8 w-px bg-line/25 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-[12px] font-medium text-ink">{scenario.meta.name} <span className="font-mono text-faint">{scenario.meta.year}</span></div>
              <div className="truncate text-[10px] text-faint">{scenario.meta.place}</div>
            </div>
          </div>
          <nav aria-label="Case workflow" className="flex max-w-full items-center gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={section === n.id ? "page" : undefined}
              onClick={() => setSection(n.id)}
              className={`press flex shrink-0 items-center gap-2 rounded-panel border px-3 py-2 text-[11px] transition-colors ${
                section === n.id
                  ? "border-signal/35 bg-signal/10 text-ink"
                  : "border-transparent text-muted hover:border-line/25 hover:bg-panel-raised/60 hover:text-ink"
              }`}
            >
              <span className={`font-mono text-[9px] ${section === n.id ? "text-signal" : "text-faint"}`}>{n.number}</span>
              <span>{n.label}</span>
            </button>
          ))}
          <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {section === "overview" && (
          <Overview
            scenario={scenario.meta}
            villages={villages}
            assessed={assessed}
            onSelectScenario={selectScenario}
            onView={(v) => setSection(v)}
          />
        )}
        {section === "damage" && (
          <DamageSection
            scenario={scenario.meta}
            assessed={assessed}
            onAssess={() => setAssessed(true)}
            onNext={() => setSection("relief")}
          />
        )}
        {section === "relief" && (
          <ReliefSection
            scenario={scenario.meta}
            villages={villages}
            selectedId={selectedId}
            day={day}
            onSelect={setSelectedId}
            onDisburse={disburse}
            onAdvanceDay={advanceDay}
            onComplete={complete}
            onViewRecovery={() => setSection("recovery")}
          />
        )}
        {section === "recovery" && <Recovery villages={villages} />}

        <p className="mt-8 border-t border-line/25 pt-4 font-mono text-[11px] leading-relaxed text-faint">
          Every rupee is linked to a village. Every intervention is linked to
          recovery. · All figures are demo data.
        </p>
      </main>
    </div>
  );
}
