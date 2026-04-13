"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, X, Car, ChevronRight } from "lucide-react";
import type { ParkingWithSpaces } from "@/types";

export default function ParkingDetailCard({
  parking,
  onClose,
}: {
  parking: ParkingWithSpaces;
  onClose: () => void;
}) {
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
              {parking.totalSpots}
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              espacios totales
            </p>
          </div>
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
              {parking.spaces.length}
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              puestos registrados
            </p>
          </div>
        </div>
        <Link
          href={`/reservar?parkingId=${parking.id}`}
          className="w-full py-3 rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-2 text-white"
          style={{
            background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
            fontWeight: 700,
          }}
        >
          <Car size={18} />
          Ver puestos disponibles y reservar
          <ChevronRight size={16} />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
