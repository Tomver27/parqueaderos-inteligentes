"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const BOGOTA: [number, number] = [4.711, -74.0721];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ lat, lng, onChange }: Props) {
  const hasInitial = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const [pos, setPos] = useState<[number, number] | null>(
    hasInitial ? [lat!, lng!] : null,
  );

  function handlePick(la: number, ln: number) {
    setPos([la, ln]);
    onChange(la, ln);
  }

  return (
    <MapContainer
      center={pos ?? BOGOTA}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={handlePick} />
      {pos && (
        <Marker
          position={pos}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const { lat: la, lng: ln } = e.target.getLatLng();
              handlePick(la, ln);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
