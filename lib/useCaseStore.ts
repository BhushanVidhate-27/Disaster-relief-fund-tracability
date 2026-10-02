"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SCENARIO_ID, getScenario, type Village } from "@/lib/data";

const STORAGE_KEY = "innovision:case:v1";

export type Section = "overview" | "damage" | "relief" | "recovery";
export type Screen = "home" | "case";

interface Snapshot {
  screen: Screen;
  section: Section;
  scenarioId: string;
  villages: Village[];
  selectedId: string | null;
  assessed: boolean;
  day: number;
}

const SECTIONS: Section[] = ["overview", "damage", "relief", "recovery"];

function defaults(): Snapshot {
  const s = getScenario(DEFAULT_SCENARIO_ID);
  return {
    screen: "home",
    section: "overview",
    scenarioId: s.meta.id,
    villages: s.villages,
    selectedId: s.villages[0]?.id ?? null,
    assessed: false,
    day: 0,
  };
}

/**
 * Reject stored state that no longer matches the shipped dataset — a renamed or
 * removed village would otherwise render as an empty panel after a deploy.
 */
function isUsable(p: unknown): p is Snapshot {
  if (!p || typeof p !== "object") return false;
  const c = p as Partial<Snapshot>;
  if (typeof c.scenarioId !== "string") return false;
  const scenario = getScenario(c.scenarioId);
  if (scenario.meta.id !== c.scenarioId) return false;
  if (!Array.isArray(c.villages)) return false;
  if (!SECTIONS.includes(c.section as Section)) return false;
  const shipped = scenario.villages.map((v) => v.id).sort().join(",");
  const stored = c.villages.map((v) => v?.id).sort().join(",");
  return shipped === stored;
}

function read(): Snapshot {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed: unknown = JSON.parse(raw);
    return isUsable(parsed) ? parsed : defaults();
  } catch {
    return defaults();
  }
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "28 Aug 2018" + n days → "27 Sep 2018" */
function addDays(date: string, n: number): string {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(date.trim());
  if (!m) return `Day ${n}`;
  const mi = MONTHS.indexOf(m[2][0].toUpperCase() + m[2].slice(1).toLowerCase());
  if (mi < 0) return `Day ${n}`;
  const d = new Date(Date.UTC(+m[3], mi, +m[1] + n));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function useCaseStore() {
  const [state, setState] = useState<Snapshot>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode — the session still works, it just won't persist */
    }
  }, [state, hydrated]);

  const selectScenario = useCallback((id: string) => {
    const s = getScenario(id);
    setState((p) => ({
      ...p,
      screen: "case",
      section: "overview",
      scenarioId: s.meta.id,
      villages: s.villages,
      selectedId: s.villages[0]?.id ?? null,
      assessed: false,
      day: 0,
    }));
  }, []);

  const openIndex = useCallback(() => setState((p) => ({ ...p, screen: "home" })), []);

  const setSection = useCallback(
    (section: Section) => setState((p) => ({ ...p, screen: "case", section })),
    [],
  );

  const setSelectedId = useCallback(
    (selectedId: string) => setState((p) => ({ ...p, selectedId })),
    [],
  );

  const setAssessed = useCallback(
    (assessed: boolean) => setState((p) => ({ ...p, assessed })),
    [],
  );

  const disburse = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      villages: p.villages.map((v) =>
        v.id === id && (v.status === "PENDING" || v.status === "ALLOCATED")
          ? { ...v, status: "DISBURSED" as const, disbursed: v.approved, utilized: v.approved * 0.8 }
          : v,
      ),
    }));
  }, []);

  const advanceDay = useCallback(() => {
    setState((p) => ({ ...p, day: p.day >= 30 ? p.day : 30 }));
  }, []);

  const complete = useCallback(
    (id: string) => {
      setState((p) => {
        const scenario = getScenario(p.scenarioId);
        return {
          ...p,
          villages: p.villages.map((v) =>
            v.id === id && v.status === "DISBURSED"
              ? {
                  ...v,
                  status: "COMPLETED" as const,
                  progress: 100,
                  completedOn: `Day ${p.day} · ${addDays(scenario.meta.postDate, p.day)}`,
                }
              : v,
          ),
        };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState(defaults());
  }, []);

  const scenario = getScenario(state.scenarioId);

  return {
    ...state,
    scenario,
    hydrated,
    openIndex,
    selectScenario,
    setSection,
    setSelectedId,
    setAssessed,
    disburse,
    advanceDay,
    complete,
    reset,
  };
}