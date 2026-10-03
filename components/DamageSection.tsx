"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";
import type { ScenarioMeta } from "@/lib/data";
import type { TileProvider } from "@/components/MapBasemap";
import {
  assessMarkedArea,
  computeDamageFromGrid,
  getDamageZones,
  type DamageComputation,
  type DamageZone,
  type MarkedAreaAssessment,
} from "@/lib/damageAnalysis";

const ZoneMap = dynamic(
  () => import("@/components/ZoneMap").then((m) => m.ZoneMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse bg-ground-deep lg:h-[480px]" />
    ),
  }
);

/** A marked area closes at four corners. */
const MARK_POINTS = 4;

type RunStage = "idle" | "assessing" | "complete";

interface AIResult {
  computation: DamageComputation;
  zones: DamageZone[];
}

export function DamageSection({
  scenario,
  assessed,
  onAssess,
  onNext,
  provider,
  onProviderChange,
}: {
  scenario: ScenarioMeta;
  assessed: boolean;
  onAssess: () => void;
  onNext: () => void;
  provider: TileProvider;
  onProviderChange: (provider: TileProvider) => void;
}) {
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiStage, setAiStage] = useState<RunStage>("idle");
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  /** Corners the user has placed for a second, self-drawn area. */
  const [points, setPoints] = useState<[number, number][]>([]);
  const [markedResult, setMarkedResult] =
    useState<MarkedAreaAssessment | null>(null);
  const [markStage, setMarkStage] = useState<RunStage>("idle");

  const damageZones = useMemo(() => getDamageZones(scenario), [scenario]);
  const prevScenarioId = useRef(scenario.id);

  useEffect(() => {
    if (prevScenarioId.current === scenario.id) return;
    prevScenarioId.current = scenario.id;
    setAiResult(null);
    setAiStage("idle");
    setBounds(null);
    setPoints([]);
    setMarkedResult(null);
    setMarkStage("idle");
  }, [scenario.id]);

  // Any edit to the shape invalidates the previous reading of it, so the report
  // can never describe a polygon the user has since changed.
  const invalidateMarked = useCallback(() => {
    setMarkedResult(null);
    setMarkStage("idle");
  }, []);

  const addPoint = useCallback(
    (p: [number, number]) => {
      setPoints((prev) => (prev.length >= MARK_POINTS ? prev : [...prev, p]));
      invalidateMarked();
    },
    [invalidateMarked]
  );

  const undoPoint = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
    invalidateMarked();
  }, [invalidateMarked]);

  const clearPoints = useCallback(() => {
    setPoints([]);
    invalidateMarked();
  }, [invalidateMarked]);

  const runAssessment = useCallback(async () => {
    if (!bounds || aiStage !== "idle") return;
    setAiStage("assessing");
    await sleep(900);
    setAiResult({
      computation: computeDamageFromGrid(bounds, damageZones, 60),
      zones: damageZones,
    });
    setAiStage("complete");
    onAssess();
  }, [bounds, aiStage, damageZones, onAssess]);

  const runMarkedAssessment = useCallback(async () => {
    if (points.length < MARK_POINTS || markStage === "assessing") return;
    setMarkStage("assessing");
    await sleep(900);
    setMarkedResult(assessMarkedArea(points, damageZones));
    setMarkStage("complete");
  }, [points, markStage, damageZones]);

  // Restoring a case that was already assessed: rebuild the report from bounds
  // rather than asking the user to run it again.
  useEffect(() => {
    if (assessed && bounds && !aiResult) {
      setAiResult({
        computation: computeDamageFromGrid(bounds, damageZones, 60),
        zones: damageZones,
      });
      setAiStage("complete");
    }
  }, [assessed, bounds, aiResult, damageZones]);

  const markedReady = points.length === MARK_POINTS;
  const detectedHa = damageZones.reduce((s, z) => s + z.areaHa, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-line/25 pb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">
          Damage assessment
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          The area detected for {scenario.area} is on the left. Place four points
          on the right to assess a second area of your own.
        </p>
        <p className="mt-1 text-[11px] text-faint">
          Both maps show live current imagery. The event dates are labels, not
          imagery acquisitions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ---- Left: the detected affected area ---- */}
        <figure className="flex flex-col">
          <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] text-faint">
            <span>AFFECTED AREA</span>
            <span>
              {damageZones.length} zones · {detectedHa.toFixed(1)} ha
            </span>
          </div>
          <div className="overflow-hidden rounded-panel border border-line/25">
            <div className="relative h-[420px] w-full lg:h-[480px]">
              <ZoneMap
                scenario={scenario}
                zones={damageZones}
                onBoundsReady={setBounds}
                provider={provider}
                onProviderChange={onProviderChange}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 border-t border-line/25 bg-ground-deep/90 px-3 py-2 font-mono text-[10px] text-faint">
                Detected zones overlaid
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={runAssessment}
            disabled={!bounds || aiStage === "assessing"}
            className="press mt-3 shrink-0 self-start rounded-panel bg-signal px-4 py-2 font-mono text-[12px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90 disabled:opacity-50"
          >
            {aiStage === "assessing" ? "ASSESSING…" : "ASSESS AFFECTED AREA"}
          </button>
        </figure>

        {/* ---- Right: a second area, marked by hand ---- */}
        <figure className="flex flex-col">
          <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] text-faint">
            <span>MARKED AREA</span>
            <span>
              {points.length}/{MARK_POINTS} points
            </span>
          </div>
          <div className="overflow-hidden rounded-panel border border-line/25">
            <div className="relative h-[420px] w-full lg:h-[480px]">
              <ZoneMap
                scenario={scenario}
                zones={damageZones}
                points={points}
                onAddPoint={addPoint}
                maxPoints={MARK_POINTS}
                provider={provider}
                onProviderChange={onProviderChange}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 border-t border-line/25 bg-ground-deep/90 px-3 py-2 font-mono text-[10px] text-faint">
                {markedReady
                  ? "Area closed — assess it below"
                  : `Click the map to place point ${points.length + 1}`}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runMarkedAssessment}
              disabled={!markedReady || markStage === "assessing"}
              className="press shrink-0 rounded-panel bg-signal px-4 py-2 font-mono text-[12px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90 disabled:opacity-50"
            >
              {markStage === "assessing" ? "ASSESSING…" : "ASSESS MARKED AREA"}
            </button>
            <button
              type="button"
              onClick={undoPoint}
              disabled={!points.length}
              className="press shrink-0 rounded-panel border border-line/40 bg-panel px-3 py-2 font-mono text-[11px] text-ink transition-colors hover:border-signal disabled:opacity-40"
            >
              UNDO
            </button>
            <button
              type="button"
              onClick={clearPoints}
              disabled={!points.length}
              className="press shrink-0 rounded-panel border border-line/40 bg-panel px-3 py-2 font-mono text-[11px] text-ink transition-colors hover:border-signal disabled:opacity-40"
            >
              CLEAR
            </button>
          </div>
        </figure>
      </div>

      {aiStage === "assessing" && (
        <Progress label="Running change detection over the affected area…" />
      )}

      {markStage === "assessing" && (
        <Progress label="Sampling inside your marked area…" />
      )}

      {markedResult && (
        <MarkedAreaReport result={markedResult} onClear={clearPoints} />
      )}

      {assessed && aiResult && (
        <AIDamageReport result={aiResult} scenario={scenario} onNext={onNext} />
      )}
    </div>
  );
}

function Progress({ label }: { label: string }) {
  return (
    <div className="rounded-panel border border-line/25 bg-panel p-4">
      <div className="mb-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-faint">
        <span className="size-3 animate-pulse rounded-full bg-signal" />
        {label}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/10">
        <div className="h-full w-[70%] rounded-full bg-signal transition-all" />
      </div>
    </div>
  );
}

function MarkedAreaReport({
  result,
  onClear,
}: {
  result: MarkedAreaAssessment;
  onClear: () => void;
}) {
  const {
    polygonAreaHa,
    perimeterKm,
    pointsInside,
    damagedInside,
    damagePercentage,
  } = result;

  const damagedHa = (polygonAreaHa * damagePercentage) / 100;

  const types = (
    Object.keys(result.damageByType) as Array<
      keyof MarkedAreaAssessment["damageByType"]
    >
  ).filter((t) => result.damageByType[t].points > 0);

  return (
    <div className="reveal rounded-panel border border-signal/25 bg-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-signal">
          Your marked area
        </div>
        <button
          type="button"
          onClick={onClear}
          className="press rounded-panel border border-line/40 px-3 py-1 font-mono text-[10px] text-muted transition-colors hover:border-signal hover:text-ink"
        >
          MARK ANOTHER
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <Stat label="AREA MARKED" value={`${polygonAreaHa.toFixed(1)} ha`} />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat label="PERIMETER" value={`${perimeterKm.toFixed(2)} km`} />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat
          label="SHOWS DAMAGE"
          value={`${damagePercentage.toFixed(1)}%`}
          sub={`${damagedInside}/${pointsInside} grid points`}
        />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat
          label="DAMAGE IN AREA"
          value={`${damagedHa < 0.05 ? "0.0" : damagedHa.toFixed(1)} ha`}
        />
      </div>

      {types.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line/25 pt-3">
          {types.map((t) => (
            <span
              key={t}
              className="rounded-panel border border-line/25 bg-ground-deep px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-faint">
        Measured by sampling a grid strictly inside the four points you placed,
        then testing each of those points against the detected zones. Area and
        perimeter are geodesic. The detected zones are modelled — recorded impact
        for this event is on the Overview.
      </p>
    </div>
  );
}

function AIDamageReport({
  result,
  scenario,
  onNext,
}: {
  result: AIResult;
  scenario: ScenarioMeta;
  onNext: () => void;
}) {
  const { computation, zones } = result;
  const { damagePercentage, totalSamplePoints, damagedPoints } = computation;

  const detectedHa = zones.reduce((s, z) => s + z.areaHa, 0);
  const meanConf = Math.round(
    zones.reduce((s, z) => s + z.confidence, 0) / zones.length,
  );

  return (
    <div className="reveal rounded-panel border border-line/25 bg-panel p-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <Stat
          label="COMPUTED DAMAGE"
          value={`${damagePercentage.toFixed(1)}%`}
          sub={`${damagedPoints}/${totalSamplePoints} grid points`}
        />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat label="DETECTED AREA" value={`${detectedHa.toFixed(1)} ha`} />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat label="CONFIDENCE" value={`${meanConf}%`} />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat
          label="VILLAGES TO VERIFY"
          value={String(scenario.affectedVillages)}
        />
      </div>

      <p className="mt-4 border-t border-line/25 pt-3 text-[11px] leading-relaxed text-faint">
        Confidence and detected area are modelled. Recorded impact for this event
        is on the Overview.
      </p>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-line/25 pt-3 sm:flex-row sm:items-center">
        <span className="font-mono text-[11px] text-muted">
          {zones.length} zones · {damageZonesLabel(zones)}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="press rounded-panel border border-line/40 bg-panel px-4 py-2 font-mono text-[12px] text-ink transition-colors hover:border-signal"
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}

function damageZonesLabel(zones: DamageZone[]): string {
  const types = Array.from(new Set(zones.map((z) => z.type.toLowerCase())));
  return types.join(", ");
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
        {label}
      </div>
      <div className="mt-1 font-mono text-[26px] leading-none text-ink">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[9px] text-muted">{sub}</div>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}