"use client";

import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { basemapLayers, type BasemapMode } from "@/lib/mapTiles";

export type { BasemapMode };

/**
 * Street or satellite tiles. Satellite includes place labels. The layer stack
 * comes from lib/mapTiles so every map shares one provider decision.
 */
export function MapTiles({ mode }: { mode: BasemapMode }) {
  return (
    <>
      {basemapLayers(mode).map((tile, i) => (
        <TileLayer
          key={`${tile.url.slice(0, 40)}-${i}`}
          url={tile.url}
          attribution={tile.attribution}
          minZoom={tile.minZoom}
          maxZoom={tile.maxZoom}
          maxNativeZoom={tile.maxNativeZoom}
          detectRetina={tile.detectRetina}
          keepBuffer={2}
          updateWhenIdle
        />
      ))}
    </>
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
