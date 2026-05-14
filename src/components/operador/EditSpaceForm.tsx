"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSpace, createSpace, type SpaceFormState } from "@/lib/actions/operador";
import { X } from "lucide-react";

interface Space {
  id: number;
  name: string;
  bookable: boolean;
  id_typev: number | null;
  id_parking: number;
  TypeVehicles?: { name: string } | null;
}

interface VehicleType {
  id: number;
  name: string;
}

interface EditSpaceFormProps {
  space?: Space;
  vehicleTypes: VehicleType[];
  parkingId: number;
}

export default function EditSpaceForm({
  space,
  vehicleTypes,
  parkingId,
}: EditSpaceFormProps) {
  const isCreating = !space;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const action = isCreating ? createSpace : updateSpace;
  const [state, formAction, isPending] = useActionState(action, {} as SpaceFormState);

  useEffect(() => {
    if (state.success) {
      setIsModalOpen(false);
    }
  }, [state.success]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isCreating && !isModalOpen) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-3 py-1 rounded text-sm bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition"
      >
        Editar
      </button>
    );
  }

  if (isCreating && !isModalOpen) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition flex items-center gap-2"
      >
        <span>+</span> Nuevo Espacio
      </button>
    );
  }

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 w-96 border border-white/[0.07]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {isCreating ? "Nuevo Espacio" : "Editar Espacio"}
          </h2>
          <button
            type="button"
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {state.error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded p-3 mb-4 text-sm text-red-300">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {!isCreating && space && (
            <input type="hidden" name="id" value={space.id} />
          )}
          {isCreating && (
            <input type="hidden" name="id_parking" value={parkingId} />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Espacio
            </label>
            <input
              type="text"
              name="name"
              defaultValue={space?.name ?? ""}
              placeholder="Ej: A-01"
              required
              className="w-full px-3 py-2 rounded bg-slate-800 border border-white/[0.07] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de Vehículo
            </label>
            <select
              name="id_typev"
              defaultValue={space?.id_typev ?? ""}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-white/[0.07] text-white focus:outline-none focus:border-blue-500"
            >
              {vehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bookable"
              name="bookable"
              defaultChecked={space?.bookable ?? false}
              className="rounded w-4 h-4 bg-slate-800 border-white/[0.07] text-blue-500 cursor-pointer"
            />
            <label
              htmlFor="bookable"
              className="text-sm font-medium text-slate-300 cursor-pointer"
            >
              ¿Es reservable?
            </label>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
