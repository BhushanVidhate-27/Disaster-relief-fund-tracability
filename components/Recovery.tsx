"use client";

import { recoveryPct, statusLabel, type Village } from "@/lib/data";

/** Village-level restoration bars + overall recovery. */
export function Recovery({ villages }: { villages: Village[] }) {
  const overall = Math.round(
    villages.reduce((s, v) => s + recoveryPct(v), 0) / villages.length
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-panel border border-line/25 bg-panel">
        <div className="border-b border-line/25 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-faint">
          Village-level Restoration
        </div>
        <div className="px-5">
          {villages.map((v) => {
            const pct = recoveryPct(v);
            const blocks = Math.round(pct / 10);
            return (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line/15 py-4 last:border-b-0"
              >
                <span className="w-32 text-[13px] font-medium text-ink">{v.name}</span>
                <span className="font-mono text-[13px] tracking-[0.15em] text-signal">
                  {"█".repeat(blocks)}
                  <span className="text-faint/40">{"░".repeat(10 - blocks)}</span>
                </span>
                <span className="w-12 font-mono text-[13px] text-ink">{pct}%</span>
                <span
                  className={`ml-auto font-mono text-[10px] tracking-widest ${
                    v.status === "COMPLETED" ? "text-[#5f9e6e]" : "text-faint"
                  }`}
                >
                  {statusLabel[v.status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line/25 pt-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
          Overall Recovery
        </div>
        <div className="mt-1 font-mono text-[40px] leading-none text-ink">
          {overall}%
        </div>
      </div>
    </div>
  );
}