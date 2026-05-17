"use client";

import { useActionState } from "react";
import { deleteParking, type ParkingFormState } from "@/lib/actions/admin";
import { Trash2 } from "lucide-react";

export default function DeleteParkingButton({ parkingId }: { parkingId: number }) {
  const [state, formAction, isPending] = useActionState<ParkingFormState, FormData>(
    deleteParking,
    {},
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este parqueadero? Esta acción no se puede deshacer.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={parkingId} />
      {state.error && <p className="text-red-400 text-xs mb-1">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1 rounded text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 transition disabled:opacity-50"
      >
        {isPending ? "..." : <Trash2 size={15} />}
      </button>
    </form>
  );
}
