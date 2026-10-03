"use client";

import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import {
  basemapLayers,
  HAS_MAPTILER,
  type BasemapMode,
  type TileProvider,
} from "@/lib/mapTiles";

export type { BasemapMode, TileProvider };

/**
 * Street or satellite tiles. Satellite includes place labels. The layer stack
 * comes from lib/mapTiles so every map shares one provider decision.
 */
export function MapTiles({
  mode,
  provider,
}: {
  mode: BasemapMode;
  provider: TileProvider;
}) {
  return (
    <>
      {basemapLayers(mode, provider).map((tile, i) => (
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

/**
 * Tile-source switch: the MapTiler key (deep zoom, metered) against the keyless
 * Esri/OpenStreetMap stack.
 *
 * Rendered as an overlay on each map rather than only in the app header,
 * because the zoom ceiling it causes (z22 vs z18) is something you judge by
 * looking at the map — and the header control was invisible on the case index.
 */
export function ProviderToggle({
  provider,
  onChange,
}: {
  provider: TileProvider;
  onChange: (provider: TileProvider) => void;
}) {
  const options: { id: TileProvider; label: string; hint: string }[] = [
    {
      id: "maptiler",
      label: "KEY",
      hint: "MapTiler imagery to z22 · 100k requests/month free tier",
    },
    {
      id: "free",
      label: "FREE",
      hint: "Esri World Imagery + OpenStreetMap · no key · capped at z18",
    },
  ];

  return (
    <div
      className="absolute right-2 top-10 z-[1000] flex overflow-hidden rounded-panel border border-line/40 bg-panel/95 shadow-pop"
      role="group"
      aria-label="Tile provider"
    >
      {options.map((o) => {
        const disabled = o.id === "maptiler" && !HAS_MAPTILER;
        const active = provider === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            disabled={disabled}
            title={
              disabled
                ? "No MapTiler key configured — set NEXT_PUBLIC_MAPTILER_KEY"
                : o.hint
            }
            className={`press px-2 py-1 font-mono text-[10px] tracking-widest transition-colors ${
              active
                ? "bg-signal text-[rgb(var(--on-signal))]"
                : "text-muted hover:text-ink"
            } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Both map controls stacked in the top-right corner of a map. */
export function MapControls({
  mode,
  onChange,
  provider,
  onProviderChange,
}: {
  mode: BasemapMode;
  onChange: (mode: BasemapMode) => void;
  provider: TileProvider;
  onProviderChange: (provider: TileProvider) => void;
}) {
  return (
    <>
      <BasemapToggle mode={mode} onChange={onChange} />
      <ProviderToggle provider={provider} onChange={onProviderChange} />
    </>
  );
}
