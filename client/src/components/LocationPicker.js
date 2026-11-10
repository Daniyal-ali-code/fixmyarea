"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [24.8607, 67.0011]; // Karachi

// Custom pin icon (matches the map markers on the homepage)
const pickerIcon = L.divIcon({
  className: "fixmyarea-picker-marker",
  html: `<div style="
    background:#d97706;
    width:26px;height:26px;border-radius:50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Programmatically move the map when lat/lng change externally
function MapRefresher({ lat, lng }) {
  const map = useMap();
  const prevRef = useRef({ lat, lng });

  useEffect(() => {
    if (lat == null || lng == null) return;
    const prev = prevRef.current;
    // Only recenter if the change came from outside (e.g. GPS button)
    if (
      Math.abs(prev.lat - lat) > 0.0001 ||
      Math.abs(prev.lng - lng) > 0.0001
    ) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
      prevRef.current = { lat, lng };
    }
  }, [lat, lng, map]);

  return null;
}

export default function LocationPicker({ latitude, longitude, onPick }) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasPin = !isNaN(lat) && !isNaN(lng);
  const center = hasPin ? [lat, lng] : DEFAULT_CENTER;
  const zoom = hasPin ? 15 : 12;

  return (
    <div className="rounded-sm overflow-hidden border border-stone-300 dark:border-stone-700">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "320px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        {hasPin && (
          <>
            <Marker
              position={[lat, lng]}
              icon={pickerIcon}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onPick(pos.lat, pos.lng);
                },
              }}
            />
            <MapRefresher lat={lat} lng={lng} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
