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
function satellite(): TileSpec[] {
  const layers = [esri(ESRI_SAT_URL), esri(ESRI_LABELS_URL)];
  if (HAS_MAPTILER) {
    // `hybrid` bakes place labels into the imagery, so the deep-zoom range
    // keeps the same labelled look the Esri pair gives above z18.
    layers.push(maptiler("hybrid", "jpg"));
  }
  return layers;
}

export function basemapLayers(mode: BasemapMode): TileSpec[] {
  if (mode === "satellite") return satellite();
  const layers = [osm()];
  if (HAS_MAPTILER) layers.push(maptiler("streets-v2", "png"));
  return layers;
}

/**
 * Deepest zoom the current provider can actually paint. Cap the map container
 * at this so panning/zooming never outruns the tiles and lands on flat
 * background, which reads as a broken map rather than a finished one.
 */
export function basemapMaxZoom(mode: BasemapMode): number {
  return basemapLayers(mode).reduce(
    (deepest, tile) => Math.max(deepest, tile.maxNativeZoom),
    0
  );
}

/** Which provider serves the zoom the map is actually sitting at. */
export function providerLabel(mode: BasemapMode, zoom?: number): string {
  const deep = zoom !== undefined && zoom > ESRI_MAX_ZOOM;
  if (mode === "satellite") {
    if (!HAS_MAPTILER) return "SATELLITE · ESRI WORLD IMAGERY";
    return deep ? "MAPTILER · SATELLITE" : "SATELLITE · ESRI WORLD IMAGERY";
  }
  if (!HAS_MAPTILER) return "MAP · OPENSTREETMAP";
  return deep ? "MAPTILER · STREETS" : "MAP · OPENSTREETMAP";
}