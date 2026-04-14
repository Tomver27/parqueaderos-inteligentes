import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CarFront } from "lucide-react";

async function getConductorVehicles(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return [];

  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id, plate, id_typev, TypeVehicles ( name )")
    .eq("id_user", user.id)
    .order("plate");

  return vehicles ?? [];
}

export default async function ConductorVehiculosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const vehicles = user?.email ? await getConductorVehicles(user.email) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mis vehículos</h1>
      <p className="text-slate-400 text-sm mb-6">
        Gestiona los vehículos asociados a tu cuenta
      </p>

      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v: any) => (
            <div
              key={v.id}
              className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <CarFront size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">{v.plate}</p>
                  <p className="text-xs text-slate-500">
                    {v.TypeVehicles?.name ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <CarFront size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No tienes vehículos registrados</p>
        </div>
      )}
    </div>
  );
}
