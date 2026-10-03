"use client";

import { useEffect, useState } from "react";
import { ClaimsList } from "@/components/ClaimsList";
import { listAllClaims, type ClaimRecord } from "@/lib/claimStore";

export function ManageClaimsSection() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listAllClaims()
      .then((records) => {
        if (active) setClaims(records);
      })
      .catch(() => {
        if (active) setError("Could not load saved claims from this device.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="manage-claims-title">
      <div className="border-b border-line/25 pb-4">
        <h1 id="manage-claims-title" className="text-[20px] font-semibold text-ink">
          Manage claims
        </h1>
        <p className="mt-1 text-[12px] text-muted">Saved claims across all villages on this device.</p>
      </div>
      <ClaimsList
        claims={claims}
        loading={loading}
        error={error}
        title="Claims"
        showVillage
      />
    </section>
  );
}