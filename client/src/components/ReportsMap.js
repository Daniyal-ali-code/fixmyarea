"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS = {
  reported: "#2563eb",
  under_review: "#d97706",
  in_progress: "#ea580c",
  resolved: "#475569",
};

const STATUS_LABELS = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

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
    (r) => r.latitude != null && r.longitude != null
  );

  return (
    <div className="rounded-sm overflow-hidden border border-stone-300 dark:border-stone-700">
      <MapContainer
        center={[24.8607, 67.0011]}
        zoom={12}
        style={{ height: "520px", width: "100%" }}
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
              <div style={{ minWidth: 200, fontFamily: "system-ui, sans-serif" }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    margin: "0 0 4px",
                    color: "#1c1917",
                  }}
                >
                  {r.title}
                </p>
                <p style={{ fontSize: 11, color: "#57534e", margin: "0 0 4px" }}>
                  {r.category_name} · {STATUS_LABELS[r.status] || r.status}
                </p>
                {r.address && (
                  <p
                    style={{
                      fontSize: 11,
                      fontStyle: "italic",
                      color: "#44403c",
                      margin: "0 0 8px",
                    }}
                  >
                    📍 {r.address}
                  </p>
                )}
                <Link
                  href={`/reports/${r.id}`}
                  style={{
                    fontSize: 11,
                    color: "#d97706",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
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
