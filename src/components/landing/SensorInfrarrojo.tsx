"use client";

import { useEffect, useState } from "react";

interface SensorState {
  device: string;
  estado: "LIBRE" | "OCUPADO";
  valor_adc: number;
  updated_at: string;
}

export default function SensorInfrarrojo() {
  const [sensor, setSensor] = useState<SensorState | null>(null);

  useEffect(() => {
    const fetchEstado = async () => {
      try {
        const res = await fetch("/api/webhook/infrarojo");
        const data = await res.json();
        setSensor(data.sensor);
      } catch {
        // silently ignore network errors between polls
      }
    };

    fetchEstado();
    const interval = setInterval(fetchEstado, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!sensor) return null;

  const libre = sensor.estado === "LIBRE";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-sm ${
        libre
          ? "border-green-500/40 bg-green-500/10 text-green-300"
          : "border-red-500/40 bg-red-500/10 text-red-300"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${libre ? "bg-green-400" : "bg-red-400"} animate-pulse`}
      />
      Sensor infrarrojo está{" "}
      <span className="font-bold">{sensor.estado}</span>
    </div>
  );
}
