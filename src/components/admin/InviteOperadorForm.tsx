"use client";

import { useActionState, useState } from "react";
import { UserPlus, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { inviteOperador } from "@/lib/actions/admin";
import type { InviteState } from "@/types";

const INPUT_CLASS =
  "rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};

type Props = {
  parkings: { id: number; name: string }[];
};

export default function InviteOperadorForm({ parkings }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<InviteState, FormData>(
    inviteOperador,
    undefined,
  );

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
      >
        <UserPlus size={16} />
        Invitar operador
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div
          className="mt-4 rounded-xl p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {state && "success" in state ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "rgba(59,130,246,0.15)" }}
              >
                <Mail size={22} className="text-blue-400" />
              </div>
              <p className="text-sm text-slate-300">
                Invitación enviada a{" "}
                <span className="font-medium text-blue-400">
                  {state.email}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-slate-500 underline hover:text-slate-400"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              {state && "error" in state && (
                <p
                  className="rounded-lg px-4 py-2 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    color: "#f87171",
                  }}
                >
                  {state.error}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_first_name"
                    className="text-xs font-medium text-slate-400"
                  >
                    Primer nombre *
                  </label>
                  <input
                    id="inv_first_name"
                    name="first_name"
                    type="text"
                    required
                    placeholder="Juan"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_second_name"
                    className="text-xs font-medium text-slate-400"
                  >
                    Segundo nombre
                  </label>
                  <input
                    id="inv_second_name"
                    name="second_name"
                    type="text"
                    placeholder="Carlos"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_last_name"
                    className="text-xs font-medium text-slate-400"
                  >
                    Apellidos *
                  </label>
                  <input
                    id="inv_last_name"
                    name="last_name"
                    type="text"
                    required
                    placeholder="Pérez García"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_email"
                    className="text-xs font-medium text-slate-400"
                  >
                    Correo electrónico *
                  </label>
                  <input
                    id="inv_email"
                    name="email"
                    type="email"
                    required
                    placeholder="operador@ejemplo.com"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_phone"
                    className="text-xs font-medium text-slate-400"
                  >
                    Teléfono *
                  </label>
                  <input
                    id="inv_phone"
                    name="phone_number"
                    type="tel"
                    required
                    placeholder="3001234567"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_doc_type"
                    className="text-xs font-medium text-slate-400"
                  >
                    Tipo de documento *
                  </label>
                  <select
                    id="inv_doc_type"
                    name="id_document_type"
                    required
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="1">CC</option>
                    <option value="2">CE</option>
                    <option value="3">PE</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="inv_document"
                    className="text-xs font-medium text-slate-400"
                  >
                    Número de documento *
                  </label>
                  <input
                    id="inv_document"
                    name="document"
                    type="text"
                    required
                    placeholder="1234567890"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="inv_parking"
                  className="text-xs font-medium text-slate-400"
                >
                  Parqueadero asignado *
                </label>
                <select
                  id="inv_parking"
                  name="id_parking"
                  required
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                >
                  <option value="">Seleccionar parqueadero</option>
                  {parkings.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm text-slate-400 transition-all hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  }}
                >
                  <Mail size={14} />
                  {pending ? "Enviando..." : "Enviar invitación"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
