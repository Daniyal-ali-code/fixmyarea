"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS = {
  reported: "#2563eb",
  under_review: "#d97706",
  in_progress: "#ea580c",
  resolved: "#475569",
};

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
            <strong>{report.title}</strong>
            {report.address && (
              <>
                <br />
                <span style={{ fontSize: 12 }}>📍 {report.address}</span>
              </>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
