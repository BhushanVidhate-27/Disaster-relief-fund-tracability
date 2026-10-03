"use client";

import dynamic from "next/dynamic";
import {
  fmtL,
  fmtFull,
  statusLabel,
  type ScenarioMeta,
  type Village,
} from "@/lib/data";
import type { TileProvider } from "@/components/MapBasemap";
import { ClaimIntake } from "@/components/ClaimIntake";

const VillageMap = dynamic(
  () => import("@/components/VillageMap").then((m) => m.VillageMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[560px] w-full animate-pulse rounded-panel border border-line/25 bg-ground-deep lg:h-[640px]" />
    ),
  }
);

/** Relief Fund Distribution — map + village detail + fund lifecycle. */
export function ReliefSection({
  scenario,
  villages,
  selectedId,
  onSelect,
  onDisburse,
  provider,
  onProviderChange,
}: {
  scenario: ScenarioMeta;
  villages: Village[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDisburse: (id: string) => void;
  provider: TileProvider;
  onProviderChange: (provider: TileProvider) => void;
}) {
  const village = villages.find((v) => v.id === selectedId) ?? null;
  const disbursed = villages.reduce((s, v) => s + v.disbursed, 0);
  const utilized = villages.reduce((s, v) => s + v.utilized, 0);
  const mismatchVillage = villages.find((v) => v.mismatch);

  return (
    <div className="flex flex-col gap-6">
      {/* Approved fund */}
      <div className="border-b border-line/25 pb-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
          Approved Relief Fund
        </div>
        <div className="mt-1 font-mono text-[30px] leading-none text-ink">
          {fmtFull(scenario.totalFund)}
        </div>
      </div>

      {/* Map + village list */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)]">
        <VillageMap
          villages={villages}
          selectedId={selectedId}
          onSelect={onSelect}
          provider={provider}
          onProviderChange={onProviderChange}
        />
        <VillageList villages={villages} selectedId={selectedId} onSelect={onSelect} />
      </div>

      {/* Detail panel */}
      {village && (
        <>
          <VillageDetail
            key={village.id + village.status}
            village={village}
            onDisburse={() => onDisburse(village.id)}
          />
          <ClaimIntake key={village.id} village={village} />
        </>
      )}

      <Traceability
        scenario={scenario}
        disbursed={disbursed}
        utilized={utilized}
        mismatchVillage={mismatchVillage}
      />
    </div>
  );
}

/* ---------------- village list ---------------- */

function VillageList({
  villages,
  selectedId,
  onSelect,
}: {
  villages: Village[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-panel border border-line/25 bg-panel lg:flex lg:h-[640px] lg:flex-col">
      <div className="border-b border-line/25 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-faint">
        Villages ({villages.length})
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {villages.map((v) => {
          const active = v.id === selectedId;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={`press block w-full border-b border-line/15 px-4 py-3 text-left transition-colors last:border-b-0 ${
                active ? "bg-panel-raised" : "hover:bg-panel-raised"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">{v.name}</span>
                <span className="font-mono text-[11px] text-signal">
                  {fmtL(v.approved)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-faint">
                <span>{v.families} families</span>
                <span>{statusLabel[v.status]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- detail panel ---------------- */

function VillageDetail({
  village,
  onDisburse,
}: {
  village: Village;
  onDisburse: () => void;
}) {
  const v = village;
  const canDisburse = v.status === "PENDING" || v.status === "ALLOCATED";
  const unaccounted =
    v.disbursed > 0 ? Math.max(0, v.disbursed - v.utilized) : 0;

  return (
    <div className="reveal rounded-panel border border-line/25 bg-panel p-5">
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
        <Row label="Village" value={v.name} />
        <Row label="Affected families" value={String(v.families)} mono />
        <Row label="Damage severity" value={v.severity} />
        <Row label="Status" value={statusLabel[v.status]} mono />
        <Row label="Approved relief" value={fmtFull(v.approved)} mono />
        <Row label="Disbursed" value={v.disbursed > 0 ? fmtFull(v.disbursed) : "—"} mono />
        <Row label="Utilized" value={v.utilized > 0 ? fmtFull(v.utilized) : "—"} mono />
        <Row
          label="Unaccounted"
          value={unaccounted > 0 ? fmtFull(unaccounted) : "—"}
          mono
          accent={unaccounted > 0}
        />
      </div>

      {canDisburse && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDisburse}
            className="press rounded-panel bg-signal px-4 py-2 font-mono text-[12px] font-medium text-[rgb(var(--on-signal))] transition-colors hover:bg-signal/90"
          >
            DISBURSE FUND
          </button>
          <span className="font-mono text-[11px] text-faint">
            Releases {fmtFull(v.approved)} to this village.
          </span>
        </div>
      )}

      {v.disbursed > 0 && <FundTrail v={v} />}
    </div>
  );
}

/**
 * State-driven fund trail. The earlier version printed fixed DAY 0/3/12/30
 * milestones, which were invented and only loosely tied to real state.
 */
function FundTrail({ v }: { v: Village }) {
  const unaccounted = Math.max(0, v.disbursed - v.utilized);
  const rows = [
    { label: "Fund approved", value: fmtFull(v.approved), done: true },
    { label: "Fund disbursed", value: fmtFull(v.disbursed), done: v.disbursed > 0 },
    { label: "Utilization reported", value: fmtFull(v.utilized), done: v.utilized > 0 },
  ];

  return (
    <div className="mt-4 border-t border-line/25 pt-4 font-mono text-[11px] leading-relaxed text-muted">
      {rows.map((r) => (
        <div key={r.label} className={r.done ? "" : "opacity-50"}>
          <span className="text-signal">{r.label}</span> — {r.value}
          {r.done && <span className="ml-1 text-[#5f9e6e]">✓</span>}
        </div>
      ))}
      {unaccounted > 0 && (
        <div className="mt-2 text-signal">
          ⚠ {fmtFull(unaccounted)} disbursed with no matching utilization report
        </div>
      )}
    </div>
  );
}
/* ---------------- traceability summary ---------------- */

function Traceability({
  scenario,
  disbursed,
  utilized,
  mismatchVillage,
}: {
  scenario: ScenarioMeta;
  disbursed: number;
  utilized: number;
  mismatchVillage?: Village;
}) {
  return (
    <div className="rounded-panel border border-line/25 bg-panel p-5">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-faint">
        Fund Traceability
      </div>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <TraceStat label="Total Approved" value={fmtL(scenario.totalFund)} />
        <span className="hidden h-8 w-px bg-line/20 sm:block" />
        <TraceStat label="Disbursed" value={fmtL(disbursed)} />
        <span className="hidden h-8 w-px bg-line/20 sm:block" />
        <TraceStat label="Utilized" value={fmtL(utilized)} />
        <span className="hidden h-8 w-px bg-line/20 sm:block" />
        <TraceStat
          label="Pending Utilization"
          value={fmtL(disbursed - utilized)}
        />
      </div>

      {mismatchVillage && mismatchVillage.mismatch && (
        <div className="reveal mt-4 border-t border-line/25 pt-4">
          <div className="font-mono text-[11px] text-[#c04a3e]">
            ⚠ Utilization mismatch
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-[11px] text-muted sm:grid-cols-4">
            <span>
              Village: <span className="text-ink">{mismatchVillage.name}</span>
            </span>
            <span>
              Reported:{" "}
              <span className="text-ink">{fmtL(mismatchVillage.mismatch.reported)}</span>
            </span>
            <span>
              Expected:{" "}
              <span className="text-ink">{fmtL(mismatchVillage.mismatch.expected)}</span>
            </span>
            <span>
              Diff:{" "}
              <span className="text-ink">
                {fmtL(
                  mismatchVillage.mismatch.reported -
                    mismatchVillage.mismatch.expected
                )}
              </span>
            </span>
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-faint">
            Status · Requires Verification
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-faint">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[13px] ${mono ? "font-mono" : ""} ${
          accent ? "text-signal" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function TraceStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-faint">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[20px] leading-none text-ink">
        {value}
      </div>
    </div>
  );
}
