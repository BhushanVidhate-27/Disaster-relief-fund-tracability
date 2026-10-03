"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Polygon as LeafletPolygon,
  Polyline,
  CircleMarker,
  Rectangle,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { ScenarioMeta } from "@/lib/data";
import { ringBounds, type DamageZone } from "@/lib/damageAnalysis";
import {
  MapControls,
  MapTiles,
  type BasemapMode,
  type TileProvider,
} from "@/components/MapBasemap";
import { basemapMaxZoom, tileGradeClass } from "@/lib/mapTiles";

export interface ZoneMapProps {
  scenario: ScenarioMeta;
  /** Detected zones drawn as filled polygons and used to frame the view. */
  zones?: DamageZone[];
  /** Vertices placed by the user so far. */
  points?: [number, number][];
  /** Omit to make the map read-only. */
  onAddPoint?: (point: [number, number]) => void;
  /** How many points close the shape. */
  maxPoints?: number;
  /** Reports the visible extent, so the caller can grid-sample it. */
  onBoundsReady?: (bounds: L.LatLngBounds) => void;
  provider: TileProvider;
  onProviderChange: (provider: TileProvider) => void;
}

/**
 * Publishes the current viewport. FitView moves the camera, so the extent is
 * only known after the initial fit settles — hence the timeout resync.
 */
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
    const t = window.setTimeout(sync, 180);
    return () => window.clearTimeout(t);
  }, [map]);

  useMapEvents({
    moveend: () => cb.current?.(map.getBounds()),
  });

  return null;
}

/**
 * Read the `latlng` of a map click, ignoring presses that landed on a marker.
 *
 * Without the guard, clicking one of the numbered vertices to correct it would
 * first add a point and then place another one, so the shape silently drifted
 * as you tried to fix it. Leaflet tags every interactive path and marker icon
 * with `leaflet-interactive`, which is what we match on.
 */
function ClickCapture({
  onAddPoint,
  enabled,
}: {
  onAddPoint?: (point: [number, number]) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!enabled || !onAddPoint) return;
      const el = e.originalEvent.target as HTMLElement | null;
      if (el?.closest?.(".leaflet-interactive")) return;
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Frames the view on a set of coordinates. Re-fit when the key changes so a
 * completed polygon stays visible, but never on ordinary re-renders.
 */
function FitView({
  coords,
  fitKey,
  padding = 48,
}: {
  coords: [number, number][];
  fitKey: string;
  padding?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!coords.length) return;
    if (coords.length === 1) {
      map.setView(coords[0], Math.max(map.getZoom(), 13));
      return;
    }
    const box = ringBounds(coords);
    if (!box) return;
    map.fitBounds(
      [
        [box.south, box.west],
        [box.north, box.east],
      ],
      { padding: [padding, padding] }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);

  return null;
}

export function ZoneMap({
  scenario,
  zones,
  points,
  onAddPoint,
  maxPoints = 4,
  onBoundsReady,
  provider,
  onProviderChange,
}: ZoneMapProps) {
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
  const marking = Boolean(onAddPoint);

  const zoneCoords = useMemo(
    () => (zones ?? []).flatMap((z) => z.coordinates),
    [zones]
  );
  const marked = points ?? [];

  // Prefer the user's shape once it exists, otherwise frame the detected zones.
  const frameCoords = marked.length >= 2 ? marked : zoneCoords;
  const frameKey = frameCoords
    .map(([lat, lng]) => `${lat.toFixed(4)},${lng.toFixed(4)}`)
    .join("|");

  const closed = marked.length >= maxPoints;
  const ring = closed ? marked : null;

  return (
    <>
      <MapContainer
        id={`zone-map-${scenario.id}-${marking ? "mark" : "zones"}`}
        center={[scenario.lat, scenario.lng]}
        zoom={scenario.zoom}
        scrollWheelZoom={false}
        minZoom={scenario.type === "Cyclone" ? 9 : 10}
        maxZoom={basemapMaxZoom(basemap, provider)}
        className={`h-full min-h-0 w-full ${tileGradeClass(provider)}`}
        style={{ background: "var(--map-bg)", height: "100%", width: "100%" }}
      >
        <MapTiles mode={basemap} provider={provider} />
        <BoundsReporter onBoundsReady={onBoundsReady} />
        <ClickCapture onAddPoint={onAddPoint} enabled={marking && !closed} />

        {zones?.map((zone) => (
          <LeafletPolygon
            key={zone.name}
            pathOptions={{
              color: zone.color,
              weight: 2,
              fillColor: zone.color,
              fillOpacity: 0.22,
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

        {/* Two points are still a line; three or more close into an area. */}
        {marked.length === 2 && (
          <Polyline
            positions={marked}
            pathOptions={{
              color: "rgb(var(--signal))",
              weight: 2,
              dashArray: "4 3",
            }}
          />
        )}

        {ring && (
          <LeafletPolygon
            positions={ring}
            pathOptions={{
              color: "rgb(var(--signal))",
              weight: 2,
              fillColor: "rgb(var(--signal))",
              fillOpacity: 0.14,
            }}
          />
        )}

        {marked.map((point, i) => (
          <CircleMarker
            key={`${point[0]}-${point[1]}-${i}`}
            center={point}
            radius={12}
            pathOptions={{
              color: "#f4efe6",
              fillColor: "rgb(var(--signal))",
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="center" opacity={1} className="font-mono">
              <span className="px-1 text-[10px] font-semibold text-[rgb(var(--on-signal))]">
                {i + 1}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Dashed corner guides hint that four points are wanted. */}
        {marking && !closed && marked.length < maxPoints - 1 && (
          <PointHints scenario={scenario} />
        )}

        <FitView coords={frameCoords} fitKey={frameKey} />
      </MapContainer>

      <MapControls
        mode={basemap}
        onChange={setBasemap}
        provider={provider}
        onProviderChange={onProviderChange}
      />
    </>
  );
}

/** Dashed reference box showing the rough extent the marked area should cover. */
function PointHints({ scenario }: { scenario: ScenarioMeta }) {
  const d = 0.02;
  return (
    <Rectangle
      bounds={[
        [scenario.lat - d, scenario.lng - d],
        [scenario.lat + d, scenario.lng + d],
      ]}
      pathOptions={{
        color: "rgb(var(--signal))",
        weight: 1,
        fillOpacity: 0,
        dashArray: "2 6",
        opacity: 0.4,
      }}
    />
  );
}