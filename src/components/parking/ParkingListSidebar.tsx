"use client";

import { motion } from "motion/react";
import { Car, MapPin, ChevronRight } from "lucide-react";
import type { ParkingWithSpaces } from "@/types";

export default function ParkingListSidebar({
  parkings,
  selectedParking,
  onSelect,
}: {
  parkings: ParkingWithSpaces[];
  selectedParking: ParkingWithSpaces | null;
  onSelect: (p: ParkingWithSpaces | null) => void;
}) {
  return (
    <div className="lg:w-80 flex flex-col gap-3 order-2 lg:order-1">
      <p
        className="text-xs uppercase tracking-widest"
        style={{ color: "#64748b" }}
      >
        Parqueaderos disponibles
      </p>
      {parkings.map((p) => {
        const isSelected = selectedParking?.id === p.id;
        return (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(isSelected ? null : p)}
            className="w-full text-left rounded-2xl p-4 transition-all"
            style={{
              background: isSelected
                ? "rgba(59,130,246,0.15)"
                : "#111827",
              border: isSelected
                ? "1px solid rgba(59,130,246,0.5)"
                : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🅿️</span>
                <div>
                  <p
                    className="text-white text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#64748b" }}>
                    <MapPin size={10} />
                    {p.address}
                  </p>
                </div>
              </div>
              <div
                className="px-2 py-1 rounded-lg text-xs flex-shrink-0"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  color: "#10b981",
                  fontWeight: 700,
                }}
              >
                {p.totalSpots} puestos
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 text-xs"
                style={{ color: "#64748b" }}
              >
                <span className="flex items-center gap-1">
                  <Car size={11} />
                  {p.totalSpots} espacios totales
                </span>
              </div>
              <ChevronRight size={14} style={{ color: "#475569" }} />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
