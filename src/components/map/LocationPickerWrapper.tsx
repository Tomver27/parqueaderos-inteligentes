"use client";

import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full items-center justify-center text-sm text-slate-500"
      style={{ background: "#0f1e35" }}
    >
      Cargando mapa...
    </div>
  ),
});

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerWrapper({ lat, lng, onChange }: Props) {
  return <LocationPickerMap lat={lat} lng={lng} onChange={onChange} />;
}
