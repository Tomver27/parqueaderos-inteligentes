"use client";

import dynamic from "next/dynamic";
import type { Parking } from "@/types";

const ParkingMap = dynamic(() => import("./ParkingMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full items-center justify-center text-sm"
      style={{ color: "#64748b", background: "#0f1e35" }}
    >
      Cargando mapa...
    </div>
  ),
});

export default function AdminMapClient({ parkings }: { parkings: Parking[] }) {
  return (
    <ParkingMap
      parkings={parkings}
      getDetailHref={(id) => `/admin/parqueaderos?parqueadero=${id}`}
    />
  );
}
