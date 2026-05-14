"use client";

import { useActionState } from "react";
import { deleteSpace, type SpaceFormState } from "@/lib/actions/operador";
import { Trash2 } from "lucide-react";

export default function DeleteSpaceButton({ spaceId }: { spaceId: number }) {
  const [state, formAction, isPending] = useActionState(deleteSpace, {} as SpaceFormState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este espacio?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={spaceId} />
      {state.error && <div className="text-red-400 text-xs mb-1">{state.error}</div>}
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1 rounded text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 transition disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : <Trash2 size={16} />}
      </button>
    </form>
  );
}
