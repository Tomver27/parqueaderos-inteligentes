"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

const INPUT_CLASS =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  // Pantalla de confirmación de correo
  if (state && "checkEmail" in state) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl">
          ✉️
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900">Revisa tu correo</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Enviamos un enlace de confirmación a{" "}
            <span className="font-medium text-zinc-800">{state.email}</span>.
            Haz clic en él para activar tu cuenta.
          </p>
        </div>
        <p className="text-xs text-zinc-400">
          ¿No lo ves? Revisa la carpeta de spam.
        </p>
        <Link href="/login" className="text-sm font-medium text-zinc-900 underline">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {"error" in (state ?? {}) && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {(state as { error: string }).error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="first_name" className="text-sm font-medium text-zinc-700">
            Primer nombre
          </label>
          <input id="first_name" name="first_name" type="text" required placeholder="Juan" className={INPUT_CLASS} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="second_name" className="text-sm font-medium text-zinc-700">
            Segundo nombre
          </label>
          <input id="second_name" name="second_name" type="text" placeholder="Carlos" className={INPUT_CLASS} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="last_name" className="text-sm font-medium text-zinc-700">
          Apellidos
        </label>
        <input id="last_name" name="last_name" type="text" required placeholder="Pérez García" className={INPUT_CLASS} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="id_document_type" className="text-sm font-medium text-zinc-700">
            Tipo de documento
          </label>
          <select id="id_document_type" name="id_document_type" required className={INPUT_CLASS}>
            <option value="1">CC</option>
            <option value="2">CE</option>
            <option value="3">PE</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="document" className="text-sm font-medium text-zinc-700">
            Número de documento
          </label>
          <input id="document" name="document" type="text" required placeholder="1234567890" className={INPUT_CLASS} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone_number" className="text-sm font-medium text-zinc-700">
          Teléfono
        </label>
        <input id="phone_number" name="phone_number" type="tel" required placeholder="3001234567" className={INPUT_CLASS} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" required placeholder="correo@ejemplo.com" className={INPUT_CLASS} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required placeholder="••••••••" minLength={6} className={INPUT_CLASS} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
