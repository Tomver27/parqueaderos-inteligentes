"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { setPassword } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/auth";

const INPUT_CLASS =
  "rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function SetPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    setPassword,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(59,130,246,0.15)" }}
        >
          <KeyRound size={24} className="text-blue-400" />
        </div>
        <h2
          className="text-lg text-white"
          style={{ fontWeight: 600 }}
        >
          Establece tu contraseña
        </h2>
        <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>
          Crea una contraseña para iniciar sesión en el futuro.
        </p>
      </div>

      {state && "error" in state && (
        <p
          className="rounded-lg px-4 py-2 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm"
          style={{ color: "#94a3b8", fontWeight: 500 }}
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          className={INPUT_CLASS}
          style={INPUT_STYLE}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          fontWeight: 600,
        }}
      >
        <KeyRound size={16} />
        {pending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
