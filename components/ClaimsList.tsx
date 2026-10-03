"use client";

import { useEffect, useState } from "react";
import type { ClaimRecord } from "@/lib/claimStore";

export function ClaimsList({
  claims,
  loading,
  error,
  title,
  showVillage = false,
}: {
  claims: ClaimRecord[];
  loading: boolean;
  error: string;
  title: string;
  showVillage?: boolean;
}) {
  return (
    <div className="mt-5 border-t border-line/20 pt-4" aria-labelledby="claims-list-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="claims-list-title" className="font-mono text-[10px] uppercase tracking-widest text-faint">
          {title}
        </h3>
        <span className="font-mono text-[10px] text-faint">{claims.length}</span>
      </div>
      {loading ? (
        <p className="mt-3 text-[12px] text-faint">Loading claims…</p>
      ) : error ? (
        <p role="alert" className="mt-3 text-[12px] text-[#c04a3e]">{error}</p>
      ) : claims.length === 0 ? (
        <p className="mt-3 text-[12px] text-faint">No saved claims.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line/15">
          {claims.map((claim) => (
            <li key={claim.reference}>
              <details className="group py-3">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-[12px] marker:text-faint">
                  <span className="font-mono text-signal">{claim.reference}</span>
                  <span className="text-ink">{claim.claimantName}</span>
                  {showVillage && <span className="text-muted">{claim.villageName}</span>}
                  <span className="text-muted">{claim.category}</span>
                  <span className="ml-auto font-mono text-ink">
                    {formatAmount(claim.requestedAmount)}
                  </span>
                </summary>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 border-l border-line/25 pl-3 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
                  <ClaimValue label="Village" value={claim.villageName} />
                  <ClaimValue label="Submitted" value={new Date(claim.submittedAt).toLocaleString("en-IN")} />
                  <ClaimValue label="Mobile" value={claim.phone} />
                  <ClaimValue label="Household ID" value={claim.householdId} />
                  <ClaimValue label="Evidence GPS" value={`${claim.latitude.toFixed(6)}, ${claim.longitude.toFixed(6)}`} />
                  <ClaimValue label="Evidence file" value={claim.evidenceName} />
                  <ClaimValue label="Loss details" value={claim.details} />
                  <ClaimEvidence evidence={claim.evidence} name={claim.evidenceName} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClaimValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[9px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mt-1 break-words text-ink">{value}</div>
    </div>
  );
}

function ClaimEvidence({ evidence, name }: { evidence: Blob; name: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(evidence);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [evidence]);

  return (
    <figure className="sm:col-span-2 lg:col-span-3">
      {url && <img src={url} alt={`Damage evidence: ${name}`} className="max-h-48 max-w-full rounded-panel border border-line/20 object-contain" />}
      <figcaption className="mt-1 text-faint">{name}</figcaption>
    </figure>
  );
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}