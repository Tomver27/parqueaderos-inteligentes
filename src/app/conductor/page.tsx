import { createAdminClient, createClient } from "@/lib/supabase/server";
import { cleanExpiredPendingPayments } from "@/lib/actions/conductor";
import { CalendarCheck, CarFront, CreditCard, MapPin, Clock } from "lucide-react";
import { todayCO, tomorrowCO, fmtDateTimeCO, dbTs } from "@/lib/dates";
import OccupationCountdown, { type TimerEntry } from "@/components/conductor/OccupationCountdown";

async function getConductorStats(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id, first_name")
    .eq("email", email)
    .single();
  if (!user) return null;

  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id")
    .eq("id_user", user.id);

  const vehicleIds = vehicles?.map((v) => v.id) ?? [];

  let reservasCount = 0;
  let pagosCount = 0;

  if (vehicleIds.length > 0) {
    await cleanExpiredPendingPayments(admin);

    const [reservas, pagos] = await Promise.all([
      admin
        .from("Payments")
        .select("id", { count: "exact", head: true })
        .in("id_car", vehicleIds)
        .in("status", ["exitoso", "Pagado"]),
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

async function getTodayReservations(email: string) {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return [];

  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id, plate")
    .eq("id_user", user.id);

  const vehicleIds = vehicles?.map((v) => v.id) ?? [];
  if (vehicleIds.length === 0) return [];

  const today = todayCO();
  const tomorrow = tomorrowCO();

  const { data } = await admin
    .from("Reservations")
    .select(`
      id, date, expires_at, taken, IS_PAID,
      Spaces ( name, Parkings ( name, address, latitude, longitude ) ),
      Vehicle ( plate )
    `)
    .in("id_car", vehicleIds)
    .gte("date", today)
    .lt("date", tomorrow)
    .order("date", { ascending: true });

  return data ?? [];
}

async function getActiveTimers(email: string): Promise<TimerEntry[]> {
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

  const today = todayCO();
  const tomorrow = tomorrowCO();

  // Reservations taken today with confirmed payment
  const { data: reservations } = await admin
    .from("Reservations")
    .select("id, id_space, Spaces ( name, id_parking, Parkings ( name ) )")
    .in("id_car", vehicleIds)
    .eq("taken", true)
    .eq("IS_PAID", true)
    .gte("date", today)
    .lt("date", tomorrow);

  if (!reservations || reservations.length === 0) return [];

  const spaceIds = reservations.map((r) => r.id_space);
  const reservationIds = reservations.map((r) => r.id);

  const [occupations, payments, allParams] = await Promise.all([
    // Active occupation on each space (sensor detected the car)
    admin
      .from("Occupations")
      .select("id_space, start_date")
      .in("id_space", spaceIds)
      .is("end_date", null),
    // Amount the conductor paid
    admin
      .from("Payments")
      .select("id_reservation, amount")
      .in("id_reservation", reservationIds)
      .in("status", ["exitoso", "Pagado"]),
    // Fee per minute for each parking
    admin
      .from("Parameters")
      .select("id_parking, fee")
      .in(
        "id_parking",
        [...new Set(reservations.map((r) => (r as any).Spaces?.id_parking).filter(Boolean))],
      ),
  ]);

  const result: TimerEntry[] = [];

  for (const r of reservations) {
    const space = (r as any).Spaces;
    const occupation = occupations.data?.find((o) => o.id_space === r.id_space);
    if (!occupation) continue;

    const payment = payments.data?.find((p) => p.id_reservation === r.id);
    if (!payment) continue;

    const param = allParams.data?.find((p) => p.id_parking === space?.id_parking);
    if (!param || Number(param.fee) === 0) continue;

    const totalMinutes = Number(payment.amount) / Number(param.fee);

    result.push({
      reservationId: r.id,
      spaceName: space?.name ?? `#${r.id_space}`,
      parkingName: space?.Parkings?.name ?? "—",
      occupationStart: occupation.start_date,
      totalMinutes,
    });
  }

  return result;
}

export default async function ConductorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <p className="text-slate-400">No se pudo obtener la sesión.</p>;
  }

  const [stats, todayReservations, activeTimers] = await Promise.all([
    getConductorStats(user.email),
    getTodayReservations(user.email),
    getActiveTimers(user.email),
  ]);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      <OccupationCountdown timers={activeTimers} />

      {/* Today's reservations */}
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck size={18} className="text-slate-400" />
        <h2 className="text-lg font-semibold">Mis reservas de hoy</h2>
      </div>

      {todayReservations.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-8 text-center">
          <CalendarCheck size={28} className="mx-auto mb-2 text-slate-600" />
          <p className="text-slate-400 text-sm">No tienes reservas para hoy</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(todayReservations as any[]).map((r) => {
            const expiresAt = r.expires_at ? dbTs(r.expires_at) : null;
            const expired = expiresAt ? expiresAt < new Date() : false;
            const taken = !!r.taken;
            const isPaid = !!r.IS_PAID;

            let statusLabel: string;
            let statusColor: string;
            if (taken) {
              statusLabel = "Tomada";
              statusColor = "bg-blue-500/15 text-blue-400 border-blue-500/20";
            } else if (expired) {
              statusLabel = "Expirada";
              statusColor = "bg-red-500/15 text-red-400 border-red-500/20";
            } else {
              statusLabel = "Vigente";
              statusColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
            }

            return (
              <div
                key={r.id}
                className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">
                        {[
                          (r.Spaces as any)?.Parkings?.name,
                          r.Spaces?.name,
                        ]
                          .filter(Boolean)
                          .join(" · ") || `Espacio #${r.id}`}
                      </span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${isPaid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {isPaid ? "Pagado" : "Pago pendiente"}
                      </span>
                    </div>

                    {(() => {
                      const p = (r.Spaces as any)?.Parkings;
                      const mapsUrl = p?.latitude && p?.longitude
                        ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}`
                        : null;
                      return (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-500 flex-shrink-0" />
                          {mapsUrl ? (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-400 hover:text-blue-400 hover:underline transition-colors"
                            >
                              {p?.address ?? "Ver ubicación"}
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">
                              {p?.address ?? "—"}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Entrada: {fmtDateTimeCO(dbTs(r.date))}
                      </span>
                      {expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Límite: {fmtDateTimeCO(expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Vehículo</p>
                    <p className="font-mono font-bold text-slate-300">
                      {r.Vehicle?.plate ?? "—"}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Reserva #{r.id}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
