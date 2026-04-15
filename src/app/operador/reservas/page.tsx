import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CalendarCheck } from "lucide-react";
import CreateReservaForm from "@/components/operador/CreateReservaForm";

async function getOperadorParkingIds(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return [];

  const { data: assignments } = await admin
    .from("ParkingOperators")
    .select("id_parking")
    .eq("id_user", user.id);

  return assignments?.map((a) => a.id_parking) ?? [];
}

async function getOperadorReservas(parkingIds: number[]) {
  if (parkingIds.length === 0) return [];
  const admin = createAdminClient();

  const { data: reservas } = await admin
    .from("Reservations")
    .select(
      "id, date, expires_at, Spaces!inner ( name, id_parking ), Vehicle ( plate )",
    )
    .in("Spaces.id_parking", parkingIds)
    .order("date", { ascending: false })
    .limit(50);

  return reservas ?? [];
}

async function getBookableSpaces(parkingIds: number[]) {
  if (parkingIds.length === 0) return [];
  const admin = createAdminClient();

  const { data } = await admin
    .from("Spaces")
    .select("id, name")
    .in("id_parking", parkingIds)
    .eq("bookable", true)
    .order("name");

  return data ?? [];
}

async function getCostReservation(parkingIds: number[]) {
  if (parkingIds.length === 0) return 0;
  const admin = createAdminClient();

  const { data } = await admin
    .from("Parameters")
    .select("cost_reservation")
    .in("id_parking", parkingIds)
    .limit(1)
    .single();

  return Number(data?.cost_reservation ?? 0);
}

export default async function OperadorReservasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const parkingIds = user?.email
    ? await getOperadorParkingIds(user.email)
    : [];

  const [reservas, spaces, costReservation] = await Promise.all([
    getOperadorReservas(parkingIds),
    getBookableSpaces(parkingIds),
    getCostReservation(parkingIds),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Reservas</h1>
      <p className="text-slate-400 text-sm mb-6">
        Reservas de tu parqueadero
      </p>

      <CreateReservaForm spaces={spaces} costReservation={costReservation} />

      {reservas.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">ID</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Expira</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Espacio</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Vehículo</th>
                <th className="text-center px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r: any) => {
                const expiresAt = r.expires_at
                  ? new Date(r.expires_at)
                  : null;
                const expired = expiresAt ? expiresAt < new Date() : false;

                return (
                  <tr
                    key={r.id}
                    className="border-b border-white/[0.05] hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      #{r.id}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(r.date).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {expiresAt
                        ? expiresAt.toLocaleString("es-CO")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.Spaces?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.Vehicle?.plate ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          expired
                            ? "bg-red-500/15 text-red-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {expired ? "Expirada" : "Vigente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center mt-6">
          <CalendarCheck size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">Sin reservas</p>
        </div>
      )}
    </div>
  );
}
