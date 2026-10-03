"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SCENARIO_ID,
  getScenario,
  type Village,
  type VillageStatus,
} from "@/lib/data";
import { TILE_PROVIDERS, type TileProvider } from "@/lib/mapTiles";

const STORAGE_KEY = "innovision:case:v1";

export type Section = "overview" | "damage" | "relief";
export type Screen = "home" | "case";

interface Snapshot {
  screen: Screen;
  section: Section;
  scenarioId: string;
  villages: Village[];
  selectedId: string | null;
  assessed: boolean;
  tileProvider: TileProvider;
}

const SECTIONS: Section[] = ["overview", "damage", "relief"];

const STATUSES: VillageStatus[] = ["PENDING", "ALLOCATED", "DISBURSED"];

/**
 * States saved before the restoration concept was removed still carry
 * `progress` / `deadlineDays` / `completedOn` and the now-deleted DUE and
 * COMPLETED statuses. Passing those through would render `undefined` in the
 * status column, so a stored village is rebuilt from the fields the app still
 * owns. A COMPLETED village becomes DISBURSED, which is where it sat in the
 * fund trail before it was closed out.
 */
function sanitizeVillage(v: unknown): Village | null {
  if (!v || typeof v !== "object") return null;
  const c = v as Partial<Village>;
  if (typeof c.id !== "string" || typeof c.name !== "string") return null;

  const num = (x: unknown, fallback = 0) =>
    typeof x === "number" && Number.isFinite(x) ? x : fallback;

  return {
    id: c.id,
    name: c.name,
    lat: num(c.lat),
    lng: num(c.lng),
    families: num(c.families),
    severity: c.severity ?? "Moderate",
    approved: num(c.approved),
    disbursed: num(c.disbursed),
    utilized: num(c.utilized),
    status: STATUSES.includes(c.status as VillageStatus)
      ? (c.status as VillageStatus)
      : "DISBURSED",
    mismatch: c.mismatch,
    population2011: c.population2011,
    coordsVerified: Boolean(c.coordsVerified),
  };
}

function defaults(): Snapshot {
  const s = getScenario(DEFAULT_SCENARIO_ID);
  return {
    screen: "home",
    section: "overview",
    scenarioId: s.meta.id,
    villages: s.villages,
    selectedId: s.villages[0]?.id ?? null,
    assessed: false,
    tileProvider: "maptiler",
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

/**
 * A missing or unrecognised tile provider falls back to the default instead of
 * discarding the case — the map source is a display preference and is not worth
 * throwing away someone's in-progress relief state over.
 */
function normalize(p: Snapshot): Snapshot {
  const villages = p.villages
    .map(sanitizeVillage)
    .filter((v): v is Village => v !== null);
  return {
    ...p,
    villages,
    tileProvider: TILE_PROVIDERS.includes(p.tileProvider)
      ? p.tileProvider
      : "maptiler",
  };
}

function read(): Snapshot {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed: unknown = JSON.parse(raw);
    return isUsable(parsed) ? normalize(parsed) : defaults();
  } catch {
    return defaults();
  }
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

  const setTileProvider = useCallback(
    (tileProvider: TileProvider) => setState((p) => ({ ...p, tileProvider })),
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
    setTileProvider,
    disburse,
    reset,
  };
}