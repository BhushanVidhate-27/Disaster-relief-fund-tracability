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

const NAV: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "damage", label: "Damage" },
  { id: "relief", label: "Relief" },
  { id: "recovery", label: "Recovery" },
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
      {/* Minimal top navigation */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/25 bg-ground-deep px-6 py-3">
        <div className="flex items-baseline gap-3">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="press font-mono text-[13px] font-semibold tracking-[0.2em] text-ink"
          >
            INNOVISION
          </button>
          <span className="hidden font-mono text-[11px] text-faint sm:inline">
            {scenario.meta.name} — {scenario.meta.year} · {scenario.meta.place}
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={section === n.id ? "page" : undefined}
              onClick={() => setSection(n.id)}
              className={`press rounded-panel px-3 py-1.5 text-[12px] transition-colors ${
                section === n.id
                  ? "bg-panel-raised text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </button>
          ))}
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
