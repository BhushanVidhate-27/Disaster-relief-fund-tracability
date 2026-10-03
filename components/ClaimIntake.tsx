"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gps as readGps } from "exifr";
import piexif from "piexifjs";
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
  const [evidenceStatus, setEvidenceStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fillingDevData, setFillingDevData] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [claimsError, setClaimsError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const evidenceCheckId = useRef(0);

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

  async function fillDevData() {
    setFields({
      ...DEV_FIELDS,
      latitude: village.lat.toFixed(6),
      longitude: village.lng.toFixed(6),
    });
    setEvidence(null);
    setEvidenceStatus("checking");
    setEvidenceMessage("Preparing geotagged dev image…");
    setSubmittedReference("");
    setSubmitError("");
    evidenceCheckId.current += 1;
    setFillingDevData(true);
    try {
      const file = createGeotaggedDevImage(village.lat, village.lng);
      if (!fileInput.current) throw new Error("Evidence input is unavailable");
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.current.files = transfer.files;
      await verifyEvidence(file);
    } catch {
      setEvidence(null);
      setEvidenceStatus("invalid");
      setEvidenceMessage("Could not prepare the geotagged dev image. Try again.");
    } finally {
      setFillingDevData(false);
    }
  }

  async function verifyEvidence(file: File | undefined) {
    const checkId = ++evidenceCheckId.current;
    setEvidence(null);
    setEvidenceStatus(file ? "checking" : "idle");
    setEvidenceMessage("");
    setSubmitError("");
    setSubmittedReference("");
    if (!file) return;

    try {
      const coordinates = await readGps(file);
      if (checkId !== evidenceCheckId.current) return;
      if (
        !coordinates ||
        !Number.isFinite(coordinates.latitude) ||
        !Number.isFinite(coordinates.longitude) ||
        Math.abs(coordinates.latitude) > 90 ||
        Math.abs(coordinates.longitude) > 180
      ) {
        throw new Error("GPS metadata not found");
      }

      setEvidence(file);
      setEvidenceStatus("valid");
      setEvidenceMessage("Geotag verified from image metadata.");
      setFields((current) => ({
        ...current,
        latitude: coordinates.latitude.toFixed(6),
        longitude: coordinates.longitude.toFixed(6),
      }));
    } catch {
      if (checkId !== evidenceCheckId.current) return;
      setEvidence(null);
      setEvidenceStatus("invalid");
      setEvidenceMessage("Not a geotagged image. Choose a photo with GPS location metadata.");
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmittedReference("");
    if (!evidence || evidenceStatus !== "valid") {
      setSubmitError("Choose a geotagged damage photo before submitting.");
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
          disabled={fillingDevData}
          className="press rounded-panel border border-line/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted hover:bg-panel-raised hover:text-ink disabled:opacity-60"
        >
          {fillingDevData ? "Preparing…" : "Fill dev data"}
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
              aria-describedby="evidence-metadata-status"
              onChange={(event) => void verifyEvidence(event.target.files?.[0])}
              className="block w-full text-[12px] text-muted file:mr-3 file:rounded-panel file:border-0 file:bg-panel-raised file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-wider file:text-ink"
            />
            <span id="evidence-metadata-status" role={evidenceStatus === "invalid" ? "alert" : "status"} className={`mt-1 block text-[10px] ${evidenceStatus === "invalid" ? "text-[#c04a3e]" : evidenceStatus === "valid" ? "text-[#5f9e6e]" : "text-faint"}`}>
              {evidenceMessage || "Photo must contain GPS location metadata."}
            </span>
          </Field>
          <div>
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-faint">Photo GPS coordinates</span>
            <div className="grid grid-cols-2 gap-2">
              <input required readOnly aria-label="Latitude" type="number" placeholder="Latitude" value={fields.latitude} className={`${inputClass} cursor-not-allowed opacity-80`} />
              <input required readOnly aria-label="Longitude" type="number" placeholder="Longitude" value={fields.longitude} className={`${inputClass} cursor-not-allowed opacity-80`} />
            </div>
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

function createGeotaggedDevImage(latitude: number, longitude: number): File {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  context.fillStyle = "#e9e7e0";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#343a35";
  context.font = "600 24px sans-serif";
  context.fillText("DEVELOPMENT EVIDENCE IMAGE", 32, 58);
  context.font = "16px monospace";
  context.fillText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 32, 92);

  const exif = piexif.dump({
    "0th": {
      [piexif.ImageIFD.Make]: "INNOVISION",
      [piexif.ImageIFD.Model]: "Development sample",
    },
    Exif: {},
    GPS: {
      [piexif.GPSIFD.GPSVersionID]: [2, 3, 0, 0],
      [piexif.GPSIFD.GPSLatitudeRef]: latitude < 0 ? "S" : "N",
      [piexif.GPSIFD.GPSLatitude]: piexif.GPSHelper.degToDmsRational(Math.abs(latitude)),
      [piexif.GPSIFD.GPSLongitudeRef]: longitude < 0 ? "W" : "E",
      [piexif.GPSIFD.GPSLongitude]: piexif.GPSHelper.degToDmsRational(Math.abs(longitude)),
    },
    "1st": {},
  });
  const imageUrl = piexif.insert(exif, canvas.toDataURL("image/jpeg", 0.9));
  const binary = atob(imageUrl.split(",")[1]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], "geotagged-dev-evidence.jpg", { type: "image/jpeg" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-faint">{label}</span>
      {children}
    </label>
  );
}