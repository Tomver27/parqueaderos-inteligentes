import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import EditParametersForm from "@/components/operador/EditParametersForm";

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
    .select("id_parking, expires_reservation, deadline_reservation, cost_reservation, fee, Parkings ( name )")
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
        <div>
          <h3 className="font-semibold mb-4">
            {(config as any).Parkings?.name ?? "Parqueadero"}
          </h3>
          <EditParametersForm params={config} />
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
