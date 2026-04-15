import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ParkingSquare, CalendarCheck, TrendingUp, Clock, Settings } from "lucide-react";
import EditParametersForm from "@/components/operador/EditParametersForm";

async function getOperadorStats(email: string) {
  const admin = createAdminClient();

  // Get user and their assigned parkings
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
  if (parkingIds.length === 0)
    return { parkingName: null, espaciosTotal: 0, ocupados: 0, reservasHoy: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [parking, espacios, ocupados, reservas] = await Promise.all([
    admin.from("Parkings").select("name").in("id", parkingIds).limit(1).single(),
    admin
      .from("Spaces")
      .select("id", { count: "exact", head: true })
      .in("id_parking", parkingIds),
    admin
      .from("Occupations")
      .select("id, Spaces!inner(id_parking)", { count: "exact", head: true })
      .is("end_date", null)
      .in("Spaces.id_parking", parkingIds),
    admin
      .from("Reservations")
      .select("id, Spaces!inner(id_parking)", { count: "exact", head: true })
      .gte("date", today)
      .lt("date", tomorrow)
      .in("Spaces.id_parking", parkingIds),
  ]);

  return {
    parkingName: parking.data?.name ?? null,
    espaciosTotal: espacios.count ?? 0,
    ocupados: ocupados.count ?? 0,
    reservasHoy: reservas.count ?? 0,
  };
}

async function getOccupations(email: string) {
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

  const parkingIds = assignments?.map((a) => a.id_parking) ?? [];
  if (parkingIds.length === 0) return [];

  const { data: spaces } = await admin
    .from("Spaces")
    .select("id")
    .in("id_parking", parkingIds);

  const spaceIds = spaces?.map((s) => s.id) ?? [];
  if (spaceIds.length === 0) return [];

  const { data } = await admin
    .from("Occupations")
    .select("id, start_date, end_date, id_space, Spaces ( name )")
    .in("id_space", spaceIds)
    .order("start_date", { ascending: false })
    .limit(50);

  return data ?? [];
}

async function getParameters(email: string) {
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

  const { data } = await admin
    .from("Parameters")
    .select("id_parking, expires_reservation, deadline_reservation, cost_reservation, fee")
    .in("id_parking", parkingIds)
    .limit(1)
    .single();

  return data;
}

export default async function OperadorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <p className="text-slate-400">No se pudo obtener la sesión.</p>;
  }

  const [stats, occupations, params] = await Promise.all([
    getOperadorStats(user.email),
    getOccupations(user.email),
    getParameters(user.email),
  ]);

  if (!stats) {
    return <p className="text-slate-400">Operador no encontrado.</p>;
  }

  const cards = [
    {
      label: "Espacios totales",
      value: stats.espaciosTotal,
      icon: ParkingSquare,
      color: "from-violet-500 to-purple-500",
    },
    {
      label: "Ocupados ahora",
      value: stats.ocupados,
      icon: TrendingUp,
      color: "from-rose-500 to-pink-500",
    },
    {
      label: "Reservas hoy",
      value: stats.reservasHoy,
      icon: CalendarCheck,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">
        {stats.parkingName
          ? `Parqueadero: ${stats.parkingName}`
          : "Sin parqueadero asignado"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {card.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${card.color}`}
                >
                  <Icon size={14} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Occupations history */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-slate-400" />
          <h2 className="text-lg font-semibold">Historial de ocupaciones</h2>
        </div>
        {occupations.length > 0 ? (
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Espacio</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Inicio</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Fin</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Duración</th>
                  <th className="text-center px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {occupations.map((o: any) => {
                  const start = new Date(o.start_date);
                  const end = o.end_date ? new Date(o.end_date) : null;
                  const diffMs = end
                    ? end.getTime() - start.getTime()
                    : Date.now() - start.getTime();
                  const minutes = Math.round(diffMs / 60_000);

                  const fmt = (d: Date) =>
                    d.toLocaleString("es-CO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                  return (
                    <tr key={o.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium">
                        {o.Spaces?.name ?? `#${o.id_space}`}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{fmt(start)}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {end ? fmt(end) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {minutes} min
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            end
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {end ? "Finalizada" : "En curso"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-8 text-center">
            <Clock size={28} className="mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400 text-sm">No hay ocupaciones registradas</p>
          </div>
        )}
      </div>

      {/* Parameters */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-slate-400" />
          <h2 className="text-lg font-semibold">Parámetros vigentes</h2>
        </div>
        {params ? (
          <EditParametersForm params={params} />
        ) : (
          <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-8 text-center">
            <Settings size={28} className="mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400 text-sm">Sin parámetros configurados</p>
          </div>
        )}
      </div>
    </div>
  );
}
