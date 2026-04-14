import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CalendarCheck } from "lucide-react";

async function getConductorReservas(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return [];

  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id")
    .eq("id_user", user.id);

  const vehicleIds = vehicles?.map((v) => v.id) ?? [];
  if (vehicleIds.length === 0) return [];

  const { data: reservas } = await admin
    .from("Reservations")
    .select("id, date, expires_at, Spaces ( name, Parkings ( name ) ), Vehicle ( plate )")
    .in("id_car", vehicleIds)
    .order("date", { ascending: false })
    .limit(50);

  return reservas ?? [];
}

export default async function ConductorReservasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reservas = user?.email ? await getConductorReservas(user.email) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mis reservas</h1>
      <p className="text-slate-400 text-sm mb-6">
        Historial de tus reservas de parqueadero
      </p>

      {reservas.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Parqueadero</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Espacio</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Vehículo</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r: any) => (
                <tr key={r.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(r.date).toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3">{r.Spaces?.Parkings?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{r.Spaces?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{r.Vehicle?.plate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <CalendarCheck size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No tienes reservas aún</p>
        </div>
      )}
    </div>
  );
}
