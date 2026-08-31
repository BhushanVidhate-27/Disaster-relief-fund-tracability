"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Rectangle,
  Polygon as LeafletPolygon,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { ScenarioMeta } from "@/lib/data";
import {
  getDamageZones,
  type DamageZone,
} from "@/lib/damageAnalysis";
import { BasemapToggle, MapTiles, type BasemapMode } from "@/components/MapBasemap";

export interface SatelliteMapProps {
  scenario: ScenarioMeta;
  variant: "pre" | "post";
  showDamageZones?: boolean;
  onBoundsReady?: (bounds: L.LatLngBounds) => void;
  damageZones?: DamageZone[];
}

function BoundsReporter({
  onBoundsReady,
}: {
  onBoundsReady?: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMap();
  const cb = useRef(onBoundsReady);
  cb.current = onBoundsReady;

  useEffect(() => {
    const sync = () => {
      map.invalidateSize();
      cb.current?.(map.getBounds());
    };
    sync();
    const t = window.setTimeout(sync, 150);
    return () => window.clearTimeout(t);
  }, [map]);

  useMapEvents({
    moveend: () => {
      cb.current?.(map.getBounds());
    },
  });

  return null;
}

export function SatelliteMap({
  scenario,
  variant,
  showDamageZones = variant === "post",
  onBoundsReady,
  damageZones: externalZones,
}: SatelliteMapProps) {
  const zones = useMemo(
    () => externalZones ?? getDamageZones(scenario),
    [externalZones, scenario],
  );
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");

  return (
    <>
    <MapContainer
      id={`sat-map-${scenario.id}-${variant}`}
      key={`${scenario.id}-${variant}`}
      center={[scenario.lat, scenario.lng]}
      zoom={scenario.zoom}
      scrollWheelZoom={false}
      minZoom={scenario.type === "Cyclone" ? 9 : 10}
      className={`h-full min-h-0 w-full ${
        variant === "pre" && basemap === "satellite" ? "sat-pre" : "sat-post"
      }`}
      style={{ background: "var(--map-bg)", height: "100%", width: "100%" }}
    >
      <MapTiles mode={basemap} />
      <BoundsReporter onBoundsReady={onBoundsReady} />

      {showDamageZones &&
        zones.map((zone) => (
          <LeafletPolygon
            key={zone.name}
            pathOptions={{
              color: lighten(zone.color, 0.3),
              weight: 2,
              fillColor: zone.color,
              fillOpacity: 0.35,
              dashArray: "4 2",
            }}
            positions={zone.coordinates}
          >
            <Tooltip direction="center" opacity={1} className="font-mono">
              <span className="px-1 text-[10px] uppercase tracking-widest">
                {zone.type} · {zone.confidence}% · {zone.areaHa} ha
              </span>
            </Tooltip>
          </LeafletPolygon>
        ))}

      {showDamageZones && <DamageFootprint zones={zones} />}
    </MapContainer>
    <BasemapToggle mode={basemap} onChange={setBasemap} />
    </>
  );
}

function lighten(hex: string, amt: number): string {
  const r = clamp(parseInt(hex.slice(1, 3), 16) * (1 + amt));
  const g = clamp(parseInt(hex.slice(3, 5), 16) * (1 + amt));
  const b = clamp(parseInt(hex.slice(5, 7), 16) * (1 + amt));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function DamageFootprint({ zones }: { zones: DamageZone[] }) {
  if (!zones.length) return null;
  const lats = zones.flatMap((z) => z.coordinates.map((c) => c[0]));
  const lngs = zones.flatMap((z) => z.coordinates.map((c) => c[1]));

  return (
    <Rectangle
      bounds={[
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ]}
      pathOptions={{
        color: "rgb(var(--signal))",
        weight: 1,
        fillOpacity: 0,
        dashArray: "3 4",
      }}
    />
  );
}
