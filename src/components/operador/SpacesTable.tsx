"use client";

import EditSpaceForm from "./EditSpaceForm";
import DeleteSpaceButton from "./DeleteSpaceButton";
import { ParkingSquare } from "lucide-react";

interface Space {
  id: number;
  name: string;
  bookable: boolean;
  id_typev: number | null;
  id_parking: number;
  occupied: boolean;
  TypeVehicles?: { name: string } | null;
  Parkings?: { name: string } | null;
}

interface VehicleType {
  id: number;
  name: string;
}

interface SpacesTableProps {
  spaces: Space[];
  vehicleTypes: VehicleType[];
  parkingId: number;
}

export default function SpacesTable({
  spaces,
  vehicleTypes,
  parkingId,
}: SpacesTableProps) {
  if (spaces.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
        <ParkingSquare size={32} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">Sin espacios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.07]">
            <th className="text-left py-3 px-4 font-semibold text-slate-300">
              Nombre
            </th>
            <th className="text-left py-3 px-4 font-semibold text-slate-300">
              Tipo de Vehículo
            </th>
            <th className="text-left py-3 px-4 font-semibold text-slate-300">
              Reservable
            </th>
            <th className="text-left py-3 px-4 font-semibold text-slate-300">
              Estado
            </th>
            <th className="text-right py-3 px-4 font-semibold text-slate-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {spaces.map((space) => (
            <tr
              key={space.id}
              className="border-b border-white/[0.07] hover:bg-white/[0.01] transition"
            >
              <td className="py-3 px-4 text-white font-medium">{space.name}</td>
              <td className="py-3 px-4 text-slate-400">
                {space.TypeVehicles?.name ?? "General"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    space.bookable
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {space.bookable ? "Sí" : "No"}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    space.occupied
                      ? "bg-red-500/15 text-red-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  {space.occupied ? "Ocupado" : "Disponible"}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <EditSpaceForm
                    space={space}
                    vehicleTypes={vehicleTypes}
                    parkingId={parkingId}
                  />
                  <DeleteSpaceButton spaceId={space.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
