import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface PlatePayload {
  plate: string;
}

interface SensorPayload {
  id_space: number;
  occupied: boolean;
}

interface InfrarojoPayload {
  device: string;
  estado: "LIBRE" | "OCUPADO";
  valor_adc: number;
}

type WebhookPayload = PlatePayload | SensorPayload | InfrarojoPayload;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlatePayload(body: unknown): body is PlatePayload {
  return (
    isPlainObject(body) &&
    typeof body.plate === "string" &&
    body.plate.trim().length > 0
  );
}

function isSensorPayload(body: unknown): body is SensorPayload {
  return (
    isPlainObject(body) &&
    typeof body.id_space === "number" &&
    typeof body.occupied === "boolean"
  );
}

function isInfrarojoPayload(body: unknown): body is InfrarojoPayload {
  return (
    isPlainObject(body) &&
    typeof body.device === "string" &&
    (body.estado === "LIBRE" || body.estado === "OCUPADO") &&
    typeof body.valor_adc === "number"
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (isSensorPayload(body)) {
    return await handleSensorPayload(body);
  }

  if (isPlatePayload(body)) {
    return await handlePlatePayload(body);
  }

  if (isInfrarojoPayload(body)) {
    return await handleInfrarojoPayload(body);
  }

  return NextResponse.json(
    {
      error:
        "Payload no reconocido. Envía { id_space, occupied }, { plate } o { device, estado, valor_adc }",
    },
    { status: 400 },
  );
}

export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("SensorInfrarrojo")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sensor: data ?? null });
}

async function handlePlatePayload(payload: PlatePayload) {
  const admin = createAdminClient();
  const plate = payload.plate.trim().toUpperCase();

  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id")
    .eq("plate", plate);

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ message: "Vehículo no registrado", plate }, { status: 200 });
  }

  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const now = new Date();
  const thirtyMinMs = 30 * 60 * 1000;

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

  let matchedReservation = null;
  for (const reservation of reservations) {
    const reservationDate = new Date(reservation.date);
    const expiresAt = reservation.expires_at ? new Date(reservation.expires_at) : null;
    const windowStart = new Date(reservationDate.getTime() - thirtyMinMs);
    const windowEnd = expiresAt ?? reservationDate;

    if (now >= windowStart && now <= windowEnd) {
      matchedReservation = reservation;
      break;
    }
  }

  if (!matchedReservation) {
    return NextResponse.json(
      { message: "No hay reserva vigente en la ventana horaria actual", plate },
      { status: 200 },
    );
  }

  const { error } = await admin
    .from("Reservations")
    .update({ taken: true })
    .eq("id", matchedReservation.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Reserva marcada como tomada",
    plate,
    reservation_id: matchedReservation.id,
    space_id: matchedReservation.id_space,
  });
}

async function handleSensorPayload(payload: SensorPayload) {
  const admin = createAdminClient();
  const { id_space, occupied } = payload;

  const { data: space } = await admin
    .from("Spaces")
    .select("id")
    .eq("id", id_space)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  if (occupied) {
    const { data: activeOccupation } = await admin
      .from("Occupations")
      .select("id")
      .eq("id_space", id_space)
      .is("end_date", null)
      .single();

    if (activeOccupation) {
      return NextResponse.json({ message: "El espacio ya está ocupado" }, { status: 200 });
    }

    const { error } = await admin.from("Occupations").insert({
      id_space,
      start_date: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Ocupación registrada" }, { status: 201 });
  }

  const { data: activeOccupation } = await admin
    .from("Occupations")
    .select("id")
    .eq("id_space", id_space)
    .is("end_date", null)
    .single();

  if (!activeOccupation) {
    return NextResponse.json(
      { message: "No hay ocupación activa para este espacio" },
      { status: 200 },
    );
  }

  const { error } = await admin
    .from("Occupations")
    .update({ end_date: new Date().toISOString() })
    .eq("id", activeOccupation.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Ocupación finalizada" }, { status: 200 });
}

async function handleInfrarojoPayload(payload: InfrarojoPayload) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("SensorInfrarrojo")
    .upsert(
      {
        device: payload.device,
        estado: payload.estado,
        valor_adc: payload.valor_adc,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Estado del sensor actualizado", sensor: data });
}
