"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUp } from "@/lib/actions/auth";

const INPUT_CLASS =
  "rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  // Pantalla de confirmación de correo
  if (state && "checkEmail" in state) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: "rgba(59,130,246,0.15)" }}
        >
          ✉️
        </div>
        <div>
          <h2 className="text-white" style={{ fontWeight: 600 }}>Revisa tu correo</h2>
          <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>
            Enviamos un enlace de confirmación a{" "}
            <span style={{ color: "#60a5fa", fontWeight: 500 }}>{state.email}</span>.
            Haz clic en él para activar tu cuenta.
          </p>
        </div>
        <p className="text-xs" style={{ color: "#475569" }}>
          ¿No lo ves? Revisa la carpeta de spam.
        </p>
        <Link href="/login" className="text-sm underline" style={{ color: "#60a5fa", fontWeight: 500 }}>
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="first_name" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
            Primer nombre
          </label>
          <input id="first_name" name="first_name" type="text" required placeholder="Juan" className={INPUT_CLASS} style={INPUT_STYLE} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="second_name" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
            Segundo nombre
          </label>
          <input id="second_name" name="second_name" type="text" placeholder="Carlos" className={INPUT_CLASS} style={INPUT_STYLE} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="last_name" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
          Apellidos
        </label>
        <input id="last_name" name="last_name" type="text" required placeholder="Pérez García" className={INPUT_CLASS} style={INPUT_STYLE} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="id_document_type" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
            Tipo de documento
          </label>
          <select id="id_document_type" name="id_document_type" required className={INPUT_CLASS} style={INPUT_STYLE}>
            <option value="1">CC</option>
            <option value="2">CE</option>
            <option value="3">PE</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="document" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
            Número de documento
          </label>
          <input id="document" name="document" type="text" required placeholder="1234567890" className={INPUT_CLASS} style={INPUT_STYLE} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone_number" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
          Teléfono
        </label>
        <input id="phone_number" name="phone_number" type="tel" required placeholder="3001234567" className={INPUT_CLASS} style={INPUT_STYLE} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" required placeholder="correo@ejemplo.com" className={INPUT_CLASS} style={INPUT_STYLE} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm" style={{ color: "#94a3b8", fontWeight: 500 }}>
          Contraseña
        </label>
        <input id="password" name="password" type="password" required placeholder="••••••••" minLength={6} className={INPUT_CLASS} style={INPUT_STYLE} />
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
        <UserPlus size={16} />
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm" style={{ color: "#64748b" }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline" style={{ color: "#60a5fa", fontWeight: 500 }}>
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
