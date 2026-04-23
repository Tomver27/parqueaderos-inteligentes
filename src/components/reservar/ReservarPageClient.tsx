"use client";

import { useActionState, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Car,
  Check,
  ChevronRight,
  Lock,
  MapPin,
  X,
} from "lucide-react";
import { createReservaConductor } from "@/lib/actions/conductor";
import type { CreateReservaState } from "@/types";
import { fmtDateTimeCO } from "@/lib/dates";

type Space = {
  id: number;
  name: string;
  bookable: boolean;
};

type Occupation = {
  id: number;
  id_space: number;
};

type Reservation = {
  id: number;
  id_space: number;
  date: string;
  expires_at: string | null;
  taken: boolean;
};

type Vehicle = {
  id: number;
  plate: string;
};

type Parking = {
  id: number;
  name: string;
  address: string;
};

type Params = {
  cost_reservation: number;
  expires_reservation: number;
  deadline_reservation: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Interpret a DB timestamp string (no Z / no offset) as UTC and return
 * the Colombia calendar day "YYYY-MM-DD".
 * DB dates are stored via .toISOString() (UTC) but TIMESTAMP WITHOUT TIME
 * ZONE strips the Z on return — we re-add it here.
 */
function getColombiaDay(dateStr: string): string {
  const iso =
    dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });
}

/** Compute minimum selectable datetime string (now + deadline minutes, local browser time) */
function minDatetime(deadlineMinutes: number): string {
  const d = new Date(Date.now() + deadlineMinutes * 60_000);
  // datetime-local expects "YYYY-MM-DDTHH:MM" in browser local time
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Compute maximum selectable datetime (today + 7 days at 23:59, local browser time) */
function maxDatetime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
}

/** Check if a space is occupied right now */
function isOccupied(spaceId: number, occupations: Occupation[]): boolean {
  return occupations.some((o) => o.id_space === spaceId);
}

/**
 * A reservation blocks a space for its ENTIRE calendar day (Colombia timezone).
 * The space is free again only when expires_at < NOW() (already filtered
 * server-side) or taken = true.
 * selectedDatetime: "YYYY-MM-DDTHH:MM" from datetime-local (browser local = Colombia).
 */
function isReserved(
  spaceId: number,
  selectedDatetime: string,
  reservations: Reservation[],
): boolean {
  if (!selectedDatetime) return false;
  const selectedDay = selectedDatetime.slice(0, 10); // "YYYY-MM-DD" in Colombia local

  return reservations.some((r) => {
    if (r.id_space !== spaceId) return false;
    if (r.taken) return false;
    return getColombiaDay(r.date) === selectedDay;
  });
}

const STATUS_COLORS = {
  available: {
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    text: "#10b981",
    label: "Disponible",
  },
  occupied: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
    text: "#f87171",
    label: "Ocupado",
  },
  reserved: {
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.25)",
    text: "#facc15",
    label: "Reservado",
  },
} as const;

type SpaceStatus = keyof typeof STATUS_COLORS;

function ReservePanel({
  space,
  selectedDatetime,
  vehicles,
  onClose,
}: {
  space: Space;
  selectedDatetime: string;
  vehicles: Vehicle[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<CreateReservaState, FormData>(
    createReservaConductor,
    undefined,
  );

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "#111827",
        border: "1px solid rgba(59,130,246,0.3)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-bold">Reservar espacio</h3>
          <p className="text-sm" style={{ color: "#64748b" }}>
            {space.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={16} style={{ color: "#64748b" }} />
        </button>
      </div>

      {state && "error" in state && (
        <p
          className="mb-4 rounded-lg px-4 py-2.5 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          {state.error}
        </p>
      )}

      {state && "success" in state ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <Check size={22} style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-white font-semibold">¡Reserva confirmada!</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Reserva #{state.reservationId} creada exitosamente
            </p>
          </div>
          <Link
            href="/conductor/reservas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
          >
            Ver mis reservas <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="id_space" value={space.id} />
          <input type="hidden" name="date" value={selectedDatetime} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
              Fecha y hora
            </label>
            <p
              className="rounded-lg px-3 py-2 text-sm text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {fmtDateTimeCO(new Date(selectedDatetime + ":00-05:00"))}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="id_car"
              className="text-xs font-medium"
              style={{ color: "#94a3b8" }}
            >
              Vehículo
            </label>
            <select
              id="id_car"
              name="id_car"
              required
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <option value="">Seleccionar vehículo…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
          >
            {pending ? "Reservando…" : "Confirmar reserva"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ReservarPageClient({
  parking,
  spaces,
  occupations,
  reservations,
  params,
  isConductor,
  vehicles,
}: {
  parking: Parking;
  spaces: Space[];
  occupations: Occupation[];
  reservations: Reservation[];
  params: Params | null;
  isConductor: boolean;
  vehicles: Vehicle[];
}) {
  const deadline = params?.deadline_reservation ?? 0;
  const [selectedDatetime, setSelectedDatetime] = useState<string>(minDatetime(deadline));
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [, startTransition] = useTransition();

  const spaceStatuses = useMemo<Record<number, SpaceStatus>>(() => {
    const map: Record<number, SpaceStatus> = {};
    for (const space of spaces) {
      if (isOccupied(space.id, occupations)) {
        map[space.id] = "occupied";
      } else if (
        selectedDatetime &&
        isReserved(space.id, selectedDatetime, reservations)
      ) {
        map[space.id] = "reserved";
      } else {
        map[space.id] = "available";
      }
    }
    return map;
  }, [spaces, occupations, reservations, selectedDatetime]);

  const availableCount = Object.values(spaceStatuses).filter((s) => s === "available").length;

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "#0b1120" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/parqueaderos"
            className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors hover:text-white"
            style={{ color: "#64748b" }}
          >
            ← Volver a parqueaderos
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {parking.name}
              </h1>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                <MapPin size={13} className="inline mr-1" />
                {parking.address}
              </p>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl self-start"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <Car size={18} style={{ color: "#10b981" }} />
              <div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  disponibles
                </p>
                <p
                  className="font-extrabold leading-tight"
                  style={{ color: "#10b981", fontSize: "1.25rem" }}
                >
                  {availableCount}
                  <span className="text-sm font-normal ml-1" style={{ color: "#64748b" }}>
                    / {spaces.length}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: date selector + spaces grid */}
          <div className="lg:col-span-2 space-y-5">
            {/* Date selector */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} style={{ color: "#60a5fa" }} />
                <h2 className="text-sm font-semibold text-white">
                  Selecciona fecha y hora
                </h2>
              </div>
              <input
                type="datetime-local"
                value={selectedDatetime}
                min={minDatetime(deadline)}
                max={maxDatetime()}
                onChange={(e) => {
                  startTransition(() => {
                    setSelectedDatetime(e.target.value);
                    setSelectedSpace(null);
                  });
                }}
                className="rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  colorScheme: "dark",
                }}
              />
              <p className="mt-2 text-xs" style={{ color: "#475569" }}>
                Hora Colombia (UTC−5)
                {deadline > 0 && ` · mínimo ${deadline} min de anticipación`}
                {" · máximo 7 días adelante"}
              </p>
            </div>

            {/* Legend */}
            <div className="flex gap-4 flex-wrap">
              {(Object.keys(STATUS_COLORS) as SpaceStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: STATUS_COLORS[s].text }}
                  />
                  <span className="text-xs" style={{ color: "#64748b" }}>
                    {STATUS_COLORS[s].label}
                  </span>
                </div>
              ))}
            </div>

            {/* Spaces grid */}
            {spaces.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Este parqueadero no tiene espacios reservables registrados.
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {spaces.map((space) => {
                    const status = spaceStatuses[space.id] ?? "available";
                    const colors = STATUS_COLORS[status];
                    const isSelectable = status === "available" && isConductor;
                    const isSelected = selectedSpace?.id === space.id;

                    return (
                      <button
                        key={space.id}
                        type="button"
                        disabled={!isSelectable}
                        onClick={() =>
                          setSelectedSpace(isSelected ? null : space)
                        }
                        className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all"
                        style={{
                          background: isSelected
                            ? "rgba(59,130,246,0.2)"
                            : colors.bg,
                          border: isSelected
                            ? "1px solid rgba(59,130,246,0.6)"
                            : `1px solid ${colors.border}`,
                          cursor: isSelectable ? "pointer" : "default",
                          opacity: status !== "available" ? 0.7 : 1,
                        }}
                      >
                        <Car size={20} style={{ color: isSelected ? "#60a5fa" : colors.text }} />
                        <span
                          className="text-xs font-semibold truncate w-full text-center"
                          style={{ color: isSelected ? "#93c5fd" : colors.text }}
                        >
                          {space.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column: reservation panel or info */}
          <div>
            {!isConductor ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(59,130,246,0.12)" }}
                >
                  <Lock size={20} style={{ color: "#60a5fa" }} />
                </div>
                <p className="text-white font-semibold text-sm mb-2">
                  Inicia sesión para reservar
                </p>
                <p className="text-xs mb-5" style={{ color: "#64748b" }}>
                  Debes tener una cuenta de conductor para realizar reservas.
                </p>
                <Link
                  href={`/login?redirect=/reservar?parkingId=${parking.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
                >
                  Iniciar sesión <ChevronRight size={14} />
                </Link>
              </div>
            ) : vehicles.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Car size={28} className="mx-auto mb-3" style={{ color: "#475569" }} />
                <p className="text-white font-semibold text-sm mb-2">
                  Sin vehículos registrados
                </p>
                <p className="text-xs mb-5" style={{ color: "#64748b" }}>
                  Registra un vehículo para poder hacer reservas.
                </p>
                <Link
                  href="/conductor/vehiculos"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#10b981,#0891b2)" }}
                >
                  Mis vehículos <ChevronRight size={14} />
                </Link>
              </div>
            ) : selectedSpace ? (
              <ReservePanel
                space={selectedSpace}
                selectedDatetime={selectedDatetime}
                vehicles={vehicles}
                onClose={() => setSelectedSpace(null)}
              />
            ) : (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Car size={28} className="mx-auto mb-3" style={{ color: "#475569" }} />
                <p className="text-sm font-semibold text-white mb-1">
                  Selecciona un espacio
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Elige un espacio disponible (verde) del mapa para reservarlo.
                </p>
                {params && (
                  <div
                    className="mt-5 rounded-xl p-4 text-left space-y-2"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
                      Datos del parqueadero
                    </p>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#64748b" }}>Costo reserva</span>
                      <span className="text-white">
                        ${Number(params.cost_reservation).toLocaleString("es-CO")} COP
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#64748b" }}>Tiempo para llegar</span>
                      <span className="text-white">{params.expires_reservation} min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#64748b" }}>Anticipación mínima</span>
                      <span className="text-white">{params.deadline_reservation} min</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
