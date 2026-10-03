"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { scenarios, type ScenarioMeta } from "@/lib/data";
import {
  FixMapSize,
  MapControls,
  MapTiles,
  type BasemapMode,
  type TileProvider,
} from "@/components/MapBasemap";
import { basemapMaxZoom, tileGradeClass } from "@/lib/mapTiles";

/** India-wide map: one marker per disaster event. */
export function EventMapInner({
  selected,
  onSelect,
  provider,
  onProviderChange,
}: {
  selected: ScenarioMeta;
  onSelect: (id: string) => void;
  provider: TileProvider;
  onProviderChange: (provider: TileProvider) => void;
}) {
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");

  return (
    <div className="relative h-[440px] w-full lg:h-[520px]">
      <MapContainer
        id="overview-event-map"
        center={[20.5, 80.5]}
        zoom={5}
        scrollWheelZoom
        maxZoom={basemapMaxZoom(basemap, provider)}
        className={`h-full w-full ${tileGradeClass(provider)}`}
        style={{ height: "100%", width: "100%", background: "var(--map-bg)" }}
      >
        <MapTiles mode={basemap} provider={provider} />
        <FixMapSize />
        <FlyTo lat={selected.lat} lng={selected.lng} zoom={selected.zoom} skipFirst />
        {scenarios.map((s) => {
          const isSel = s.meta.id === selected.id;
          return (
            <CircleMarker
              key={s.meta.id}
              center={[s.meta.lat, s.meta.lng]}
              radius={isSel ? 12 : 9}
              pathOptions={{
                color: "#f4efe6",
                fillColor: s.meta.color,
                fillOpacity: isSel ? 0.95 : 0.75,
                weight: isSel ? 2.5 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(s.meta.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <span className="font-mono text-[11px]">
                  {s.meta.name} — {s.meta.year} · {s.meta.type}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <MapControls
        mode={basemap}
        onChange={setBasemap}
        provider={provider}
        onProviderChange={onProviderChange}
      />
    </div>
  );
}

function FlyTo({
  lat,
  lng,
  zoom,
  skipFirst,
}: {
  lat: number;
  lng: number;
  zoom: number;
  skipFirst?: boolean;
}) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (skipFirst && first.current) {
      first.current = false;
      return;
    }
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [lat, lng, zoom, map, skipFirst]);
  return null;
}
