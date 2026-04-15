"use client";

import { useActionState, useState } from "react";
import { Pencil, Save, X, Check } from "lucide-react";
import { updateParameters } from "@/lib/actions/operador";

type Params = {
  id_parking: number;
  expires_reservation: number;
  deadline_reservation: number;
  cost_reservation: number;
  fee: number;
};

type UpdateParamsState = { error: string } | { success: true } | undefined;

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-violet-500/40";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};

export default function EditParametersForm({ params }: { params: Params }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<UpdateParamsState, FormData>(
    updateParameters,
    undefined,
  );

  if (!editing) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-6 max-w-lg">
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Expiración de reserva</span>
            <span>{params.expires_reservation} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Límite de reserva</span>
            <span>{params.deadline_reservation} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Costo de reserva</span>
            <span>${Number(params.cost_reservation).toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tarifa</span>
            <span>${Number(params.fee).toLocaleString("es-CO")}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-violet-400 transition-all hover:bg-white/[0.05]"
        >
          <Pencil size={13} />
          Editar parámetros
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-6 max-w-lg">
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
          <Check size={14} /> Parámetros actualizados
        </div>
      )}
      <form action={action} className="space-y-4">
        <input type="hidden" name="id_parking" value={params.id_parking} />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            Expiración de reserva (min)
          </label>
          <input
            name="expires_reservation"
            type="number"
            min={0}
            step="any"
            required
            defaultValue={params.expires_reservation}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            Límite de reserva (min)
          </label>
          <input
            name="deadline_reservation"
            type="number"
            min={0}
            step="any"
            required
            defaultValue={params.deadline_reservation}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            Costo de reserva ($)
          </label>
          <input
            name="cost_reservation"
            type="number"
            min={0}
            step="any"
            required
            defaultValue={params.cost_reservation}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            Tarifa ($)
          </label>
          <input
            name="fee"
            type="number"
            min={0}
            step="any"
            required
            defaultValue={params.fee}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
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
            <Save size={13} />
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
