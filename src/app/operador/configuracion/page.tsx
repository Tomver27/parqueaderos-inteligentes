import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";

async function getOperadorConfig(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return null;

  const { data: assignments } = await admin
    .from("ParkingOperators")
    .select("id_parking")
    .eq("id_user", user.id);

  const parkingIds = assignments?.map((a) => a.id_parking) ?? [];
  if (parkingIds.length === 0) return null;

  const { data: params } = await admin
    .from("Parameters")
    .select("*, Parkings ( name )")
    .in("id_parking", parkingIds)
    .limit(1)
    .single();

  return params;
}

export default async function OperadorConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const config = user?.email ? await getOperadorConfig(user.email) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Configuración</h1>
      <p className="text-slate-400 text-sm mb-6">
        Parámetros operativos del parqueadero
      </p>

      {config ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-6 max-w-lg">
          <h3 className="font-semibold mb-4">
            {(config as any).Parkings?.name ?? "Parqueadero"}
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Expiración de reserva</span>
              <span>{config.expires_reservation} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Límite de reserva</span>
              <span>{config.deadline_reservation} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Costo de reserva</span>
              <span>${Number(config.cost_reservation).toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tarifa</span>
              <span>${Number(config.fee).toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <Settings size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">Sin configuración asignada</p>
        </div>
      )}
    </div>
  );
}
