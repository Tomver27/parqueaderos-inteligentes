"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import type { ParkingWithSpaces } from "@/types";
import ParkingMapWrapper from "@/components/map/ParkingMapWrapper";
import ParkingListSidebar from "@/components/parking/ParkingListSidebar";
import ParkingDetailCard from "@/components/parking/ParkingDetailCard";

export default function ParkingPageClient({
  parkings,
}: {
  parkings: ParkingWithSpaces[];
}) {
  const [selectedParking, setSelectedParking] =
    useState<ParkingWithSpaces | null>(null);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0b1120" }}
    >
      {/* Header bar */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={16} style={{ color: "#06b6d4" }} />
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: "#64748b" }}
            >
              Parqueaderos registrados
            </p>
          </div>
          <h1
            className="text-white"
            style={{ fontWeight: 700, fontSize: "1.3rem" }}
          >
            Parqueaderos inteligentes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {parkings.length} parqueadero{parkings.length !== 1 ? "s" : ""}{" "}
            encontrado{parkings.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-6 gap-6">
        {/* Sidebar */}
        <ParkingListSidebar
          parkings={parkings}
          selectedParking={selectedParking}
          onSelect={setSelectedParking}
        />

        {/* Map + detail */}
        <div className="flex-1 order-1 lg:order-2 flex flex-col gap-4">
          {/* Map */}
          <div
            className="flex-1 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              minHeight: 420,
            }}
          >
            <ParkingMapWrapper
              parkings={parkings}
              selectedParking={selectedParking}
              onSelect={setSelectedParking}
            />
          </div>

          {/* Selected parking detail card */}
          {selectedParking && (
            <ParkingDetailCard
              parking={selectedParking}
              onClose={() => setSelectedParking(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
