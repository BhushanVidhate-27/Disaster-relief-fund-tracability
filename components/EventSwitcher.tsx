"use client";

import dynamic from "next/dynamic";
import { scenarios, type ScenarioMeta } from "@/lib/data";

const EventMapInner = dynamic(
  () => import("@/components/EventMapInner").then((m) => m.EventMapInner),
  { ssr: false, loading: () => <div className="h-[440px] w-full animate-pulse bg-ground-deep lg:h-[520px]" /> }
);

/** Multiple disaster events: India map with one marker per event + a
    clickable case list. Selecting an event loads its whole workflow. */
export function EventSwitcher({
  selected,
  onSelect,
}: {
  selected: ScenarioMeta;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)]">
      <div className="flex min-h-0 flex-col rounded-panel border border-line/25 bg-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-medium text-ink">Disaster Events · India</div>
          <div className="font-mono text-[10px] text-faint">
            {scenarios.length} events · MAP / SAT · click to load
          </div>
        </div>
        <div className="darkmap min-h-0 flex-1 overflow-hidden rounded-panel border border-line/25">
          <EventMapInner selected={selected} onSelect={onSelect} />
        </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-panel border border-line/25 bg-panel">
        <div className="flex items-center justify-between border-b border-line/25 px-5 py-3">
          <div className="text-[13px] font-medium text-ink">Recent Disaster Cases</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Demo data
          </div>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-line/15 overflow-y-auto">
          {scenarios.map((s) => {
            const active = s.meta.id === selected.id;
            return (
              <li key={s.meta.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.meta.id)}
                  aria-pressed={active}
                  className={`press flex w-full items-center gap-4 px-5 py-3 text-left transition-colors ${
                    active ? "bg-panel-raised" : "hover:bg-panel-raised/60"
                  }`}
                >
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: s.meta.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[13px] text-ink">{s.meta.name}</span>
                      <span className="font-mono text-[11px] text-faint">{s.meta.year}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {s.meta.type} · {s.meta.district}, {s.meta.state}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-faint">
                      {s.meta.blurb}
                    </div>
                  </div>
                  {active && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                      Active
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}