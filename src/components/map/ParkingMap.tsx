"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Parking, ParkingWithSpaces } from "@/types";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  className: "leaflet-marker-selected",
});

type Props = {
  parkings: Parking[];
  selectedParking?: ParkingWithSpaces | null;
  onSelect?: (p: ParkingWithSpaces) => void;
};

const BOGOTA_CENTER: [number, number] = [4.711, -74.0721];

export default function ParkingMap({ parkings, selectedParking, onSelect }: Props) {
  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  const center: [number, number] =
    parkings.length > 0
      ? [
          parkings.reduce((s, p) => s + Number(p.latitude), 0) / parkings.length,
          parkings.reduce((s, p) => s + Number(p.longitude), 0) / parkings.length,
        ]
      : BOGOTA_CENTER;

  return (
    <MapContainer
      center={center}
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
          icon={selectedParking?.id === parking.id ? selectedIcon : defaultIcon}
          eventHandlers={onSelect ? { click: () => onSelect(parking as ParkingWithSpaces) } : {}}
        >
          <Popup>
            <div>
              <span className="font-medium">{parking.name}</span>
              <br />
              <span className="text-xs text-gray-500">{parking.address}</span>
              <br />
              <span className="text-xs">{"totalSpots" in parking ? `${(parking as ParkingWithSpaces).totalSpots} espacios` : ""}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
