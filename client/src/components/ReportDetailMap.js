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
      <div className="rounded-sm border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-8 text-center font-serif italic text-stone-600 dark:text-stone-400">
        Location unavailable for this report.
      </div>
    );
  }

  return (
    <div className="rounded-sm overflow-hidden border border-stone-300 dark:border-stone-700">
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
            <strong className="text-stone-900 dark:text-stone-50">{report.title}</strong>
            {report.address && (
              <>
                <br />
                <span className="text-xs italic text-stone-600 dark:text-stone-400">
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
