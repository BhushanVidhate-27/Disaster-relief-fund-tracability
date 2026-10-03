"use client";

import { useMemo, useState } from "react";
import { MapContainer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { statusLabel, type Village } from "@/lib/data";
import { basemapMaxZoom, providerLabel, tileGradeClass } from "@/lib/mapTiles";
import {
  FixMapSize,
  MapControls,
  MapTiles,
  type BasemapMode,
  type TileProvider,
} from "@/components/MapBasemap";

const statusColor: Record<string, string> = {
  PENDING: "#c04a3e",
  ALLOCATED: "#f0b25c",
  DISBURSED: "#d69a42",
};

/** District map with one marker per village. Click to select. */
export function VillageMap({
  villages,
  selectedId,
  onSelect,
  provider,
  onProviderChange,
}: {
  villages: Village[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  provider: TileProvider;
  onProviderChange: (provider: TileProvider) => void;
}) {
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
  const center = useMemo((): [number, number] => {
    if (!villages.length) return [10, 77.08];
    return [
      villages.reduce((s, v) => s + v.lat, 0) / villages.length,
      villages.reduce((s, v) => s + v.lng, 0) / villages.length,
    ];
  }, [villages]);

  return (
    <div className="darkmap relative h-[560px] w-full overflow-hidden rounded-panel border border-line/25 lg:h-[640px]">
      <MapContainer
        id="relief-village-map"
        key={`${center[0].toFixed(3)}-${center[1].toFixed(3)}`}
        center={center}
        zoom={10}
        scrollWheelZoom={false}
        maxZoom={basemapMaxZoom(basemap, provider)}
        className={tileGradeClass(provider)}
        style={{ height: "100%", width: "100%", background: "var(--map-bg)" }}
      >
        <MapTiles mode={basemap} provider={provider} />
        <FixMapSize />
        {villages.map((v) => {
          const active = v.id === selectedId;
          return (
            <CircleMarker
              key={v.id}
              center={[v.lat, v.lng]}
              radius={active ? 11 : 8}
              pathOptions={{
                color: "#f4efe6",
                fillColor: statusColor[v.status],
                fillOpacity: active ? 0.95 : 0.75,
                weight: active ? 2.5 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(v.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <b>{v.name}</b> · {v.families} families ·{" "}
                {statusLabel[v.status]}
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
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-line/25 bg-ground-deep/90 px-3 py-1.5 font-mono text-[10px] text-faint">
        <span>
          {providerLabel(basemap, provider)}
        </span>
        <span>Click a village</span>
      </div>
    </div>
  );
}
