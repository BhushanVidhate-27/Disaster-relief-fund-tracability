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
  type DamageZoneType,
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
  aiReport: string[];
  aiSummary: string;
}

/**
 * Pre/post satellite comparison with a simulated AI change-detection
 * pipeline. Damage % is computed by grid-sampling the visible post-event
 * viewport against the detected polygons.
 */
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
    (bounds: L.LatLngBounds): AIResult => {
      const computation = computeDamageFromGrid(bounds, damageZones, 60);
      return {
        computation,
        zones: damageZones,
        aiReport: generateAIReport(scenario, computation, damageZones),
        aiSummary: generateAISummary(scenario, computation),
      };
    },
    [damageZones, scenario],
  );

  const runAssessment = useCallback(async () => {
    if (!postBounds || aiStage !== "idle") return;

    setAiStage("loading-pre");
    await sleep(400);
    setAiStage("loading-post");
    await sleep(400);
    setAiStage("change-detection");
    await sleep(600);
    setAiStage("classification");
    await sleep(500);

    setAiResult(buildResult(postBounds));
    setAiStage("complete");
    onAssess();
  }, [postBounds, aiStage, buildResult, onAssess]);

  // Restore results if the user already assessed, then left and came back.
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
          Compare pre- and post-event satellite imagery, then run AI change
          detection to compute damaged area over {scenario.area}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SatellitePanel
          label="PRE-DISASTER"
          date={scenario.preDate}
          variant="pre"
          scenario={scenario}
        />
        <SatellitePanel
          label="POST-DISASTER"
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
            Dual-temporal Sentinel-2 window{" "}
            <span className="font-mono text-ink">
              {scenario.preDate} → {scenario.postDate}
            </span>
            . Grid-sample the post view against detected polygons for a damage
            percentage.
          </div>
          <button
            type="button"
            onClick={runAssessment}
            disabled={!postBounds || aiStage !== "idle"}
            className="press shrink-0 rounded-panel bg-signal px-4 py-2 font-mono text-[12px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90 disabled:opacity-50"
          >
            RUN DAMAGE ASSESSMENT
          </button>
        </div>
      )}

      {aiStage !== "idle" && aiStage !== "complete" && (
        <div className="rounded-panel border border-line/25 bg-panel p-4">
          <div className="mb-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-faint">
            <span
              className={`h-3 w-3 animate-pulse rounded-full ${stageDotClass(aiStage)}`}
            />
            AI CHANGE DETECTION IN PROGRESS
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
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-line/25 bg-ground-deep/90 px-3 py-2 font-mono text-[10px] text-faint">
            <span>SENTINEL-2 / 10 m</span>
            <span>{variant === "pre" ? "BASELINE RGB" : "RGB · CHANGE OVERLAY"}</span>
          </div>
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
    "loading-pre": "Ingesting pre-event Sentinel-2 capture…",
    "loading-post": "Ingesting post-event Sentinel-2 capture…",
    "change-detection":
      "Running pixel-level NDVI / NDWI / NDBI change detection (60×60 grid)…",
    classification: "Classifying damage polygons & synthesising AI report…",
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

function generateAIReport(
  scenario: ScenarioMeta,
  comp: DamageComputation,
  zones: DamageZone[],
): string[] {
  const pct = comp.damagePercentage;
  const lines: string[] = [
    `AI DAMAGE ASSESSMENT REPORT — ${scenario.name}, ${scenario.year}`,
    `Region: ${scenario.place} · ${scenario.area} · Window: ${scenario.preDate} → ${scenario.postDate}`,
    `Algorithm: Sentinel-2 dual-temporal change detection (NDVI, NDWI, NDBI)`,
    `Sampling grid: ${comp.totalSamplePoints} pts · ${comp.damagedPoints} flagged damaged · Coverage: ${pct}%`,
    "",
    "DETECTED DAMAGE ZONES:",
  ];

  zones.forEach((z) => {
    const bt = comp.damageByType[z.type];
    lines.push(
      `  • ${z.name} — ${z.type.toUpperCase()} | ${z.areaHa} ha | ${z.confidence}% conf`,
    );
    lines.push(`    ${z.description}`);
    if (bt.points > 0) {
      lines.push(
        `    Grid hits: ${bt.points} pts · avg conf ${bt.confidence}%`,
      );
    }
  });

  lines.push("");
  lines.push(
    `OVERALL DAMAGE INDEX: ${pct.toFixed(1)}% of the assessed viewport shows significant post-event change.`,
  );
  lines.push(
    `Model confidence: ${Math.round(
      zones.reduce((s, z) => s + z.confidence, 0) / zones.length,
    )}% (mean across ${zones.length} zones).`,
  );
  lines.push("");
  lines.push(
    `RECOMMENDATION: Flag ${scenario.affectedVillages} nearest villages for on-ground verification and prioritise relief allocation.`,
  );

  return lines;
}

function generateAISummary(
  scenario: ScenarioMeta,
  comp: DamageComputation,
): string {
  const types = (
    Object.entries(comp.damageByType) as [
      DamageZoneType,
      { points: number },
    ][]
  )
    .filter(([, v]) => v.points > 0)
    .map(([k]) => k)
    .join(" + ");
  return `${scenario.type} · ${comp.damagePercentage.toFixed(1)}% area damaged · ${
    types || "no damage"
  } detected via pre/post comparison`;
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
  const { computation, zones, aiReport, aiSummary } = result;
  const { damagePercentage, totalSamplePoints, damagedPoints, damageByType } =
    computation;

  const typeEntries = (
    Object.entries(damageByType) as [
      DamageZoneType,
      { points: number; areaHa: number; confidence: number },
    ][]
  ).filter(([, v]) => v.points > 0);

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
          sub={`AI grid: ${damagedPoints}/${totalSamplePoints} pts`}
        />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat label="DETECTED AREA" value={`${detectedHa.toFixed(1)} ha`} />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat label="CONFIDENCE" value={`${meanConf}%`} />
        <span className="hidden h-10 w-px bg-line/20 sm:block" />
        <Stat
          label="AFFECTED VILLAGES"
          value={String(scenario.affectedVillages)}
        />
      </div>

      <div className="mt-4 border-t border-line/25 pt-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-faint">
          AI Analysis Report
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted">
          {aiReport.map((line, i) => (
            <span key={i} className="block">
              {line || "\u00a0"}
            </span>
          ))}
        </pre>
        <div className="mt-3 font-mono text-[11px] text-signal">{aiSummary}</div>
      </div>

      {typeEntries.length > 0 && (
        <div className="mt-4 border-t border-line/25 pt-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-faint">
            Damage Type Breakdown
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 font-mono text-[11px] sm:grid-cols-2">
            {typeEntries.map(([type, data]) => {
              const zone = zones.find((z) => z.type === type);
              return (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: zone?.color ?? "#888" }}
                  />
                  <span className="text-faint capitalize">{type}:</span>
                  <span className="text-ink">
                    {data.areaHa.toFixed(1)} ha · {data.points} pts ·{" "}
                    {data.confidence}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-line/25 pt-3 sm:flex-row sm:items-center">
        <span className="font-mono text-[11px] text-muted">
          ✓ AI damage assessment completed — change detection & classification
          finished.
        </span>
        <button
          type="button"
          onClick={onNext}
          className="press rounded-panel border border-line/40 bg-panel px-4 py-2 font-mono text-[12px] text-ink transition-colors hover:border-signal"
        >
          CONTINUE → RELIEF DISTRIBUTION
        </button>
      </div>
    </div>
  );
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
