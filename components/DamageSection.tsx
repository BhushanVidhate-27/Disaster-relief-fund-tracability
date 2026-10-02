"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type L from "leaflet";
import type { ScenarioMeta } from "@/lib/data";
import {
  computeDamageFromGrid,
  getDamageZones,
  type DamageComputation,
  type DamageZone,
} from "@/lib/damageAnalysis";

const SatelliteMap = dynamic(
  () => import("@/components/SatelliteMap").then((m) => m.SatelliteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse bg-ground-deep lg:h-[480px]" />
    ),
  },
);

type AIStage =
  | "idle"
  | "loading-pre"
  | "loading-post"
  | "change-detection"
  | "classification"
  | "complete";

interface AIResult {
  computation: DamageComputation;
  zones: DamageZone[];
}

export function DamageSection({
  scenario,
  assessed,
  onAssess,
  onNext,
}: {
  scenario: ScenarioMeta;
  assessed: boolean;
  onAssess: () => void;
  onNext: () => void;
}) {
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiStage, setAiStage] = useState<AIStage>("idle");
  const [postBounds, setPostBounds] = useState<L.LatLngBounds | null>(null);

  const damageZones = useMemo(() => getDamageZones(scenario), [scenario]);
  const prevScenarioId = useRef(scenario.id);

  useEffect(() => {
    if (prevScenarioId.current === scenario.id) return;
    prevScenarioId.current = scenario.id;
    setAiResult(null);
    setAiStage("idle");
    setPostBounds(null);
  }, [scenario.id]);

  const buildResult = useCallback(
    (bounds: L.LatLngBounds): AIResult => ({
      computation: computeDamageFromGrid(bounds, damageZones, 60),
      zones: damageZones,
    }),
    [damageZones],
  );

  const runAssessment = useCallback(async () => {
    if (!postBounds || aiStage !== "idle") return;

    setAiStage("loading-pre");
    await sleep(300);
    setAiStage("loading-post");
    await sleep(300);
    setAiStage("change-detection");
    await sleep(500);
    setAiStage("classification");
    await sleep(400);

    setAiResult(buildResult(postBounds));
    setAiStage("complete");
    onAssess();
  }, [postBounds, aiStage, buildResult, onAssess]);

  useEffect(() => {
    if (assessed && postBounds && !aiResult) {
      setAiResult(buildResult(postBounds));
      setAiStage("complete");
    }
  }, [assessed, postBounds, aiResult, buildResult]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-line/25 pb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">
          Damage assessment
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Compare the area before and after {scenario.preDate}, then run change
          detection over {scenario.area}.
        </p>
        <p className="mt-1 text-[11px] text-faint">
          Both panels show live current imagery. The dates are labels, not
          imagery acquisitions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SatellitePanel
          label="BEFORE"
          date={scenario.preDate}
          variant="pre"
          scenario={scenario}
        />
        <SatellitePanel
          label="AFTER"
          date={scenario.postDate}
          variant="post"
          scenario={scenario}
          onBoundsReady={setPostBounds}
          damageZones={damageZones}
        />
      </div>

      {!assessed && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-panel border border-line/25 bg-panel p-4 sm:flex-row sm:items-center">
          <div className="text-[13px] text-muted">
            Sample the after view against{" "}
            <span className="font-mono text-ink">{damageZones.length}</span>{" "}
            detected zones on a 60×60 grid.
          </div>
          <button
            type="button"
            onClick={runAssessment}
            disabled={!postBounds || aiStage !== "idle"}
            className="press shrink-0 rounded-panel bg-signal px-4 py-2 font-mono text-[12px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90 disabled:opacity-50"
          >
            RUN ASSESSMENT
          </button>
        </div>
      )}

      {aiStage !== "idle" && aiStage !== "complete" && (
        <div className="rounded-panel border border-line/25 bg-panel p-4">
          <div className="mb-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-faint">
            <span
              className={`h-3 w-3 animate-pulse rounded-full ${stageDotClass(aiStage)}`}
            />
            Change detection running
          </div>
          <div className="text-[12px] text-muted">{aiStageLabel(aiStage)}</div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line/10">
            <div
              className="h-full rounded-full bg-signal transition-all"
              style={{ width: stageProgress(aiStage) + "%" }}
            />
          </div>
        </div>
      )}

      {assessed && aiResult && (
        <AIDamageReport result={aiResult} scenario={scenario} onNext={onNext} />
      )}
    </div>
  );
}

function SatellitePanel({
  label,
  date,
  variant,
  scenario,
  onBoundsReady,
  damageZones,
}: {
  label: string;
  date: string;
  variant: "pre" | "post";
  scenario: ScenarioMeta;
  onBoundsReady?: (bounds: L.LatLngBounds) => void;
  damageZones?: DamageZone[];
}) {
  return (
    <figure>
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-faint">
        <span>{label}</span>
        <span>{date}</span>
      </div>
      <div className="overflow-hidden rounded-panel border border-line/25">
        <div className="relative h-[420px] w-full overflow-hidden lg:h-[480px]">
          <SatelliteMap
            variant={variant}
            scenario={scenario}
            showDamageZones={variant === "post"}
            onBoundsReady={onBoundsReady}
            damageZones={damageZones}
          />
          {variant === "post" && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 border-t border-line/25 bg-ground-deep/90 px-3 py-2 font-mono text-[10px] text-faint">
              Detected zones overlaid
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function stageDotClass(stage: AIStage): string {
  const map: Record<string, string> = {
    "loading-pre": "bg-blue-400",
    "loading-post": "bg-blue-400",
    "change-detection": "bg-orange-400",
    classification: "bg-amber-400",
  };
  return map[stage] ?? "bg-signal";
}

function aiStageLabel(stage: AIStage): string {
  const map: Record<string, string> = {
    "loading-pre": "Loading pre-event view…",
    "loading-post": "Loading post-event view…",
    "change-detection": "Sampling grid against detected zones…",
    classification: "Aggregating damage polygons…",
  };
  return map[stage] ?? stage;
}

function stageProgress(stage: AIStage): number {
  const map: Record<AIStage, number> = {
    idle: 0,
    "loading-pre": 20,
    "loading-post": 40,
    "change-detection": 70,
    classification: 90,
    complete: 100,
  };
  return map[stage] ?? 0;
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
        Confidence and detected area are modelled. Recorded impact for this
        event is on the Overview.
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