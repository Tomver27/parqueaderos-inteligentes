"use client";

import dynamic from "next/dynamic";
import type { Parking, ParkingWithSpaces } from "@/types";

const ParkingMap = dynamic(() => import("./ParkingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm" style={{ color: "#64748b", background: "#0f1e35" }}>
      Cargando mapa...
    </div>
  ),
});

type Props = {
  parkings: Parking[];
  selectedParking?: ParkingWithSpaces | null;
  onSelect?: (p: ParkingWithSpaces) => void;
};

export default function ParkingMapWrapper({ parkings, selectedParking, onSelect }: Props) {
  return <ParkingMap parkings={parkings} selectedParking={selectedParking} onSelect={onSelect} />;
}
