import type { ScenarioMeta } from "@/lib/data";

/**
 * Client-safe damage analysis: polygons a change-detection model would
 * emit, plus grid sampling against a viewport. No Leaflet / DOM imports.
 */

export type DamageZoneType =
  | "flood"
  | "vegetation"
  | "structural"
  | "erosion"
  | "debris";

export interface DamageZone {
  name: string;
  type: DamageZoneType;
  /** GeoJSON-style [lat, lng] rings */
  coordinates: [number, number][];
  areaHa: number;
  confidence: number;
  description: string;
  color: string;
}

export interface LatLngBoundsLike {
  getSouth(): number;
  getNorth(): number;
  getWest(): number;
  getEast(): number;
}

export interface DamageComputation {
  damagePercentage: number;
  totalSamplePoints: number;
  damagedPoints: number;
  damageByType: Record<
    DamageZoneType,
    { points: number; areaHa: number; confidence: number }
  >;
}

const ZONE_COLORS: Record<DamageZoneType, string> = {
  flood: "#4a90d9",
  vegetation: "#8b5a2b",
  structural: "#e67e22",
  erosion: "#7f8c8d",
  debris: "#555555",
};

const EMPTY_BY_TYPE = (): DamageComputation["damageByType"] => ({
  flood: { points: 0, areaHa: 0, confidence: 0 },
  vegetation: { points: 0, areaHa: 0, confidence: 0 },
  structural: { points: 0, areaHa: 0, confidence: 0 },
  erosion: { points: 0, areaHa: 0, confidence: 0 },
  debris: { points: 0, areaHa: 0, confidence: 0 },
});

/** AI-detected damage polygons, offset from the scenario centre. */
export function getDamageZones(scenario: ScenarioMeta): DamageZone[] {
  const { lat, lng, type } = scenario;
  const d = 0.03;

  if (type === "Flood") {
    return [
      {
        name: "North Bank Inundation",
        type: "flood",
        coordinates: [
          [lat - d, lng - d * 1.5],
          [lat + d, lng - d],
          [lat + d * 0.5, lng + d],
          [lat - d * 0.5, lng + d * 1.2],
          [lat - d, lng - d * 1.5],
        ],
        areaHa: 18.2,
        confidence: 94,
        description:
          "Riverbank breach — standing water across the north bank.",
        color: ZONE_COLORS.flood,
      },
      {
        name: "Tea Plantation Submersion",
        type: "vegetation",
        coordinates: [
          [lat + d * 0.5, lng - d],
          [lat + d * 1.2, lng - d * 0.5],
          [lat + d, lng + d * 0.3],
          [lat + d * 0.3, lng + d],
          [lat + d * 0.5, lng - d],
        ],
        areaHa: 12.4,
        confidence: 89,
        description:
          "Vegetation loss across the plantation slope.",
        color: ZONE_COLORS.vegetation,
      },
      {
        name: "Access Road Isolation",
        type: "structural",
        coordinates: [
          [lat - d * 0.5, lng],
          [lat - d * 0.2, lng + d * 0.8],
          [lat, lng + d * 1.2],
          [lat - d * 0.3, lng + d * 0.5],
          [lat - d * 0.5, lng],
        ],
        areaHa: 8.5,
        confidence: 87,
        description:
          "Access road cut, isolating the settlements behind it.",
        color: ZONE_COLORS.structural,
      },
    ];
  }

  if (type === "Cyclone") {
    return [
      {
        name: "Coastal Strip Damage",
        type: "erosion",
        coordinates: [
          [lat - d * 0.5, lng - d * 1.5],
          [lat + d * 0.5, lng - d * 1.5],
          [lat + d, lng - d],
          [lat - d, lng - d],
          [lat - d * 0.5, lng - d * 1.5],
        ],
        areaHa: 16.8,
        confidence: 92,
        description:
          "Coastal strip — shoreline retreat and overtopping.",
        color: ZONE_COLORS.erosion,
      },
      {
        name: "Wind Blowdown Zone",
        type: "vegetation",
        coordinates: [
          [lat - d, lng - d],
          [lat + d * 0.5, lng - d * 0.2],
          [lat + d, lng + d * 1.2],
          [lat, lng + d * 1.5],
          [lat - d, lng + d],
          [lat - d, lng - d],
        ],
        areaHa: 11.3,
        confidence: 88,
        description:
          "Wind blowdown — canopy stripped along the coast.",
        color: ZONE_COLORS.vegetation,
      },
      {
        name: "Structural Roof Damage",
        type: "structural",
        coordinates: [
          [lat - d * 0.3, lng + d],
          [lat + d * 0.4, lng + d * 1.2],
          [lat + d * 0.6, lng + d * 0.7],
          [lat + d * 0.2, lng + d * 0.3],
          [lat - d * 0.3, lng + d],
        ],
        areaHa: 7.4,
        confidence: 85,
        description:
          "Built-up damage — roofing sheets displaced.",
        color: ZONE_COLORS.structural,
      },
    ];
  }

  return [
    {
      name: "Slope Failure Scar",
      type: "structural",
      coordinates: [
        [lat - d * 1.2, lng - d],
        [lat - d * 0.3, lng - d * 0.3],
        [lat - d * 0.2, lng + d * 0.2],
        [lat - d * 1.3, lng + d],
        [lat - d * 1.2, lng - d],
      ],
      areaHa: 9.7,
      confidence: 96,
      description:
        "Landslide scar — exposed slope on the failed section.",
      color: ZONE_COLORS.structural,
    },
    {
      name: "Road Cut & Debris",
      type: "debris",
      coordinates: [
        [lat - d * 0.5, lng + d * 0.5],
        [lat - d * 0.1, lng + d * 1.3],
        [lat + d * 0.2, lng + d * 1.1],
        [lat + d * 0.1, lng + d * 0.6],
        [lat - d * 0.5, lng + d * 0.5],
      ],
      areaHa: 6.8,
      confidence: 91,
      description:
        "Debris fan — road blocked by slide material.",
      color: ZONE_COLORS.debris,
    },
    {
      name: "Vegetation Clearance",
      type: "vegetation",
      coordinates: [
        [lat + d * 0.2, lng - d * 1.2],
        [lat + d * 0.8, lng - d * 0.5],
        [lat + d, lng + d * 0.3],
        [lat + d * 0.3, lng + d * 0.5],
        [lat + d * 0.2, lng - d * 1.2],
      ],
      areaHa: 5.6,
      confidence: 90,
      description:
        "Vegetation loss on the lower slope.",
      color: ZONE_COLORS.vegetation,
    },
  ];
}

/** Ray casting. Point and ring are geographic [lat, lng]. */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const latI = polygon[i][0];
    const lngI = polygon[i][1];
    const latJ = polygon[j][0];
    const lngJ = polygon[j][1];
    const straddles = latI > lat !== latJ > lat;
    if (!straddles) continue;
    const intersectLng =
      ((lngJ - lngI) * (lat - latI)) / (latJ - latI + 1e-12) + lngI;
    if (lng < intersectLng) inside = !inside;
  }
  return inside;
}

/**
 * Sample the visible viewport on a regular grid and count points that fall
 * inside AI damage polygons — a stand-in for pixel-level change detection
 * on pre vs post imagery.
 */
export function computeDamageFromGrid(
  bounds: LatLngBoundsLike,
  zones: DamageZone[],
  gridSize: number = 60,
): DamageComputation {
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();

  let totalPoints = 0;
  let damagedPoints = 0;
  const damageByType = EMPTY_BY_TYPE();
  const typeConfs: Record<DamageZoneType, number[]> = {
    flood: [],
    vegetation: [],
    structural: [],
    erosion: [],
    debris: [],
  };

  const denom = Math.max(gridSize - 1, 1);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = south + ((north - south) * i) / denom;
      const lng = west + ((east - west) * j) / denom;
      totalPoints++;

      for (const zone of zones) {
        if (isPointInPolygon(lat, lng, zone.coordinates)) {
          damagedPoints++;
          damageByType[zone.type].points += 1;
          typeConfs[zone.type].push(zone.confidence);
          break;
        }
      }
    }
  }

  (Object.keys(damageByType) as DamageZoneType[]).forEach((t) => {
    const hitZones = zones.filter((z) => z.type === t);
    damageByType[t].areaHa =
      damageByType[t].points > 0
        ? hitZones.reduce((s, z) => s + z.areaHa, 0)
        : 0;
    damageByType[t].confidence =
      typeConfs[t].length > 0
        ? Math.round(
            typeConfs[t].reduce((a, b) => a + b, 0) / typeConfs[t].length,
          )
        : 0;
  });

  const pct = totalPoints > 0 ? (damagedPoints / totalPoints) * 100 : 0;

  return {
    damagePercentage: Math.round(pct * 100) / 100,
    totalSamplePoints: totalPoints,
    damagedPoints,
    damageByType,
  };
}
