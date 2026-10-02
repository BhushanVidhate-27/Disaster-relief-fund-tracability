"use client";

import {
  fmtL,
  recoveryPct,
  statusLabel,
  scenarios,
  type ScenarioMeta,
  type Village,
} from "@/lib/data";
import { EventSwitcher } from "@/components/EventSwitcher";

/** Overview — the whole story at a glance: events + flow + case stats + fund chain. */
export function Overview({
  scenario,
  villages,
  assessed,
  onSelectScenario,
  onView,
}: {
  scenario: ScenarioMeta;
  villages: Village[];
  assessed: boolean;
  onSelectScenario: (id: string) => void;
  onView: (v: "damage" | "relief" | "recovery") => void;
}) {
  const disbursed = villages.reduce((s, v) => s + v.disbursed, 0);
  const utilized = villages.reduce((s, v) => s + v.utilized, 0);
  const overall = Math.round(
    villages.reduce((s, v) => s + recoveryPct(v), 0) / villages.length
  );
  const completed = villages.filter((v) => v.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-signal">
            <span className="size-1.5 rounded-full bg-signal" />
            Situation overview
          </p>
          <h1 className="text-[25px] font-semibold tracking-[-0.03em] text-ink sm:text-[29px]">Disaster response dashboard</h1>
          <p className="mt-1 text-[12px] text-muted">Select an event to follow its evidence, relief and recovery.</p>
        </div>
        <span className="rounded-panel border border-line/25 bg-panel px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-faint">Demo environment</span>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-y divide-line/20 overflow-hidden rounded-panel border border-line/25 bg-panel sm:grid-cols-4 sm:divide-y-0">
        <Snapshot label="Events monitored" value={String(scenarios.length).padStart(2, "0")} note="Across India" />
        <Snapshot label="Villages mapped" value={String(villages.length).padStart(2, "0")} note={scenario.district} />
        <Snapshot label="Case relief fund" value={fmtL(scenario.totalFund)} note={scenario.name} />
        <Snapshot label="Recovery progress" value={`${overall}%`} note={`${completed} completed`} />
      </dl>

      {/* Multi-event map + case list */}
      <EventSwitcher selected={scenario} onSelect={onSelectScenario} />

      {/* Case header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/25 pb-4">
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Active case</p>
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">
            {scenario.name} <span className="font-mono text-[13px] font-normal text-faint">/ {scenario.year}</span>
          </h2>
          <p className="mt-1 text-[12px] text-muted">{scenario.place}</p>
        </div>
        <span className="rounded-panel border border-line/25 bg-ground-deep px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted">{scenario.type} · {scenario.affectedVillages} villages</span>
      </div>

      {/* Linked response workflow */}
      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Response chain <span className="text-line-strong">/</span> Select a stage to continue</p>
        <div className="grid overflow-hidden rounded-panel border border-line/25 bg-panel sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Damage assessment", view: "damage" as const, note: assessed ? `${scenario.damagedHa} ha · ${scenario.confidence}% confidence` : "Satellite comparison ready", state: assessed ? "ASSESSED" : "READY" },
          { label: "Fund allocation", view: "relief" as const, note: `${fmtL(scenario.totalFund)} approved`, state: "ALLOCATED" },
          { label: "Village distribution", view: "relief" as const, note: `${fmtL(disbursed)} disbursed across ${villages.length}`, state: `${Math.round((disbursed / scenario.totalFund) * 100)}%` },
          { label: "Recovery tracking", view: "recovery" as const, note: `${completed} of ${villages.length} villages completed`, state: `${overall}%` },
        ].map((s, i) => (
          <div key={s.label} className={`relative min-w-0 ${i === 1 ? "border-t border-line/20 sm:border-t-0 sm:border-l" : ""} ${i === 2 ? "border-t border-line/20 sm:border-t xl:border-t-0 xl:border-l" : ""} ${i === 3 ? "border-t border-line/20 sm:border-l xl:border-t-0" : ""}`}>
            <button
              type="button"
              onClick={() => onView(s.view)}
              className="press group flex min-h-[104px] w-full flex-col items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-panel-raised/70 sm:p-5"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[9px] tracking-[0.14em] text-faint">0{i + 1}</span>
                <span className="rounded-panel border border-line/25 bg-ground-deep px-2 py-1 font-mono text-[8px] tracking-wider text-signal">{s.state}</span>
              </span>
              <span>
                <span className="block text-[12px] font-medium text-ink group-hover:text-signal">{s.label}<span aria-hidden className="ml-2 text-faint">→</span></span>
                <span className="mt-1 block text-[10px] leading-relaxed text-muted">{s.note}</span>
              </span>
            </button>
          </div>
        ))}
        </div>
      </div>

      {/* Fund chain summary */}
      <div className="rounded-panel border border-line/25 bg-panel p-5">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-faint">
          Fund Chain
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Stat label="Approved" value={fmtL(scenario.totalFund)} />
          <Sep />
          <Stat label="Disbursed" value={fmtL(disbursed)} />
          <Sep />
          <Stat label="Utilized" value={fmtL(utilized)} />
          <Sep />
          <Stat label="Overall Recovery" value={`${overall}%`} />
        </div>
        <div className="mt-4 border-t border-line/25 pt-3 font-mono text-[11px] text-muted">
          {villages.map((v) => `${v.name} · ${statusLabel[v.status]}`).join("  ·  ")}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mt-0.5 font-mono text-[20px] leading-none text-ink">{value}</div>
    </div>
  );
}

function Sep() {
  return <span className="hidden h-8 w-px bg-line/20 sm:block" />;
}

function Snapshot({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <dt className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className="mt-2 truncate font-mono text-[20px] leading-none tracking-tight text-ink sm:text-[22px]">{value}</dd>
      <p className="mt-1.5 truncate text-[10px] text-muted">{note}</p>
    </div>
  );
}
