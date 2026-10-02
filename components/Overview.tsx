"use client";

import {
  fmtL,
  scenarios,
  type ScenarioMeta,
  type Village,
} from "@/lib/data";
import { EventSwitcher } from "@/components/EventSwitcher";

export function Overview({
  scenario,
  villages,
  assessed,
  onSelectScenario,
}: {
  scenario: ScenarioMeta;
  villages: Village[];
  assessed: boolean;
  onSelectScenario: (id: string) => void;
}) {
  const disbursed = villages.reduce((s, v) => s + v.disbursed, 0);
  const overall = Math.round(
    villages.reduce((s, v) => s + (v.status === "COMPLETED" ? 100 : v.progress), 0) /
      villages.length
  );
  const completed = villages.filter((v) => v.status === "COMPLETED").length;

  const f = scenario.facts;
  const impact = [
    { label: "Deaths", value: f.deaths?.toLocaleString("en-IN") },
    { label: "People affected", value: f.affected?.toLocaleString("en-IN") },
    { label: "Displaced", value: f.displaced?.toLocaleString("en-IN") },
    { label: "Homes damaged", value: f.housesDamaged?.toLocaleString("en-IN") },
    {
      label: "Peak rainfall",
      value: f.rainfallMm ? `${f.rainfallMm} mm` : undefined,
    },
    {
      label: "Est. economic loss",
      value: f.economicLossCr
        ? `₹${f.economicLossCr.toLocaleString("en-IN")} Cr`
        : undefined,
    },
  ].filter((x): x is { label: string; value: string } => Boolean(x.value));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-signal">
            <span className="size-1.5 rounded-full bg-signal" />
            {scenario.name} {scenario.year}
          </p>
          <h1 className="text-[25px] font-semibold tracking-[-0.03em] text-ink sm:text-[29px]">
            {scenario.type} · {scenario.place}
          </h1>
        </div>
        <span className="rounded-panel border border-line/25 bg-panel px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-faint">
          {assessed ? "Damage assessed" : "Awaiting assessment"}
        </span>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-y divide-line/20 overflow-hidden rounded-panel border border-line/25 bg-panel sm:grid-cols-4 sm:divide-y-0">
        <Snapshot label="Villages mapped" value={String(villages.length).padStart(2, "0")} note={scenario.district} />
        <Snapshot label="Approved fund" value={fmtL(scenario.totalFund)} note="modelled" />
        <Snapshot label="Disbursed" value={fmtL(disbursed)} note={`${villages.length} villages`} />
        <Snapshot label="Recovery" value={`${overall}%`} note={`${completed} completed`} />
      </dl>

      <EventSwitcher selected={scenario} onSelect={onSelectScenario} />

      <div className="rounded-panel border border-line/25 bg-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Recorded impact
          </div>
          <span className="rounded-panel border border-line/25 bg-ground-deep px-2 py-1 font-mono text-[8px] tracking-wider text-signal">
            SOURCED
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {impact.map((x) => (
            <Stat key={x.label} label={x.label} value={x.value} />
          ))}
        </div>

        <ul className="mt-5 space-y-1.5 border-t border-line/25 pt-4 text-[11px] leading-relaxed text-muted">
          {f.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span aria-hidden className="text-faint">
                —
              </span>
              <span>{n}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line/25 pt-3">
          {f.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-[9px] tracking-wider text-faint underline decoration-line-strong underline-offset-4 transition-colors hover:text-signal"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-faint">
        Fund amounts, recovery percentages and AI confidence above are modelled.
        Recorded impact figures are sourced — see the links above.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
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

function Snapshot({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <dt className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="mt-2 truncate font-mono text-[20px] leading-none tracking-tight text-ink sm:text-[22px]">
        {value}
      </dd>
      <p className="mt-1.5 truncate text-[10px] text-muted">{note}</p>
    </div>
  );
}