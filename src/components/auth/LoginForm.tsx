"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { signIn } from "@/lib/actions/auth";

const INPUT_CLASS =
  "rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state && "error" in state && (
        <p
          className="rounded-lg px-4 py-2 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="correo@ejemplo.com"
          className={INPUT_CLASS}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className={INPUT_CLASS}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
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
        <LogIn size={16} />
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-sm" style={{ color: "#64748b" }}>
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="underline" style={{ color: "#60a5fa", fontWeight: 500 }}>
          Regístrate
        </Link>
      </p>
    </form>
  );
}
