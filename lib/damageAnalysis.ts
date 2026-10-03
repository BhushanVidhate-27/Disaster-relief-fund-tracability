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

/**
 * Result of assessing a user-marked polygon: how much of the area they drew
 * actually intersects detected damage.
 */
export interface MarkedAreaAssessment extends DamageComputation {
  /** Area of the drawn polygon, in hectares. */
  polygonAreaHa: number;
  /** Perimeter of the drawn polygon, in km. */
  perimeterKm: number;
  /** Grid points that landed inside the polygon (the assessment denominator). */
  pointsInside: number;
  /** Of those, how many also fell inside a detected damage zone. */
  damagedInside: number;
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

/** Mean Earth radius, metres. */
const EARTH_R = 6371008.8;
const RAD = Math.PI / 180;

/**
 * Geodesic area of a closed ring, in hectares.
 *
 * Spherical-excess form rather than a flat-degree shoelace: at the scale of a
 * few kilometres a degree of longitude is ~1% shorter than a degree of latitude,
 * so treating the ring as planar misreports area by a latitude-dependent factor
 * (off by ~8% at Kerala's 10°N, ~35% at Amphan's 22°N). Hectares, because that
 * is what the recorded `damagedHa` figures on the Overview use.
 */
export function polygonAreaHa(ring: [number, number][]): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % ring.length];
    sum +=
      (lng2 - lng1) * RAD * (2 + Math.sin(lat1 * RAD) + Math.sin(lat2 * RAD));
  }
  return Math.abs((sum * EARTH_R * EARTH_R) / 2) / 10_000;
}

/** Haversine perimeter of a ring, in km. */
export function polygonPerimeterKm(ring: [number, number][]): number {
  if (ring.length < 2) return 0;
  let metres = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % ring.length];
    const dLat = (lat2 - lat1) * RAD;
    const dLng = (lng2 - lng1) * RAD;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
    metres += 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  return metres / 1000;
}

export interface RingBounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export function ringBounds(ring: [number, number][]): RingBounds | null {
  if (!ring.length) return null;
  let south = Infinity;
  let north = -Infinity;
  let west = Infinity;
  let east = -Infinity;
  for (const [lat, lng] of ring) {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }
  return { south, north, west, east };
}

/**
 * Assess a user-marked ring against the detected damage zones.
 *
 * A grid is laid over the ring's bounding box, then filtered twice: points
 * outside the drawn polygon are discarded so the denominator is the area the
 * user actually marked, and only the survivors are tested against the damage
 * zones. That makes `damagePercentage` answer "how much of the area I drew
 * shows damage", which is the question a marked area is for — unlike
 * computeDamageFromGrid, whose denominator is the whole viewport.
 */
export function assessMarkedArea(
  ring: [number, number][],
  zones: DamageZone[],
  gridSize: number = 90,
): MarkedAreaAssessment {
  const box = ringBounds(ring);
  const empty = {
    polygonAreaHa: polygonAreaHa(ring),
    perimeterKm: polygonPerimeterKm(ring),
    pointsInside: 0,
    damagedInside: 0,
  };

  if (!box || ring.length < 3) {
    return {
      damagePercentage: 0,
      totalSamplePoints: 0,
      damagedPoints: 0,
      damageByType: EMPTY_BY_TYPE(),
      ...empty,
    };
  }

  let sampled = 0;
  let pointsInside = 0;
  let damagedInside = 0;
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
    const lat = box.south + ((box.north - box.south) * i) / denom;
    for (let j = 0; j < gridSize; j++) {
      const lng = box.west + ((box.east - box.west) * j) / denom;
      sampled++;
      if (!isPointInPolygon(lat, lng, ring)) continue;

      pointsInside++;
      for (const zone of zones) {
        if (isPointInPolygon(lat, lng, zone.coordinates)) {
          damagedInside++;
          damageByType[zone.type].points += 1;
          typeConfs[zone.type].push(zone.confidence);
          break;
        }
      }
    }
  }

  (Object.keys(damageByType) as DamageZoneType[]).forEach((t) => {
    const hits = zones.filter((z) => z.type === t);
    damageByType[t].areaHa =
      damageByType[t].points > 0
        ? hits.reduce((s, z) => s + z.areaHa, 0)
        : 0;
    damageByType[t].confidence =
      typeConfs[t].length > 0
        ? Math.round(
            typeConfs[t].reduce((a, b) => a + b, 0) / typeConfs[t].length,
          )
        : 0;
  });

  return {
    damagePercentage:
      pointsInside > 0
        ? Math.round((damagedInside / pointsInside) * 100 * 100) / 100
        : 0,
    totalSamplePoints: pointsInside,
    damagedPoints: damagedInside,
    damageByType,
    polygonAreaHa: empty.polygonAreaHa,
    perimeterKm: empty.perimeterKm,
    pointsInside,
    damagedInside,
  };
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
