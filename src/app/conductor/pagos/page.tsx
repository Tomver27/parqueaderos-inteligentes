import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CreditCard } from "lucide-react";

async function getConductorPayments(email: string) {
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

  const { data: pagos } = await admin
    .from("Payments")
    .select("id, amount, currency, status, Vehicle ( plate ), Reservations ( date, Spaces ( Parkings ( name ) ) )")
    .in("id_car", vehicleIds)
    .order("id", { ascending: false })
    .limit(50);

  return pagos ?? [];
}

export default async function ConductorPagosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pagos = user?.email ? await getConductorPayments(user.email) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mis pagos</h1>
      <p className="text-slate-400 text-sm mb-6">
        Historial de transacciones
      </p>

      {pagos.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Monto</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Vehículo</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Parqueadero</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p: any) => (
                <tr key={p.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">
                    {Number(p.amount).toLocaleString("es-CO")} {p.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === "exitoso" ? "bg-emerald-500/15 text-emerald-400" :
                      p.status === "pendiente" ? "bg-amber-500/15 text-amber-400" :
                      "bg-red-500/15 text-red-400"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.Vehicle?.plate ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {p.Reservations?.Spaces?.Parkings?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <CreditCard size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No tienes pagos registrados</p>
        </div>
      )}
    </div>
  );
}
