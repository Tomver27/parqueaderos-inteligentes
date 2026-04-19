import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/plates — recibe la placa detectada por la cámara (via bridge.js)
// Body: { plate: string }
// Busca una reserva vigente para esa placa y la marca como taken = true
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { plate } = body as { plate?: string };

  if (typeof plate !== "string" || plate.trim().length === 0) {
    return NextResponse.json(
      { error: "Se requiere plate (string)" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Find vehicle(s) by plate
  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id")
    .eq("plate", plate.trim().toUpperCase());

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json(
      { message: "Vehículo no registrado", plate },
      { status: 200 },
    );
  }

  const vehicleIds = vehicles.map((v) => v.id);
  const now = new Date();

  // Window: 30 minutes before reservation date through expires_at
  // i.e. date - 30min <= now <= expires_at  AND  taken = false
  const thirtyMinMs = 30 * 60 * 1000;

  // Get non-taken, non-expired reservations for these vehicles
  const { data: reservations } = await admin
    .from("Reservations")
    .select("id, date, expires_at, id_space, id_car")
    .in("id_car", vehicleIds)
    .eq("taken", false)
    .order("date", { ascending: true });

  if (!reservations || reservations.length === 0) {
    return NextResponse.json(
      { message: "Sin reservas pendientes para esta placa", plate },
      { status: 200 },
    );
  }

  // Find the first reservation that matches the time window
  let matched = null;
  for (const r of reservations) {
    const reservationDate = new Date(r.date);
    const expiresAt = r.expires_at ? new Date(r.expires_at) : null;

    const windowStart = new Date(reservationDate.getTime() - thirtyMinMs);
    const windowEnd = expiresAt ?? reservationDate;

    if (now >= windowStart && now <= windowEnd) {
      matched = r;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json(
      { message: "No hay reserva vigente en la ventana horaria actual", plate },
      { status: 200 },
    );
  }

  // Mark reservation as taken
  const { error } = await admin
    .from("Reservations")
    .update({ taken: true })
    .eq("id", matched.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Reserva marcada como tomada",
    plate,
    reservation_id: matched.id,
    space_id: matched.id_space,
  });
}
