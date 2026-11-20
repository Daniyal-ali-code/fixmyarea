"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";

function makeIcon(color) {
  return L.divIcon({
    className: "fixmyarea-marker",
    html: `<div style="
      background:${color};
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

function FitToMarkers({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (!reports || reports.length === 0) return;
    const bounds = L.latLngBounds(
      reports.map((r) => [Number(r.latitude), Number(r.longitude)])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [reports, map]);
  return null;
}

export default function ReportsMap({ reports = [] }) {
  const valid = reports.filter(
    (r) =>
      r.latitude != null &&
      r.longitude != null &&
      Number.isFinite(Number(r.latitude)) &&
      Number.isFinite(Number(r.longitude))
  );

  return (
    <div className="map-home rounded-sm overflow-hidden border border-stone-300 dark:border-stone-700">
      <MapContainer
        center={[24.8607, 67.0011]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {valid.length > 0 && <FitToMarkers reports={valid} />}
        {valid.map((r) => (
          <Marker
            key={r.id}
            position={[Number(r.latitude), Number(r.longitude)]}
            icon={makeIcon(STATUS_COLORS[r.status] || STATUS_COLORS.reported)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-bold text-sm text-stone-900 dark:text-stone-50 m-0 mb-1">
                  {r.title}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 m-0 mb-1">
                  {r.category_name} · {STATUS_LABELS[r.status] || r.status}
                </p>
                {r.address && (
                  <p className="text-[11px] italic text-stone-700 dark:text-stone-300 m-0 mb-2">
                    {r.address}
                  </p>
                )}
                <Link
                  href={`/reports/${r.id}`}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-500 no-underline"
                >
                  View report →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
