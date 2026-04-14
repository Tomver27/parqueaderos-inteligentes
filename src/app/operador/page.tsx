import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ParkingSquare, CalendarCheck, TrendingUp } from "lucide-react";

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

export default async function OperadorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <p className="text-slate-400">No se pudo obtener la sesión.</p>;
  }

  const stats = await getOperadorStats(user.email);

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
    </div>
  );
}
