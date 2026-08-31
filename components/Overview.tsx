"use client";

import {
  fmtL,
  recoveryPct,
  statusLabel,
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
      {/* Multi-event map + case list */}
      <EventSwitcher selected={scenario} onSelect={onSelectScenario} />

      {/* Case header */}
      <div className="border-b border-line/25 pb-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">
          {scenario.name} — {scenario.year}
        </h2>
        <p className="mt-1 text-[13px] text-muted">{scenario.place} · Demo data</p>
      </div>

      {/* Flow */}
      <div className="flex flex-col items-start gap-1 font-mono text-[12px] tracking-widest">
        {[
          { label: "DAMAGE", view: "damage" as const, note: assessed ? `${scenario.damagedHa} ha · ${scenario.confidence}%` : "not run" },
          { label: "FUND ALLOCATION", view: "relief" as const, note: fmtL(scenario.totalFund) },
          { label: "DISTRIBUTION", view: "relief" as const, note: `${villages.length} villages · ${fmtL(disbursed)} disbursed` },
          { label: "RESTORATION", view: "recovery" as const, note: `${overall}% overall · ${completed}/${villages.length} completed` },
        ].map((s, i) => (
          <div key={s.label} className="flex flex-col items-start">
            {i > 0 && <span className="py-0.5 text-faint">↓</span>}
            <button
              type="button"
              onClick={() => onView(s.view)}
              className="press flex items-baseline gap-3 text-left transition-colors hover:text-signal"
            >
              <span className="text-signal">{s.label}</span>
              <span className="font-mono text-[11px] normal-case tracking-normal text-faint">
                {s.note}
              </span>
            </button>
          </div>
        ))}
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