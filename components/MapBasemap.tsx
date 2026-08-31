"use client";

import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import {
  ESRI_ATTRIB,
  ESRI_LABELS_URL,
  ESRI_SAT_URL,
  OSM_ATTRIB,
  OSM_URL,
  type BasemapMode,
} from "@/lib/mapTiles";

export type { BasemapMode };

/** Street or satellite tiles. Satellite includes place-name overlay. */
export function MapTiles({ mode }: { mode: BasemapMode }) {
  if (mode === "satellite") {
    return (
      <>
        <TileLayer
          key="esri-sat"
          url={ESRI_SAT_URL}
          attribution={ESRI_ATTRIB}
          maxZoom={18}
        />
        <TileLayer
          key="esri-labels"
          url={ESRI_LABELS_URL}
          attribution={ESRI_ATTRIB}
          maxZoom={18}
        />
      </>
    );
  }

  return (
    <TileLayer
      key="osm"
      url={OSM_URL}
      attribution={OSM_ATTRIB}
      maxZoom={19}
    />
  );
}

export function FixMapSize() {
  const map = useMap();
  useEffect(() => {
    const sync = () => map.invalidateSize();
    sync();
    const t = window.setTimeout(sync, 150);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

export function BasemapToggle({
  mode,
  onChange,
}: {
  mode: BasemapMode;
  onChange: (mode: BasemapMode) => void;
}) {
  return (
    <div
      className="absolute right-2 top-2 z-[1000] flex overflow-hidden rounded-panel border border-line/40 bg-panel/95 shadow-pop"
      role="group"
      aria-label="Map type"
    >
      <button
        type="button"
        onClick={() => onChange("map")}
        aria-pressed={mode === "map"}
        className={`press px-2 py-1 font-mono text-[10px] tracking-widest transition-colors ${
          mode === "map" ? "bg-panel-raised text-ink" : "text-muted hover:text-ink"
        }`}
      >
        MAP
      </button>
      <button
        type="button"
        onClick={() => onChange("satellite")}
        aria-pressed={mode === "satellite"}
        className={`press px-2 py-1 font-mono text-[10px] tracking-widest transition-colors ${
          mode === "satellite"
            ? "bg-signal text-[rgb(var(--on-signal))]"
            : "text-muted hover:text-ink"
        }`}
      >
        SAT
      </button>
    </div>
  );
}
