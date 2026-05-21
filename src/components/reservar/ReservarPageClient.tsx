"use client";

import { useActionState, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Car,
  ChevronRight,
  Lock,
  Mail,
  MapPin,
} from "lucide-react";
import { createReservaConductor } from "@/lib/actions/conductor";
import PayUCheckout from "@/components/PayUCheckout";
import type {
  CreateReservaState,
  Occupation,
  Reservation,
  Vehicle,
  SpaceSlot,
  ParkingInfo,
  ReservaParams,
} from "@/types";
import { fmtDateTimeCO } from "@/lib/dates";

const pad = (n: number) => String(n).padStart(2, "0");

function getColombiaDay(dateStr: string): string {
  const iso =
    dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });
}

function minDatetime(deadlineMinutes: number): string {
  const d = new Date(Date.now() + (deadlineMinutes + 1) * 60_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function maxDatetime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
}

function isOccupied(spaceId: number, occupations: Occupation[]): boolean {
  return occupations.some((o) => o.id_space === spaceId);
}

function isReserved(
  spaceId: number,
  selectedDatetime: string,
  reservations: Reservation[],
): boolean {
  if (!selectedDatetime) return false;
  const selectedDay = selectedDatetime.slice(0, 10);
  return reservations.some((r) => {
    if (r.id_space !== spaceId) return false;
    if (r.taken) return false;
    return getColombiaDay(r.date) === selectedDay;
  });
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
  parking: ParkingInfo;
  spaces: SpaceSlot[];
  occupations: Occupation[];
  reservations: Reservation[];
  params: ReservaParams | null;
  isConductor: boolean;
  vehicles: Vehicle[];
}) {
  const deadline = params?.deadline_reservation ?? 0;
  const [selectedDatetime, setSelectedDatetime] = useState<string>(minDatetime(deadline));
  const [, startTransition] = useTransition();

  const [state, action, pending] = useActionState<CreateReservaState, FormData>(
    createReservaConductor,
    undefined,
  );

  const availableCount = useMemo(() => {
    return spaces.filter(
      (s) =>
        !isOccupied(s.id, occupations) &&
        !isReserved(s.id, selectedDatetime, reservations),
    ).length;
  }, [spaces, occupations, reservations, selectedDatetime]);

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "#0b1120" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/parqueaderos"
            className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors hover:text-white"
            style={{ color: "#64748b" }}
          >
            ← Volver a parqueaderos
          </Link>
          <h1 className="text-2xl font-extrabold text-white">{parking.name}</h1>
          <p className="text-sm mt-1 flex items-center gap-1" style={{ color: "#64748b" }}>
            <MapPin size={13} />
            {parking.address}
          </p>
        </div>

        {/* Notice */}
        <div
          className="flex items-start gap-3 rounded-2xl px-5 py-4 mb-8"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.25)",
          }}
        >
          <Mail size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }} />
          <p className="text-sm leading-relaxed" style={{ color: "#93c5fd" }}>
            Se le notificará por correo electrónico la plaza asignada para su reserva una vez se realice el pago.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: date picker + availability info */}
          <div className="space-y-5">
            <div
              className="rounded-2xl p-5"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)" }}
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
                  startTransition(() => setSelectedDatetime(e.target.value));
                }}
                className="rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40 w-full"
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
              <p className="mt-2 text-xs" style={{ color: "#475569" }}>
                Hora Colombia (UTC−5)
                {deadline > 0 && ` · mínimo ${deadline} min de anticipación`}
                {" · máximo 7 días adelante"}
              </p>
            </div>

            {/* Availability indicator */}
            {isConductor && spaces.length > 0 && (
              <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: availableCount > 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${availableCount > 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <Car
                  size={20}
                  style={{ color: availableCount > 0 ? "#10b981" : "#f87171", flexShrink: 0 }}
                />
                <div>
                  <p
                    className="font-bold text-lg leading-tight"
                    style={{ color: availableCount > 0 ? "#10b981" : "#f87171" }}
                  >
                    {availableCount}
                    <span className="text-sm font-normal ml-1" style={{ color: "#64748b" }}>
                      / {spaces.length}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    espacios disponibles para la fecha seleccionada
                  </p>
                </div>
              </div>
            )}

            {/* Parking params */}
            {params && (
              <div
                className="rounded-2xl p-4 space-y-2"
                style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>
                  Datos del parqueadero
                </p>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Costo reserva</span>
                  <span className="text-white font-medium">
                    ${Number(params.cost_reservation).toLocaleString("es-CO")} COP
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Tiempo para llegar</span>
                  <span className="text-white font-medium">{params.expires_reservation} min</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Anticipación mínima</span>
                  <span className="text-white font-medium">{params.deadline_reservation} min</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: action panel */}
          <div>
            {!isConductor ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)" }}
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
                style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)" }}
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
            ) : state && "success" in state ? (
              <div className="space-y-4">
                <div
                  className="rounded-2xl p-4"
                  style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-white font-semibold text-sm">
                    Reserva #{state.reservationId} creada
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    {fmtDateTimeCO(new Date(selectedDatetime + ":00-05:00"))}
                  </p>
                  <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                    Completa el pago para confirmar tu reserva. Recibirás la plaza asignada por correo.
                  </p>
                </div>
                <PayUCheckout
                  referenceCode={state.referenceCode!}
                  amount={state.amount!}
                  description={state.description!}
                  buyerEmail={state.buyerEmail!}
                  buyerName={state.buyerName!}
                  reservationId={state.reservationId}
                  parkingName={state.parkingName!}
                  reservationDate={state.reservationDate!}
                  vehiclePlate={state.vehiclePlate!}
                />
              </div>
            ) : (
              <div
                className="rounded-2xl p-6"
                style={{ background: "#111827", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <h3 className="text-white font-bold mb-1">Confirmar reserva</h3>
                <p className="text-xs mb-5" style={{ color: "#64748b" }}>
                  El sistema asignará automáticamente un espacio disponible.
                </p>

                {state && "error" in state && (
                  <p
                    className="mb-4 rounded-lg px-4 py-2.5 text-sm"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
                  >
                    {state.error}
                  </p>
                )}

                <form action={action} className="space-y-4">
                  <input type="hidden" name="id_parking" value={parking.id} />
                  <input type="hidden" name="date" value={selectedDatetime} />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                      Fecha y hora
                    </label>
                    <p
                      className="rounded-lg px-3 py-2 text-sm text-white"
                      style={inputStyle}
                    >
                      {fmtDateTimeCO(new Date(selectedDatetime + ":00-05:00"))}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="id_car" className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                      Vehículo
                    </label>
                    <select
                      id="id_car"
                      name="id_car"
                      required
                      className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={inputStyle}
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
                    disabled={pending || availableCount === 0}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
                  >
                    {pending ? "Reservando…" : "Confirmar reserva"}
                  </button>

                  {availableCount === 0 && spaces.length > 0 && (
                    <p className="text-xs text-center" style={{ color: "#f87171" }}>
                      No hay espacios disponibles para la fecha seleccionada.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
