import { createAdminClient } from "@/lib/supabase/server";
import type { Parking } from "@/types";
import ParkingMapWrapper from "@/components/map/ParkingMapWrapper";
import { Building2 } from "lucide-react";
import ParkingForm from "@/components/admin/ParkingForm";
import DeleteParkingButton from "@/components/admin/DeleteParkingButton";

export default async function AdminParqueaderosPage() {
  const admin = createAdminClient();
  const { data: parkings } = await admin
    .from("Parkings")
    .select("id, name, latitude, longitude, address")
    .order("name")
    .returns<Parking[]>();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Parqueaderos</h1>
          <p className="text-slate-400 text-sm">
            {parkings?.length ?? 0} sede{(parkings?.length ?? 0) !== 1 ? "s" : ""} registrada{(parkings?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <ParkingForm />
      </div>

      {parkings && parkings.length > 0 && (
        <div className="isolate h-[350px] rounded-xl overflow-hidden border border-white/[0.07] mb-6">
          <ParkingMapWrapper parkings={parkings} />
        </div>
      )}

      {parkings && parkings.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Dirección</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Latitud</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Longitud</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parkings.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-white" />
                    </div>
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.address}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.latitude}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.longitude}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <ParkingForm parking={p} />
                      <DeleteParkingButton parkingId={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No hay parqueaderos registrados</p>
        </div>
      )}
    </div>
  );
}
