/* ============================================================
   Three real disaster scenarios with source-backed event facts.

   PROVENANCE:
   - meta.facts.*          verified historical figures (see facts.sources)
   - coordinates, dates    verified against cited sources
   - families, approved,
     disbursed, utilized,
     severity, confidence,
     totalFund            MODELLED — no public record exists
   ============================================================ */

export type VillageStatus = "PENDING" | "ALLOCATED" | "DISBURSED";

export interface SourceRef {
  label: string;
  url: string;
}

export interface EventFacts {
  deaths?: number;
  affected?: number;
  displaced?: number;
  housesDamaged?: number;
  rainfallMm?: number;
  economicLossCr?: number;
  notes: string[];
  sources: SourceRef[];
}

export interface Village {
  id: string;
  name: string;
  lat: number;
  lng: number;
  families: number;
  severity: "High" | "Moderate" | "Low";
  /** approved relief, in ₹ lakh (MODELLED) */
  approved: number;
  /** fund released so far, in ₹ lakh (0 until disbursed) (MODELLED) */
  disbursed: number;
  /** reported utilization, in ₹ lakh (MODELLED) */
  utilized: number;
  status: VillageStatus;
  mismatch?: { reported: number; expected: number };
  /** Census 2011 population, only where a source was verified */
  population2011?: number;
  /** true when lat/lng are a documented point, false when placed in-block */
  coordsVerified: boolean;
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
  totalFund: number; // ₹ lakh (MODELLED)
  facts: EventFacts;
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
  lat: 9.92,
  lng: 77.04,
  zoom: 10,
  color: "rgb(96 152 162)",
  blurb:
    "Record monsoon rainfall in Aug 2018. Idukki took 143 of the state's 341 landslides and the most damaged roads.",
  preDate: "01 Jun 2018",
  postDate: "28 Aug 2018",
  damagedHa: 65188,
  confidence: 91,
  affectedVillages: 6,
  totalFund: 50.0,
  facts: {
    deaths: 433,
    affected: 5400000,
    displaced: 1400000,
    housesDamaged: 317000,
    rainfallMm: 3555.5,
    economicLossCr: 26720,
    notes: [
      "Deaths 433 covers 22 May - 29 Aug 2018 per the state PDNA; later compilations cite 483-500 for the wider 2018 monsoon, so the count depends on date range and definition.",
      "Rainfall 3555.5 mm is Idukki district, 1 Jun - 19 Aug 2018, against a 1851.7 mm normal (+92%).",
      "damagedHa 65,188 ha is NRSC satellite-mapped inundation for Kerala statewide (16 Jul - 28 Aug 2018), not Idukki district alone.",
      "economicLossCr 26,720 crore is the PDNA's total disaster effects for Kerala, not a relief budget.",
      "Idukki district recorded 54 deaths, 2,130 km of damaged roads and 143 landslides - the worst-affected district in the state.",
      "Idukki Dam's five overflow gates were opened for the first time in 26 years, peaking at about 1,500 m3/s on 16 Aug against roughly 2,532 m3/s inflow.",
    ],
    sources: [
      {
        label: "Kerala State Post-Disaster Needs Assessment Report, 2018 (SDMA)",
        url: "https://sdma.kerala.gov.in/wp-content/uploads/2019/03/PDNA-report-FINAL-FEB-2019_compressed.pdf",
      },
      {
        label: "Vellathooval Grama Panchayat, LSG Kerala (population, area)",
        url: "https://vellathoovalpanchayat.lsgkerala.gov.in/en",
      },
    ],
  },
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
  lat: 21.73,
  lng: 87.62,
  zoom: 10,
  color: "rgb(214 138 66)",
  blurb:
    "Super cyclone landfall on the Bengal delta on 20 May 2020. The worst destruction was south of here, across the delta in South 24 Parganas.",
  preDate: "15 May 2020",
  postDate: "24 May 2020",
  damagedHa: 215600,
  confidence: 86,
  affectedVillages: 6,
  totalFund: 42.0,
  facts: {
    deaths: 86,
    affected: 13600000,
    displaced: 850000,
    housesDamaged: 2856000,
    rainfallMm: 236,
    economicLossCr: 102442,
    notes: [
      "Deaths 86 is the West Bengal figure. Widely cited totals of 128-133 include Odisha and other affected states, so figures differ by source.",
      "Landfall was on the afternoon of 20 May 2020 near Bakkhali / Sagar Island; some West Bengal reports place it near Digha.",
      "damagedHa 215,600 ha is the 21,560 km2 flood-affected area, i.e. flood extent rather than a structural-damage area.",
      "economicLossCr 102,442 crore is the West Bengal damage assessment (about USD 13.5 bn).",
      "The worst-hit blocks were Namkhana, Kakdwip, Sagar, Patharpratima, Basanti and Gosaba in South 24 Parganas, plus Kolkata, Howrah and Hooghly - not Purba Medinipur.",
      "Purba Medinipur took the storm on its weaker southern flank, so the losses shown here are lighter than the delta's.",
    ],
    sources: [
      {
        label: "Reuters - Cyclone Amphan loss estimated at $13 billion in India",
        url: "https://www.reuters.com/article/world/cyclone-amphan-loss-estimated-at-13-billion-in-india-may-rise-in-bangladesh-idUSKBN22Z0G2/",
      },
      {
        label: "The Hindu - 72 killed in Cyclone Amphan fury, 15 dead in Kolkata alone",
        url: "https://www.thehindu.com/news/cities/kolkata/72-killed-in-cyclone-amphan-fury-15-dead-in-kolkata-alone/article61654251.ece",
      },
    ],
  },
};

const WAYANAD: ScenarioMeta = {
  id: "wayanad-2024",
  name: "Wayanad Landslides",
  year: "2024",
  type: "Landslide",
  state: "Kerala",
  district: "Wayanad",
  place: "Mundakkai–Chooralmala, Wayanad",
  area: "Meppadi Grama Panchayat, Vythiri taluk",
  lat: 11.4785,
  lng: 76.1428,
  zoom: 12,
  color: "rgb(178 88 88)",
  blurb:
    "Debris flow after ~372 mm of rain in a day on 30 Jul 2024 wiped out four settlements on the Mundakkai slope.",
  preDate: "29 Apr 2024",
  postDate: "30 Jul 2024",
  damagedHa: 8.6,
  confidence: 93,
  affectedVillages: 6,
  totalFund: 36.5,
  facts: {
    deaths: 420,
    displaced: 10000,
    rainfallMm: 372.6,
    economicLossCr: 1200,
    notes: [
      "Deaths 420 with 397 injured. The missing count is disputed - 47 in some summaries, 118 in others, with 231 bodies recovered.",
      "Rainfall 372.6 mm at Kalladi on 30 Jul 2024, following 204.5 mm on 29 Jul - about 572 mm across the two days.",
      "damagedHa 8.6 ha is the 86,000 m2 landslide scar measured from ISRO Cartosat-3 imagery. The crown sat at about 1,550 m ASL.",
      "economicLossCr 1,200 crore is the reported property-damage estimate.",
      "The slide affected about 0.98 km2 in Meppadi Grama Panchayat, concentrated in Vellarimala revenue village wards 10-12, washing out 219 buildings.",
      "Coordinates follow the International Consortium on Landslides record (11.4646, 76.1348) and Nature's Scientific Reports study of the Chooralmala bridge (11.4992, 76.1601). Wikipedia's infobox coordinate for this event is wrong by roughly 30 km.",
    ],
    sources: [
      {
        label: "LBSNAA - Wayanad Landslide Case Study, Jul-Aug 2024",
        url: "https://www.lbsnaa.gov.in/storage/uploads/pdf_data/1764761196_Landslide%20Case%20Study.pdf",
      },
      {
        label: "Nature Scientific Reports - runout analysis of the Wayanad landslide",
        url: "https://www.nature.com/articles/s41598-024-79054-7",
      },
      {
        label: "2024 Wayanad landslides (event overview; missing-person count disputed)",
        url: "https://en.wikipedia.org/wiki/2024_Wayanad_landslides",
      },
    ],
  },
};

export const SCENARIO = KERALA; // default scenario meta (used by Landing)

/* ---------- helpers ---------- */

/** ₹ lakh → "₹8.5L" */
export const fmtL = (v: number) => `₹${v.toFixed(1)}L`;

/** ₹ lakh → full indian-format rupees "₹8,50,000" */
export const fmtFull = (v: number) =>
  `₹${Math.round(v * 100000).toLocaleString("en-IN")}`;

export const statusLabel: Record<VillageStatus, string> = {
  PENDING: "PENDING",
  ALLOCATED: "ALLOCATED",
  DISBURSED: "DISBURSED",
};

/* ---------- Kerala 2018 — Idukki district ---------- */
export const initialVillages: Village[] = [
  {
    id: "vellathooval", name: "Vellathooval", lat: 9.9843, lng: 77.0101,
    families: 5380, severity: "High", approved: 8.5, disbursed: 8.5,
    utilized: 6.8, status: "ALLOCATED", 
    population2011: 25701, coordsVerified: true,
  },
  {
    id: "adimali", name: "Adimali", lat: 10.0148, lng: 76.9561,
    families: 8490, severity: "Moderate", approved: 6.2, disbursed: 6.2,
    utilized: 4.9, status: "DISBURSED", 
    population2011: 40484, coordsVerified: true,
  },
  {
    id: "kattappana", name: "Kattappana", lat: 9.7542, lng: 77.1158,
    families: 7800, severity: "High", approved: 10.4, disbursed: 0,
    utilized: 0, status: "PENDING", 
    mismatch: { reported: 8.2, expected: 7.1 }, coordsVerified: true,
  },
  {
    id: "munnar", name: "Munnar", lat: 10.0892, lng: 77.0597,
    families: 6600, severity: "Moderate", approved: 7.6, disbursed: 7.6,
    utilized: 7.6, status: "DISBURSED",  coordsVerified: true,
  },
  {
    id: "cheruthoni", name: "Cheruthoni", lat: 9.8582, lng: 76.9618,
    families: 4900, severity: "High", approved: 9.1, disbursed: 0,
    utilized: 0, status: "PENDING", 
    coordsVerified: true,
  },
  {
    id: "nedumkandam", name: "Nedumkandam", lat: 9.843, lng: 77.1519,
    families: 6100, severity: "Low", approved: 8.2, disbursed: 0,
    utilized: 0, status: "ALLOCATED", 
    coordsVerified: true,
  },
];

/* ---------- Amphan 2020 — Purba Medinipur coast ---------- */
const AMPHAN_VILLAGES: Village[] = [
  { id: "contai", name: "Contai", lat: 21.7792, lng: 87.7446, families: 148, severity: "High", approved: 9.4, disbursed: 9.4, utilized: 7.1, status: "DISBURSED", coordsVerified: true },
  { id: "digha", name: "Digha", lat: 21.6384, lng: 87.5096, families: 132, severity: "High", approved: 8.8, disbursed: 0, utilized: 0, status: "PENDING", mismatch: { reported: 6.4, expected: 5.2 }, coordsVerified: true },
  { id: "majna", name: "Majna", lat: 21.7757, lng: 87.675, families: 908, severity: "Moderate", approved: 6.7, disbursed: 6.7, utilized: 5.1, status: "ALLOCATED", population2011: 4653, coordsVerified: true },
  { id: "shankarpur", name: "Shankarpur", lat: 21.625, lng: 87.52, families: 84, severity: "Moderate", approved: 5.9, disbursed: 5.9, utilized: 5.9, status: "DISBURSED", coordsVerified: false },
  { id: "ramnagar", name: "Ramnagar", lat: 21.78, lng: 87.61, families: 96, severity: "Moderate", approved: 6.4, disbursed: 6.4, utilized: 4.3, status: "ALLOCATED", coordsVerified: false },
  { id: "kulberia", name: "Kulberia", lat: 21.76, lng: 87.68, families: 71, severity: "Low", approved: 4.8, disbursed: 0, utilized: 0, status: "PENDING", coordsVerified: false },
];

/* ---------- Wayanad 2024 — Meppadi slope ---------- */
const WAYANAD_VILLAGES: Village[] = [
  { id: "punjirimattom", name: "Punjirimattom", lat: 11.4646, lng: 76.1348, families: 118, severity: "High", approved: 9.9, disbursed: 9.9, utilized: 8.7, status: "DISBURSED", coordsVerified: true },
  { id: "mundakkai", name: "Mundakkai", lat: 11.472, lng: 76.142, families: 137, severity: "High", approved: 8.1, disbursed: 0, utilized: 0, status: "PENDING", mismatch: { reported: 6.9, expected: 5.8 }, coordsVerified: false },
  { id: "chooralmala", name: "Chooralmala", lat: 11.4992, lng: 76.1601, families: 66, severity: "Moderate", approved: 5.2, disbursed: 5.2, utilized: 3.8, status: "ALLOCATED", coordsVerified: true },
  { id: "attamala", name: "Attamala", lat: 11.485, lng: 76.15, families: 89, severity: "Moderate", approved: 4.6, disbursed: 4.6, utilized: 4.6, status: "DISBURSED", coordsVerified: false },
  { id: "meppadi", name: "Meppadi", lat: 11.49, lng: 76.125, families: 54, severity: "Low", approved: 3.9, disbursed: 0, utilized: 0, status: "PENDING", coordsVerified: false },
  { id: "vellarimala", name: "Vellarimala", lat: 11.46, lng: 76.145, families: 47, severity: "Low", approved: 4.8, disbursed: 4.8, utilized: 3.6, status: "ALLOCATED", coordsVerified: false },
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