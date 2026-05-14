"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateReserva, type ReservaFormState } from "@/lib/actions/operador";
import { dbTs } from "@/lib/dates";

type SpaceOption = { id: number; name: string };

interface ReservaRow {
  id: number;
  date: string;
  id_space: number;
  id_car: number;
}

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-violet-500/40";
const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};

function toDatetimeLocalCO(utcStr: string): string {
  const d = dbTs(utcStr);
  return d
    .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
    .slice(0, 16)
    .replace(" ", "T");
}

export default function EditReservaForm({
  reserva,
  spaces,
}: {
  reserva: ReservaRow;
  spaces: SpaceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ReservaFormState, FormData>(
    updateReserva,
    undefined,
  );

  useEffect(() => {
    if (state && "success" in state) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 rounded text-sm bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition"
      >
        <Pencil size={14} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 w-96 border border-white/[0.07]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Editar reserva #{reserva.id}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {state && "error" in state && (
          <div className="bg-red-500/15 border border-red-500/30 rounded p-3 mb-4 text-sm text-red-300">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={reserva.id} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Espacio</label>
            <select
              name="id_space"
              required
              defaultValue={reserva.id_space}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (ID: {s.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">ID del vehículo</label>
            <input
              name="id_car"
              type="number"
              min={1}
              required
              defaultValue={reserva.id_car}
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
              defaultValue={toDatetimeLocalCO(reserva.date)}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded text-white transition disabled:opacity-50 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
            >
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
