"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { STATUS_COLORS } from "@/lib/status";

function makeIcon(color) {
  return L.divIcon({
    className: "fixmyarea-detail-marker",
    html: `<div style="
      background:${color};
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

export default function ReportDetailMap({ report }) {
  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  const color = STATUS_COLORS[report.status] || STATUS_COLORS.reported;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-slate-600 dark:text-slate-400">
        Location unavailable for this report.
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: "320px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={makeIcon(color)}>
          <Popup>
            <strong className="text-slate-900 dark:text-slate-50">{report.title}</strong>
            {report.address && (
              <>
                <br />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {report.address}
                </span>
              </>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
