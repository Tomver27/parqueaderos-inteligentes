"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, X, Car, ChevronRight } from "lucide-react";
import type { ParkingWithSpaces } from "@/types";
import Spinner from "@/components/ui/Spinner";

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group inline-flex items-center ml-1">
      <span
        className="cursor-help inline-flex items-center justify-center rounded-full text-xs leading-none"
        style={{
          width: 14,
          height: 14,
          background: "rgba(100,116,139,0.25)",
          color: "#64748b",
          fontWeight: 700,
          fontSize: 9,
        }}
      >
        ?
      </span>
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl px-3 py-2 text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"
        style={{
          background: "#1e293b",
          color: "#94a3b8",
          border: "1px solid rgba(255,255,255,0.1)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function ParkingDetailCard({
  parking,
  onClose,
}: {
  parking: ParkingWithSpaces;
  onClose: () => void;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  function handleReservar() {
    setNavigating(true);
    router.push(`/reservar?parkingId=${parking.id}`);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="rounded-2xl p-5"
        style={{
          background: "#111827",
          border: "1px solid rgba(59,130,246,0.3)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              className="text-white"
              style={{ fontWeight: 700, fontSize: "1.1rem" }}
            >
              {parking.name}
            </h3>
            <p className="text-sm" style={{ color: "#64748b" }}>
              <MapPin size={12} className="inline mr-1" />
              {parking.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={16} style={{ color: "#64748b" }} />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          {/* Puestos disponibles */}
          <div
            className="flex-1 p-3 rounded-xl text-center"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "#10b981",
              }}
            >
              {parking.availableSpots}
            </p>
            <span className="text-xs flex items-center justify-center" style={{ color: "#64748b" }}>
              Puestos disponibles
              <Tooltip text="Puestos de uso libre (no reservables) que en este momento no tienen ningún vehículo dentro." />
            </span>
          </div>

          {/* Puestos reservables */}
          <div
            className="flex-1 p-3 rounded-xl text-center"
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "#60a5fa",
              }}
            >
              {parking.reservableSpots}
            </p>
            <span className="text-xs flex items-center justify-center" style={{ color: "#64748b" }}>
              Puestos reservables
              <Tooltip text="Puestos habilitados para reserva web que aún no tienen una reserva activa para hoy." />
            </span>
          </div>
        </div>

        <button
          onClick={handleReservar}
          disabled={navigating}
          className="w-full py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2 text-white"
          style={{
            background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
            fontWeight: 700,
          }}
        >
          {navigating ? <Spinner size={18} /> : <Car size={18} />}
          {navigating ? "Cargando…" : "Ver puestos disponibles y reservar"}
          {!navigating && <ChevronRight size={16} />}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
