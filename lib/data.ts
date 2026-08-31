/* ============================================================
   Kerala Floods 2018 — single demo scenario, Idukki district.
   ALL FIGURES ARE DEMO DATA for the prototype — they are NOT
   actual historical figures.
   ============================================================ */

export type VillageStatus =
  | "PENDING"
  | "ALLOCATED"
  | "DISBURSED"
  | "DUE"
  | "COMPLETED";

export interface Village {
  id: string;
  name: string;
  lat: number;
  lng: number;
  families: number;
  severity: "High" | "Moderate" | "Low";
  /** approved relief, in ₹ lakh */
  approved: number;
  /** fund released so far, in ₹ lakh (0 until disbursed) */
  disbursed: number;
  /** reported utilization, in ₹ lakh */
  utilized: number;
  /** restoration deadline, days */
  deadlineDays: number;
  status: VillageStatus;
  /** restoration progress when not completed (demo) */
  progress: number;
  completedOn?: string;
  mismatch?: { reported: number; expected: number };
}

export interface ScenarioMeta {
  id: string;
  name: string;
  year: string;
  type: string;
  state: string;
  district: string;
  place: string;
  area: string;
  lat: number;
  lng: number;
  zoom: number;
  color: string;
  blurb: string;
  preDate: string;
  postDate: string;
  damagedHa: number;
  confidence: number;
  affectedVillages: number;
  totalFund: number; // ₹ lakh
}

const KERALA: ScenarioMeta = {
  id: "kerala-2018",
  name: "Kerala Floods",
  year: "2018",
  type: "Flood",
  state: "Kerala",
  district: "Idukki",
  place: "Idukki District, Kerala",
  area: "Idukki dam catchment",
  lat: 10.0,
  lng: 77.05,
  zoom: 10,
  color: "rgb(96 152 162)",
  blurb: "Historic monsoon floods. Idukki catchment worst-hit.",
  preDate: "12 Jun 2018",
  postDate: "21 Aug 2018",
  damagedHa: 42.6,
  confidence: 91,
  affectedVillages: 8,
  totalFund: 50.0,
};

const AMPHAN: ScenarioMeta = {
  id: "amphan-2020",
  name: "Cyclone Amphan",
  year: "2020",
  type: "Cyclone",
  state: "West Bengal",
  district: "Purba Medinipur",
  place: "Purba Medinipur coast, West Bengal",
  area: "Contai coastal belt",
  lat: 21.75,
  lng: 87.6,
  zoom: 10,
  color: "rgb(214 138 66)",
  blurb: "Super cyclone landfall on the Bengal delta. Coastal damage, heavy relief ops.",
  preDate: "02 Apr 2020",
  postDate: "25 May 2020",
  damagedHa: 34.2,
  confidence: 86,
  affectedVillages: 6,
  totalFund: 42.0,
};

const WAYANAD: ScenarioMeta = {
  id: "wayanad-2024",
  name: "Wayanad Landslides",
  year: "2024",
  type: "Landslide",
  state: "Kerala",
  district: "Wayanad",
  place: "Mundakkai–Chooralmala, Wayanad",
  area: "Mundakkai hill slope",
  lat: 11.75,
  lng: 76.13,
  zoom: 11,
  color: "rgb(178 88 88)",
  blurb: "Slope failure after intense rainfall. Roads cut — satellite + citizen evidence critical.",
  preDate: "05 Jun 2024",
  postDate: "30 Jul 2024",
  damagedHa: 28.9,
  confidence: 93,
  affectedVillages: 6,
  totalFund: 36.5,
};

export const SCENARIO = KERALA; // default scenario meta (used by Landing)

/* Demo seed state — the app mutates copies of this via UI actions. */
export const initialVillages: Village[] = [
  {
    id: "vellathooval", name: "Vellathooval", lat: 10.05, lng: 77.05,
    families: 126, severity: "High", approved: 8.5, disbursed: 8.5,
    utilized: 6.8, deadlineDays: 30, status: "ALLOCATED", progress: 80,
  },
  {
    id: "adimali", name: "Adimali", lat: 10.11, lng: 77.08,
    families: 94, severity: "Moderate", approved: 6.2, disbursed: 6.2,
    utilized: 4.9, deadlineDays: 30, status: "DISBURSED", progress: 80,
  },
  {
    id: "kattappana", name: "Kattappana", lat: 9.75, lng: 77.12,
    families: 151, severity: "High", approved: 10.4, disbursed: 0,
    utilized: 0, deadlineDays: 30, status: "PENDING", progress: 50,
    mismatch: { reported: 8.2, expected: 7.1 },
  },
  {
    id: "munnar", name: "Munnar", lat: 10.09, lng: 77.16,
    families: 88, severity: "Moderate", approved: 7.6, disbursed: 7.6,
    utilized: 7.6, deadlineDays: 30, status: "COMPLETED", progress: 100,
    completedOn: "12 Sep 2018",
  },
  {
    id: "cheruthoni", name: "Cheruthoni", lat: 9.98, lng: 76.97,
    families: 112, severity: "High", approved: 9.1, disbursed: 0,
    utilized: 0, deadlineDays: 30, status: "PENDING", progress: 40,
  },
  {
    id: "nedumkandam", name: "Nedumkandam", lat: 10.06, lng: 77.11,
    families: 76, severity: "Low", approved: 8.2, disbursed: 0,
    utilized: 0, deadlineDays: 30, status: "ALLOCATED", progress: 45,
  },
];

/* ---------- helpers ---------- */

/** ₹ lakh → "₹8.5L" */
export const fmtL = (v: number) => `₹${v.toFixed(1)}L`;

/** ₹ lakh → full indian-format rupees "₹8,50,000" */
export const fmtFull = (v: number) =>
  `₹${Math.round(v * 100000).toLocaleString("en-IN")}`;

/** Restoration progress for a village (100% once completed). */
export const recoveryPct = (v: Village) =>
  v.status === "COMPLETED" ? 100 : v.progress;

export const statusLabel: Record<VillageStatus, string> = {
  PENDING: "PENDING",
  ALLOCATED: "ALLOCATED",
  DISBURSED: "DISBURSED",
  DUE: "RESTORATION DUE",
  COMPLETED: "COMPLETED",
};

/* ---------- Amphan 2020 — Purba Medinipur coast (demo villages) ---------- */
const AMPHAN_VILLAGES: Village[] = [
  { id: "contai", name: "Contai", lat: 21.67, lng: 87.52, families: 148, severity: "High", approved: 9.4, disbursed: 9.4, utilized: 7.1, deadlineDays: 30, status: "DISBURSED", progress: 74 },
  { id: "digha", name: "Digha", lat: 21.83, lng: 87.51, families: 132, severity: "High", approved: 8.8, disbursed: 0, utilized: 0, deadlineDays: 30, status: "PENDING", progress: 38, mismatch: { reported: 6.4, expected: 5.2 } },
  { id: "shankarpur", name: "Shankarpur", lat: 21.79, lng: 87.61, families: 84, severity: "Moderate", approved: 5.9, disbursed: 5.9, utilized: 5.9, deadlineDays: 30, status: "COMPLETED", progress: 100, completedOn: "04 Jul 2020" },
  { id: "ramnagar", name: "Ramnagar", lat: 21.74, lng: 87.44, families: 96, severity: "Moderate", approved: 6.4, disbursed: 6.4, utilized: 4.3, deadlineDays: 30, status: "ALLOCATED", progress: 62 },
  { id: "kalinagar", name: "Kalinagar", lat: 21.71, lng: 87.57, families: 71, severity: "Low", approved: 4.8, disbursed: 0, utilized: 0, deadlineDays: 30, status: "PENDING", progress: 30 },
  { id: "majna", name: "Majna", lat: 21.86, lng: 87.68, families: 63, severity: "Low", approved: 6.7, disbursed: 6.7, utilized: 5.1, deadlineDays: 30, status: "ALLOCATED", progress: 55 },
];

/* ---------- Wayanad 2024 — Mundakkai–Chooralmala slope (demo villages) ---------- */
const WAYANAD_VILLAGES: Village[] = [
  { id: "mundakkai", name: "Mundakkai", lat: 11.75, lng: 76.13, families: 118, severity: "High", approved: 9.9, disbursed: 9.9, utilized: 8.7, deadlineDays: 30, status: "DISBURSED", progress: 84 },
  { id: "chooralmala", name: "Chooralmala", lat: 11.76, lng: 76.14, families: 137, severity: "High", approved: 8.1, disbursed: 0, utilized: 0, deadlineDays: 30, status: "PENDING", progress: 42, mismatch: { reported: 6.9, expected: 5.8 } },
  { id: "attamala", name: "Attamala", lat: 11.74, lng: 76.12, families: 66, severity: "Moderate", approved: 5.2, disbursed: 5.2, utilized: 3.8, deadlineDays: 30, status: "ALLOCATED", progress: 58 },
  { id: "meppadi", name: "Meppadi", lat: 11.72, lng: 76.16, families: 89, severity: "Moderate", approved: 4.6, disbursed: 4.6, utilized: 4.6, deadlineDays: 30, status: "COMPLETED", progress: 100, completedOn: "26 Aug 2024" },
  { id: "poothali", name: "Poothali", lat: 11.78, lng: 76.10, families: 54, severity: "Low", approved: 3.9, disbursed: 0, utilized: 0, deadlineDays: 30, status: "PENDING", progress: 22 },
  { id: "vellarimala", name: "Vellarimala", lat: 11.73, lng: 76.09, families: 47, severity: "Low", approved: 4.8, disbursed: 4.8, utilized: 3.6, deadlineDays: 30, status: "ALLOCATED", progress: 49 },
];

/* ---------- Multi-event registry ---------------------------------------- */
export interface Scenario {
  meta: ScenarioMeta;
  villages: Village[];
}

export const scenarios: Scenario[] = [
  { meta: KERALA, villages: initialVillages },
  { meta: AMPHAN, villages: AMPHAN_VILLAGES },
  { meta: WAYANAD, villages: WAYANAD_VILLAGES },
];

export const DEFAULT_SCENARIO_ID = KERALA.id;

export const getScenario = (id: string): Scenario =>
  scenarios.find((s) => s.meta.id === id) ?? scenarios[0];