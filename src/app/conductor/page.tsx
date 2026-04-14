import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CalendarCheck, CarFront, CreditCard } from "lucide-react";

async function getConductorStats(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id, first_name")
    .eq("email", email)
    .single();
  if (!user) return null;

  // Get vehicles owned by this user
  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id")
    .eq("id_user", user.id);

  const vehicleIds = vehicles?.map((v) => v.id) ?? [];

  let reservasCount = 0;
  let pagosCount = 0;

  if (vehicleIds.length > 0) {
    const [reservas, pagos] = await Promise.all([
      admin
        .from("Reservations")
        .select("id", { count: "exact", head: true })
        .in("id_car", vehicleIds),
      admin
        .from("Payments")
        .select("id", { count: "exact", head: true })
        .in("id_car", vehicleIds),
    ]);
    reservasCount = reservas.count ?? 0;
    pagosCount = pagos.count ?? 0;
  }

  return {
    firstName: user.first_name,
    totalVehiculos: vehicleIds.length,
    totalReservas: reservasCount,
    totalPagos: pagosCount,
  };
}

export default async function ConductorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <p className="text-slate-400">No se pudo obtener la sesión.</p>;
  }

  const stats = await getConductorStats(user.email);
  if (!stats) {
    return <p className="text-slate-400">Usuario no encontrado.</p>;
  }

  const cards = [
    {
      label: "Mis vehículos",
      value: stats.totalVehiculos,
      icon: CarFront,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Mis reservas",
      value: stats.totalReservas,
      icon: CalendarCheck,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Mis pagos",
      value: stats.totalPagos,
      icon: CreditCard,
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">
        Hola, {stats.firstName} 👋
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        Aquí puedes ver un resumen de tu actividad
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
