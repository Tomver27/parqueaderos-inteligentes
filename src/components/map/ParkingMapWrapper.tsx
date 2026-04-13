"use client";

import dynamic from "next/dynamic";
import type { Parking } from "@/types";

const ParkingMap = dynamic(() => import("./ParkingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-50 text-sm text-zinc-400">
      Cargando mapa...
    </div>
  ),
});

type Props = {
  parkings: Parking[];
};

export default function ParkingMapWrapper({ parkings }: Props) {
  return <ParkingMap parkings={parkings} />;
}
