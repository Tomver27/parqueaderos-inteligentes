import { createAdminClient } from "@/lib/supabase/server";
import { todayCO, tomorrowCO } from "@/lib/dates";
import {
  Building2,
  Users,
  UserCog,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";

async function getAdminStats() {
  const admin = createAdminClient();

  const today = todayCO();
  const tomorrow = tomorrowCO();

  const [parkings, conductores, operadores, reservas, ocupados] =
    await Promise.all([
      admin.from("Parkings").select("id", { count: "exact", head: true }),
      admin
        .from("Users")
        .select("id", { count: "exact", head: true })
        .eq("id_role", 3),
      admin
        .from("Users")
        .select("id", { count: "exact", head: true })
        .eq("id_role", 2),
      admin
        .from("Reservations")
        .select("id", { count: "exact", head: true })
        .gte("date", today)
        .lt("date", tomorrow),
      admin
        .from("Occupations")
        .select("id", { count: "exact", head: true })
        .is("end_date", null),
    ]);

  return {
    totalParkings: parkings.count ?? 0,
    totalConductores: conductores.count ?? 0,
    totalOperadores: operadores.count ?? 0,
    reservasHoy: reservas.count ?? 0,
    ocupadosAhora: ocupados.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Parqueaderos",
      value: stats.totalParkings,
      icon: Building2,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Conductores",
      value: stats.totalConductores,
      icon: Users,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Operadores",
      value: stats.totalOperadores,
      icon: UserCog,
      color: "from-violet-500 to-purple-500",
    },
    {
      label: "Reservas hoy",
      value: stats.reservasHoy,
      icon: CalendarCheck,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Espacios ocupados",
      value: stats.ocupadosAhora,
      icon: TrendingUp,
      color: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">
        Resumen general de la plataforma
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
