"use client";

import { useActionState } from "react";
import { deleteSpace, type SpaceFormState } from "@/lib/actions/operador";
import { Trash2 } from "lucide-react";

interface DeleteSpaceButtonProps {
  spaceId: number;
}

export default function DeleteSpaceButton({ spaceId }: DeleteSpaceButtonProps) {
  const [state, formAction, isPending] = useActionState(deleteSpace, {} as SpaceFormState);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este espacio?")) return;

    const formData = new FormData();
    formData.set("id", spaceId.toString());
    await formAction(formData);
  };

  if (state.error) {
    return (
      <div className="text-red-400 text-xs">
        {state.error}
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="px-3 py-1 rounded text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 transition disabled:opacity-50"
    >
      {isPending ? "Eliminando..." : <Trash2 size={16} />}
    </button>
  );
}
