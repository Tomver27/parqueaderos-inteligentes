"use client";

import { useActionState } from "react";
import { deleteReserva, type ReservaFormState } from "@/lib/actions/operador";
import { Trash2 } from "lucide-react";

export default function DeleteReservaButton({ reservaId }: { reservaId: number }) {
  const [state, formAction, isPending] = useActionState<ReservaFormState, FormData>(
    deleteReserva,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar reserva #${reservaId}? También se eliminará el pago asociado.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={reservaId} />
      {state && "error" in state && (
        <span className="text-red-400 text-xs block mb-1">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1 rounded text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 transition disabled:opacity-50"
      >
        {isPending ? "…" : <Trash2 size={14} />}
      </button>
    </form>
  );
}
