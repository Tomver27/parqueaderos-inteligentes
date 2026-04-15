"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Wifi, MapPin } from "lucide-react";
import type { ParkingStats } from "@/lib/queries/stats";

const PARKING_IMG =
  "https://images.unsplash.com/photo-1628620600676-4a3481c08021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmtpbmclMjBsb3QlMjBtb2Rlcm4lMjBjaXR5fGVufDF8fHx8MTc3Mjg5OTE1M3ww&ixlib=rb-4.1.0&q=80&w=1080";

function CalendarCheck({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  );
}

export default function HeroSection({ stats }: { stats: ParkingStats }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 50%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(6,182,212,0.1) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6"
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#60a5fa",
            }}
          >
            <Wifi size={12} />
            Sistema IoT · Monitoreo en tiempo real
          </div>
          <h1
            className="mb-6"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            Sistema Inteligente de{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Gestión y Reserva
            </span>{" "}
            de Estacionamientos
          </h1>
          <p
            className="text-lg mb-8"
            style={{ color: "#94a3b8", lineHeight: 1.7 }}
          >
            Utilizando sensores de proximidad conectados a un microcontrolador,
            detectamos la ocupación de las plazas en tiempo real. La información
            se envía al backend mediante MQTT/HTTP, permitiendo visualizar
            disponibilidad y gestionar reservas desde cualquier dispositivo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/parqueaderos"
              className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                fontWeight: 600,
              }}
            >
              <MapPin size={18} />
              Ver parqueaderos cercanos
            </Link>            
          </div>

          <div className="mt-10 flex items-center gap-6">
            {[
              { label: "Parqueaderos monitoreados", val: String(stats.totalParkings) },
              { label: "Espacios libres", val: String(stats.freeSpaces) },
              { label: "Reservas hoy", val: String(stats.reservationsToday) },
            ].map((s) => (
              <div key={s.label}>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#06b6d4",
                  }}
                >
                  {s.val}
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={PARKING_IMG}
              alt="Parqueadero inteligente"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(11,17,32,0.6) 0%, rgba(11,17,32,0.2) 100%)",
              }}
            />

            {/* Live badge */}
            <div
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: "rgba(16,185,129,0.9)", fontWeight: 600 }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              En vivo
            </div>

            {/* Bottom overlay */}
            <div
              className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl"
              style={{
                background: "rgba(11,17,32,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  Parqueadero Centro Andino
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(16,185,129,0.2)",
                    color: "#10b981",
                  }}
                >
                  12 libres
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full"
                    style={{
                      background:
                        i < 7 ? "rgba(59,130,246,0.5)" : "#10b981",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                40 plazas totales · Actualizado hace 1s
              </p>
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-4 -right-4 px-4 py-3 rounded-2xl shadow-xl"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              minWidth: 140,
            }}
          >
            <p className="text-xs opacity-80">Última reserva</p>
            <p className="text-sm" style={{ fontWeight: 700 }}>
              Hace 3 minutos
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
