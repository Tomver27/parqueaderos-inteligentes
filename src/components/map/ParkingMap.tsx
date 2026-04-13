"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Parking } from "@/types";

// Fix: los íconos de Leaflet no resuelven bien su ruta en bundlers modernos
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type Props = {
  parkings: Parking[];
};

const BOGOTA_CENTER: [number, number] = [4.711, -74.0721];

export default function ParkingMap({ parkings }: Props) {
  useEffect(() => {
    // Asegura que Leaflet usa el ícono correcto en todos los markers
    L.Marker.prototype.options.icon = markerIcon;
  }, []);

  return (
    <MapContainer
      center={BOGOTA_CENTER}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {parkings.map((parking) => (
        <Marker
          key={parking.id}
          position={[Number(parking.latitude), Number(parking.longitude)]}
          icon={markerIcon}
        >
          <Popup>
            <span className="font-medium">{parking.name}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
