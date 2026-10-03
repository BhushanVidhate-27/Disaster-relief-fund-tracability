"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Village } from "@/lib/data";
import { listClaims, saveClaim, type ClaimRecord } from "@/lib/claimStore";
import { ClaimsList } from "@/components/ClaimsList";

type ClaimFields = {
  claimantName: string;
  phone: string;
  householdId: string;
  category: string;
  requestedAmount: string;
  details: string;
  latitude: string;
  longitude: string;
};

const EMPTY: ClaimFields = {
  claimantName: "",
  phone: "",
  householdId: "",
  category: "House damage",
  requestedAmount: "",
  details: "",
  latitude: "",
  longitude: "",
};

const DEV_FIELDS: ClaimFields = {
  claimantName: "Test Claimant",
  phone: "9000000000",
  householdId: "DEV-CLAIM-001",
  category: "House damage",
  requestedAmount: "75000",
  details: "Roof and two rooms damaged during the disaster.",
  latitude: "",
  longitude: "",
};

export function ClaimIntake({ village }: { village: Village }) {
  const [fields, setFields] = useState(EMPTY);
  const [evidence, setEvidence] = useState<File | null>(null);
  const [locationError, setLocationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [claimsError, setClaimsError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setClaimsLoading(true);
    listClaims(village.id)
      .then((records) => {
        if (active) setClaims(records);
      })
      .catch(() => {
        if (active) setClaimsError("Could not load saved claims from this device.");
      })
      .finally(() => {
        if (active) setClaimsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [village.id]);

  function update<K extends keyof ClaimFields>(key: K, value: ClaimFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setSubmittedReference("");
  }

  function fillDevData() {
    setFields({
      ...DEV_FIELDS,
      latitude: village.lat.toFixed(6),
      longitude: village.lng.toFixed(6),
    });
    setEvidence(null);
    setSubmittedReference("");
    setSubmitError("");
    setLocationError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function captureLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFields((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setSubmittedReference("");
      },
      () => setLocationError("Could not read location. Check device permission or enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmittedReference("");
    if (!evidence) {
      setSubmitError("Attach a damage photo before submitting.");
      return;
    }

    const latitude = Number(fields.latitude);
    const longitude = Number(fields.longitude);
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setSubmitError("Enter valid GPS coordinates or capture the device location.");
      return;
    }

    const reference = `CLM-${crypto.randomUUID().toUpperCase()}`;
    setSaving(true);
    try {
      const record: ClaimRecord = {
        reference,
        claimantName: fields.claimantName.trim(),
        phone: fields.phone.trim(),
        householdId: fields.householdId.trim(),
        villageId: village.id,
        villageName: village.name,
        category: fields.category,
        requestedAmount: Number(fields.requestedAmount),
        details: fields.details.trim(),
        latitude,
        longitude,
        evidenceName: evidence.name,
        evidence,
        submittedAt: new Date().toISOString(),
      };
      await saveClaim(record);
      setClaims((current) => [record, ...current]);
      setSubmittedReference(reference);
    } catch {
      setSubmitError("The claim could not be saved on this device. Check available browser storage and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-panel border border-line/25 bg-panel p-4 sm:p-5" aria-labelledby="claim-intake-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/20 pb-4">
        <div>
          <h2 id="claim-intake-title" className="text-[15px] font-medium text-ink">
            Individual relief claim
          </h2>
          <p className="mt-1 text-[12px] text-muted">
            {village.name} · Attach damage evidence and its GPS location.
          </p>
        </div>
        <button
          type="button"
          onClick={fillDevData}
          className="press rounded-panel border border-line/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted hover:bg-panel-raised hover:text-ink"
        >
          Fill dev data
        </button>
      </div>

      <form className="mt-4" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Claimant name">
            <input required autoComplete="name" value={fields.claimantName} onChange={(event) => update("claimantName", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Mobile number">
            <input required type="tel" autoComplete="tel" inputMode="numeric" maxLength={18} value={fields.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Household / ration-card ID">
            <input required value={fields.householdId} onChange={(event) => update("householdId", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Claim category">
            <select value={fields.category} onChange={(event) => update("category", event.target.value)} className={inputClass}>
              <option>House damage</option>
              <option>Livelihood loss</option>
              <option>Crop loss</option>
              <option>Essential needs</option>
              <option>Other verified loss</option>
            </select>
          </Field>
          <Field label="Amount requested (₹)">
            <input required type="number" min="1" step="1" inputMode="numeric" value={fields.requestedAmount} onChange={(event) => update("requestedAmount", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Damage / loss details">
            <input required maxLength={500} value={fields.details} onChange={(event) => update("details", event.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line/20 pt-4 sm:grid-cols-2">
          <Field label="Damage evidence photo">
            <input
              ref={fileInput}
              required
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                setEvidence(event.target.files?.[0] ?? null);
                setSubmittedReference("");
              }}
              className="block w-full text-[12px] text-muted file:mr-3 file:rounded-panel file:border-0 file:bg-panel-raised file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-wider file:text-ink"
            />
            <span className="mt-1 block text-[10px] text-faint">Image is stored with the claim and its GPS coordinates.</span>
          </Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-faint">Evidence GPS coordinates</span>
              <button type="button" onClick={captureLocation} className="press font-mono text-[10px] text-signal hover:underline">
                Use device location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input required aria-label="Latitude" type="number" min="-90" max="90" step="any" placeholder="Latitude" value={fields.latitude} onChange={(event) => update("latitude", event.target.value)} className={inputClass} />
              <input required aria-label="Longitude" type="number" min="-180" max="180" step="any" placeholder="Longitude" value={fields.longitude} onChange={(event) => update("longitude", event.target.value)} className={inputClass} />
            </div>
            {locationError && <p role="alert" className="mt-1 text-[11px] text-[#c04a3e]">{locationError}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line/20 pt-4">
          <button type="submit" disabled={saving} className="press rounded-panel bg-signal px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--on-signal))] disabled:cursor-wait disabled:opacity-60">
            {saving ? "Saving claim…" : "Submit claim"}
          </button>
          <p className="text-[10px] text-faint">Saved on this device only; this project has no connected claims service.</p>
        </div>
        {submitError && <p role="alert" className="mt-3 text-[12px] text-[#c04a3e]">{submitError}</p>}
        {submittedReference && (
          <p role="status" className="mt-3 border-t border-line/20 pt-3 text-[12px] text-ink">
            Claim saved · <span className="font-mono text-signal">{submittedReference}</span> · awaiting verification
          </p>
        )}
      </form>

      <ClaimsList
        claims={claims}
        loading={claimsLoading}
        error={claimsError}
        title={`Previous claims · ${village.name}`}
      />
    </section>
  );
}

const inputClass = "w-full rounded-panel border border-line/30 bg-ground-deep px-3 py-2.5 text-[12px] text-ink placeholder:text-faint focus:border-signal/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-faint">{label}</span>
      {children}
    </label>
  );
}