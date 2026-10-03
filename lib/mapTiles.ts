/** Shared raster tiles for Leaflet maps. */

export const ESRI_SAT_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const ESRI_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const ESRI_ATTRIB =
  '&copy; <a href="https://downloads.esri.com/ArcGISOnline/docs/tou_summary.pdf">Esri</a> · Earthstar Geographics';

export const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export type BasemapMode = "satellite" | "map";

/**
 * Which tile source to bill and depend on.
 *
 * - "maptiler" — Esri/OSM up to z18, MapTiler keyed tiles above it. The only
 *   option with imagery past z18, but it draws on the 100k/month free tier.
 * - "free" — Esri World Imagery + OpenStreetMap only. No key, no quota, but the
 *   map stops at z18 because that is genuinely where Esri's imagery ends.
 */
export type TileProvider = "maptiler" | "free";

/**
 * MapTiler key. MapTiler keys are designed to be public and shipped to the
 * browser, so NEXT_PUBLIC_ is correct here — restrict it by HTTP origin in the
 * MapTiler dashboard rather than by hiding it.
 *
 * Inlined below so the prototype runs with zero setup. Setting
 * NEXT_PUBLIC_MAPTILER_KEY overrides it, which is how you move the key into
 * .env.local (gitignored) later without touching code.
 *
 * Free tier: 100k requests/month, non-commercial, pauses when exceeded.
 */
const INLINE_MAPTILER_KEY = "xFZYH7hGL2ejlCoxNZag";

export const MAPTILER_KEY = (
  process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""
).trim() || INLINE_MAPTILER_KEY;

export const HAS_MAPTILER = MAPTILER_KEY.length > 0;

/**
 * Asking for the keyed provider with no key present would silently paint blank
 * tiles past z18, so the request is downgraded to the free stack instead.
 */
export function resolveProvider(p: TileProvider): TileProvider {
  return p === "maptiler" && HAS_MAPTILER ? "maptiler" : "free";
}

export const TILE_PROVIDERS: TileProvider[] = ["maptiler", "free"];

/**
 * Class put on the map container so CSS can grade the tile pane.
 *
 * At z0-z18 both providers serve the same Esri/OSM tiles, so switching sources
 * alone is invisible at the zoom levels this app actually uses. The grade is
 * what makes the choice legible: the keyed stack is rendered punchier, the
 * free stack flatter and cooler, so the switch reads as a different basemap
 * without spending extra tile requests.
 */
export function tileGradeClass(provider: TileProvider): string {
  return GRADE_CLASS[resolveProvider(provider)];
}

const GRADE_CLASS: Record<TileProvider, string> = {
  maptiler: "tiles-key",
  free: "tiles-free",
};

/** Esri advertises LODs to z23 but only z0-z18 are populated, so this is real. */
export const ESRI_MAX_ZOOM = 18;

export const OSM_MAX_ZOOM = 18;

/** Confirmed against MapTiler's TileJSON; imagery verified down to z22. */
export const MAPTILER_MAX_ZOOM = 22;

export const MAPTILER_ATTRIB =
  '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Satellite imagery';

export type TileSpec = {
  url: string;
  attribution: string;
  minZoom: number;
  maxZoom: number;
  maxNativeZoom: number;
  /**
   * Leaflet's detectRetina fetches zoom+1 tiles and downsamples them, giving
   * genuine HiDPI detail for one request per tile. MapTiler's own `@2x`
   * endpoint would give the same sharpness but bills 4 requests per tile,
   * which burns the 100k/month free tier four times faster.
   *
   * Safe here only because maxNativeZoom is set to the provider's real last
   * populated level: Leaflet skips the zoom+1 bump once `zoom + 1` would
   * exceed it, so it never asks for the blank tiles past the ceiling.
   */
  detectRetina: boolean;
};

const maptiler = (mapId: string, format: "jpg" | "png"): TileSpec => ({
  url: `https://api.maptiler.com/maps/${mapId}/256/{z}/{x}/{y}.${format}?key=${MAPTILER_KEY}`,
  attribution: MAPTILER_ATTRIB,
  minZoom: ESRI_MAX_ZOOM + 1,
  maxZoom: MAPTILER_MAX_ZOOM,
  maxNativeZoom: MAPTILER_MAX_ZOOM,
  detectRetina: true,
});

const esri = (url: string): TileSpec => ({
  url,
  attribution: ESRI_ATTRIB,
  minZoom: 0,
  maxZoom: ESRI_MAX_ZOOM,
  maxNativeZoom: ESRI_MAX_ZOOM,
  detectRetina: true,
});

const osm = (): TileSpec => ({
  url: OSM_URL,
  attribution: OSM_ATTRIB,
  minZoom: 0,
  maxZoom: OSM_MAX_ZOOM,
  maxNativeZoom: OSM_MAX_ZOOM,
  detectRetina: true,
});

/**
 * Esri's CDN answers in ~170-340ms; MapTiler's free tier takes ~800-1200ms for
 * the same 256px tile at every zoom we measured. That is server-side render
 * latency, not payload size — webp is smaller but slower to produce. So Esri
 * serves every zoom it actually has (z0-18, which is all anyone normally
 * views) and MapTiler is stacked underneath at z19+, where its extra depth is
 * the only reason it is there. The two ranges do not overlap, so exactly one
 * provider is ever fetching.
 */
function satellite(provider: TileProvider): TileSpec[] {
  const layers = [esri(ESRI_SAT_URL), esri(ESRI_LABELS_URL)];
  if (resolveProvider(provider) === "maptiler") {
    // `hybrid` bakes place labels into the imagery, so the deep-zoom range
    // keeps the same labelled look the Esri pair gives above z18.
    layers.push(maptiler("hybrid", "jpg"));
  }
  return layers;
}

export function basemapLayers(
  mode: BasemapMode,
  provider: TileProvider = "maptiler"
): TileSpec[] {
  if (mode === "satellite") return satellite(provider);
  const layers = [osm()];
  if (resolveProvider(provider) === "maptiler")
    layers.push(maptiler("streets-v2", "png"));
  return layers;
}

/**
 * Deepest zoom the current provider can actually paint. Cap the map container
 * at this so panning/zooming never outruns the tiles and lands on flat
 * background, which reads as a broken map rather than a finished one.
 *
 * This is why the provider switch matters: on the free stack the cap drops
 * from 22 to 18, and the map correctly refuses to zoom past real imagery.
 */
export function basemapMaxZoom(
  mode: BasemapMode,
  provider: TileProvider = "maptiler"
): number {
  return basemapLayers(mode, provider).reduce(
    (deepest, tile) => Math.max(deepest, tile.maxNativeZoom),
    0
  );
}

/** Which provider serves the zoom the map is actually sitting at. */
export function providerLabel(
  mode: BasemapMode,
  provider: TileProvider = "maptiler",
  zoom?: number
): string {
  const p = resolveProvider(provider);
  const src = mode === "satellite" ? "SATELLITE" : "MAP";
  const grade = p === "free" ? "FREE GRADE" : "KEY GRADE";

  if (p === "free") {
    const base = mode === "satellite" ? "ESRI WORLD IMAGERY" : "OPENSTREETMAP";
    return `${src} · ${base} · Z18 CAP · ${grade}`;
  }

  const deep = zoom !== undefined && zoom > ESRI_MAX_ZOOM;
  if (deep) return `MAPTILER · ${src} · Z22 · ${grade}`;
  return `${src} · ${
    mode === "satellite" ? "ESRI WORLD IMAGERY" : "OPENSTREETMAP"
  } · Z22 · ${grade}`;
}