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
