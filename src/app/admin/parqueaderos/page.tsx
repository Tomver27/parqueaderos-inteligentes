import { createAdminClient } from "@/lib/supabase/server";
import type { Parking } from "@/types";
import ParkingMapWrapper from "@/components/map/ParkingMapWrapper";
import { Building2 } from "lucide-react";

export default async function AdminParqueaderosPage() {
  const admin = createAdminClient();
  const { data: parkings } = await admin
    .from("Parkings")
    .select("id, name, latitude, longitude, address")
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
      </div>

      {parkings && parkings.length > 0 && (
        <div className="h-[350px] rounded-xl overflow-hidden border border-white/[0.07] mb-6">
          <ParkingMapWrapper parkings={parkings} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parkings?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <h3 className="font-semibold text-sm">{p.name}</h3>
            </div>
            <p className="text-xs text-slate-400">{p.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
