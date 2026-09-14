import { useEffect, useRef } from "react";
import L from "leaflet";
import { RiFocus3Line } from "react-icons/ri";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { zoneOptions } from "../../../shared/catalog.js";

function createZoneMarkerIcon(active) {
  return L.divIcon({
    className: "route-marker-icon",
    html: `<div class="route-marker ${active ? "route-marker--active-orange" : ""}"><span></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  });
}
function ZoneMarker({ zone, active, onSelect }) {
  const markerRef = useRef(null);
  useEffect(() => {
    if (active && markerRef.current)
      setTimeout(() => markerRef.current.openPopup(), 100);
  }, [active]);
  return (
    <Marker
      position={zone.center}
      icon={createZoneMarkerIcon(active)}
      eventHandlers={{ click: () => onSelect(zone.id) }}
      ref={markerRef}
    >
      <Popup>
        <div className="max-w-[220px]">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {zone.shortLabel}
          </p>
          <h4 className="mt-1 text-sm font-semibold text-zinc-900">
            {zone.label}
          </h4>
          <p className="mt-2 text-sm text-zinc-700">{zone.summary}</p>
        </div>
      </Popup>
    </Marker>
  );
}
export function ZoneMapPreview({ selectedZone, onSelectZone }) {
  const mapCenter = selectedZone?.center ?? zoneOptions[0].center;
  const orderedZones = [
    ...zoneOptions.filter((zone) => zone.id === "bilbao-metro"),
    ...zoneOptions.filter((zone) => zone.id !== "bilbao-metro" && zone.id !== "euskadi-general"),
    ...zoneOptions.filter((zone) => zone.id === "euskadi-general"),
  ];
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 shadow-[0_24px_100px_rgba(9,9,11,0.5)] backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-400/80">
            Mapa de zonas
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Selecciona la zona en el mapa o en la lista
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
          <RiFocus3Line className="h-3.5 w-3.5 text-orange-400" />
          {selectedZone?.label}
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="map-shell map-preview-map h-[34rem] min-h-[28rem] lg:h-[40rem] lg:rounded-[1.6rem]">
          <MapContainer
            center={mapCenter}
            zoom={8}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {zoneOptions.map((zone) => (
              <ZoneMarker
                key={zone.id}
                zone={zone}
                active={selectedZone?.id === zone.id}
                onSelect={onSelectZone}
              />
            ))}
          </MapContainer>
        </div>
        <aside className="map-preview-sidebar border-t border-white/10 bg-zinc-950/92 p-4 backdrop-blur-xl lg:sticky lg:top-4 lg:self-start lg:border-l lg:border-t-0 lg:border-white/10 lg:bg-transparent">
          <div className="grid max-h-[26rem] gap-3 overflow-y-auto lg:max-h-[38rem] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {orderedZones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone.id)}
                className={[
                  "rounded-2xl border p-4 text-left transition-all duration-200",
                  selectedZone?.id === zone.id
                    ? "border-orange-500/50 bg-orange-500/10 shadow-[0_0_28px_rgba(249,115,22,0.12)]"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">
                      {zone.shortLabel}
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-white">
                      {zone.label}
                    </h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                    {zone.province}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {zone.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {zone.cities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
