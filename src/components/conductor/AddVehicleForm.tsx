"use client";

import { useActionState, useState } from "react";
import { Car, Check, Plus, X } from "lucide-react";
import { addVehicle } from "@/lib/actions/conductor";
import type { AddVehicleState, TypeVehicle } from "@/types";

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-emerald-500/40";
const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};

export default function AddVehicleForm({
  typeVehicles,
}: {
  typeVehicles: TypeVehicle[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AddVehicleState, FormData>(
    addVehicle,
    undefined,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}
      >
        <Plus size={16} />
        Agregar vehículo
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 mb-6 max-w-sm"
      style={{
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Car size={17} className="text-emerald-400" />
          <h3 className="font-semibold text-sm text-white">Nuevo vehículo</h3>
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
          className="mb-4 rounded-lg px-4 py-2.5 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          {state.error}
        </p>
      )}

      {state && "success" in state ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <Check size={20} style={{ color: "#10b981" }} />
          </div>
          <p className="text-white text-sm font-semibold">
            Vehículo registrado
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="plate"
              className="text-xs font-medium text-slate-400"
            >
              Placa
            </label>
            <input
              id="plate"
              name="plate"
              type="text"
              required
              maxLength={6}
              placeholder="ABC123"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            <p className="text-xs" style={{ color: "#475569" }}>
              6 caracteres · sin espacios ni guiones (ej. ABC123, ABC12D)
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="id_typev"
              className="text-xs font-medium text-slate-400"
            >
              Tipo de vehículo
            </label>
            <select
              id="id_typev"
              name="id_typev"
              required
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            >
              <option value="">Seleccionar tipo…</option>
              {typeVehicles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #10b981, #0891b2)" }}
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
