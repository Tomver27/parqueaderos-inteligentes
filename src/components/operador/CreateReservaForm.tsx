"use client";

import { useActionState, useState } from "react";
import { Plus, X, Check, CalendarPlus } from "lucide-react";
import { createReserva } from "@/lib/actions/operador";
import type { CreateReservaState } from "@/types";

type SpaceOption = { id: number; name: string };

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-violet-500/40";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};

export default function CreateReservaForm({
  spaces,
  costReservation,
}: {
  spaces: SpaceOption[];
  costReservation: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateReservaState, FormData>(
    createReserva,
    undefined,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
      >
        <Plus size={16} />
        Nueva reserva
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-6 mb-6 max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarPlus size={18} className="text-violet-400" />
          <h3 className="font-semibold">Nueva reserva</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {state && "error" in state && (
        <p
          className="mb-4 rounded-lg px-4 py-2 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <div className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm bg-emerald-500/15 text-emerald-400">
          <Check size={14} /> Reserva #{state.reservationId} creada con pago registrado
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Espacio</label>
          <select
            name="id_space"
            required
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          >
            <option value="">Seleccionar espacio…</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (ID: {s.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            ID del vehículo
          </label>
          <input
            name="id_car"
            type="number"
            min={1}
            required
            placeholder="Ej: 5"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Fecha</label>
          <input
            name="date"
            type="datetime-local"
            required
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Moneda</label>
          <select
            name="currency"
            required
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Monto</label>
          <div
            className="rounded-lg px-3 py-2 text-sm text-slate-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            ${Number(costReservation).toLocaleString("es-CO")}
            <span className="text-xs text-slate-500 ml-2">
              (costo de reserva del parqueadero)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Estado</label>
          <div
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
              Pagado
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-white transition-all"
          >
            <X size={13} /> Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
          >
            <CalendarPlus size={13} />
            {pending ? "Creando…" : "Crear reserva"}
          </button>
        </div>
      </form>
    </div>
  );
}
