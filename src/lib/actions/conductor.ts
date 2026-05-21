"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { CreateReservaState, AddVehicleState } from "@/types";

const ROLE_CONDUCTOR = 3;
const PENDING_PAYMENT_TIMEOUT_MINUTES = 10;

export async function cleanExpiredPendingPayments(admin: ReturnType<typeof createAdminClient>) {
  // Step 1: mark newly expired pending payments as "rechazado".
  // The Payments table has no created_at column; the creation timestamp (UTC ms,
  // always 13 digits) is the last 13 chars of idempotency_key: `PARKING{id}{Date.now()}`.
  const thresholdMs = Date.now() - PENDING_PAYMENT_TIMEOUT_MINUTES * 60_000;

  const { data: pending } = await admin
    .from("Payments")
    .select("id, id_reservation, idempotency_key")
    .eq("status", "pendiente");

  const stalePayments = (pending ?? []).filter((p) => {
    const ts = Number(p.idempotency_key?.slice(-13));
    return !isNaN(ts) && ts > 1_000_000_000_000 && ts < thresholdMs;
  });

  if (stalePayments.length > 0) {
    const ids = stalePayments.map((p) => p.id).filter(Boolean);
    await admin.from("Payments").update({ status: "rechazado" }).in("id", ids);
  }

  // Step 2: delete reservations still linked to rejected payments.
  // Clear the FK reference first to avoid constraint violations, then delete.
  const { data: rejected } = await admin
    .from("Payments")
    .select("id_reservation")
    .eq("status", "rechazado")
    .not("id_reservation", "is", null);

  const reservationIds = (rejected ?? [])
    .map((p) => p.id_reservation)
    .filter((id): id is number => typeof id === "number");

  if (reservationIds.length > 0) {
    // Null out the FK so the reservation row can be deleted without constraint errors
    await admin
      .from("Payments")
      .update({ id_reservation: null })
      .eq("status", "rechazado")
      .not("id_reservation", "is", null);
    await admin.from("Reservations").delete().in("id", reservationIds);
  }

  return stalePayments.length;
}

export async function createReservaConductor(
  _prev: CreateReservaState,
  formData: FormData,
): Promise<CreateReservaState> {
  const idParking = Number(formData.get("id_parking"));
  const idCar = Number(formData.get("id_car"));
  const dateStr = String(formData.get("date") ?? "").trim();

  if (!idParking || !idCar || !dateStr) {
    return { error: "Todos los campos son obligatorios." };
  }

  const reservationDate = new Date(
    dateStr.includes("+") || dateStr.includes("Z") ? dateStr : dateStr + "-05:00",
  );
  if (isNaN(reservationDate.getTime())) {
    return { error: "Fecha inválida." };
  }

  // Auth check — must be a conductor
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Debes iniciar sesión para reservar." };

  const admin = createAdminClient();

  const { data: dbUser } = await admin
    .from("Users")
    .select("id, id_role, first_name, last_name")
    .eq("email", user.email)
    .single();
  if (!dbUser) return { error: "Usuario no encontrado." };
  if (dbUser.id_role !== ROLE_CONDUCTOR) {
    return { error: "Solo los conductores pueden realizar reservas." };
  }

  // Verify the vehicle belongs to this conductor
  const { data: vehicle } = await admin
    .from("Vehicle")
    .select("id, plate")
    .eq("id", idCar)
    .eq("id_user", dbUser.id)
    .single();
  if (!vehicle) return { error: "Vehículo no encontrado o no te pertenece." };

  const { data: parking } = await admin
    .from("Parkings")
    .select("name")
    .eq("id", idParking)
    .single();

  // Get parking parameters
  const { data: params } = await admin
    .from("Parameters")
    .select("cost_reservation, expires_reservation, deadline_reservation")
    .eq("id_parking", idParking)
    .single();
  if (!params) return { error: "Parámetros no configurados para este parqueadero." };

  // Check that the reservation is at least deadline_reservation minutes in the future
  const now = new Date();
  const minReservationDate = new Date(now.getTime() + Number(params.deadline_reservation) * 60_000);
  if (reservationDate < minReservationDate) {
    return {
      error: `Debes reservar con al menos ${params.deadline_reservation} minutos de anticipación.`,
    };
  }

  await cleanExpiredPendingPayments(admin);

  const toUTC = (s: string) =>
    new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z");

  const requestedDay = reservationDate.toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });

  // Find all bookable spaces for this parking
  const { data: allSpaces } = await admin
    .from("Spaces")
    .select("id, name")
    .eq("id_parking", idParking)
    .eq("bookable", true);

  if (!allSpaces || allSpaces.length === 0) {
    return { error: "No hay espacios reservables en este parqueadero." };
  }

  const spaceIds = allSpaces.map((s) => s.id);

  // Find currently occupied spaces
  const { data: occupiedRows } = await admin
    .from("Occupations")
    .select("id_space")
    .in("id_space", spaceIds)
    .is("end_date", null);
  const occupiedIds = new Set((occupiedRows ?? []).map((o) => o.id_space));

  // Find spaces already reserved for the requested day
  const { data: existingReservations } = await admin
    .from("Reservations")
    .select("id, id_space, date, expires_at, taken")
    .in("id_space", spaceIds)
    .eq("taken", false)
    .gte("expires_at", now.toISOString())
    .order("date", { ascending: false });

  const existingIds = (existingReservations ?? []).map((r) => r.id);
  const rejectedResIds = new Set<number>();
  if (existingIds.length > 0) {
    const { data: relatedPayments } = await admin
      .from("Payments")
      .select("id_reservation, status")
      .in("id_reservation", existingIds);
    for (const p of relatedPayments ?? []) {
      if (p.status === "rechazado" && typeof p.id_reservation === "number") {
        rejectedResIds.add(p.id_reservation);
      }
    }
  }

  const reservedSpaceIds = new Set<number>();
  for (const r of existingReservations ?? []) {
    if (rejectedResIds.has(r.id)) continue;
    const rDay = toUTC(r.date).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
    if (requestedDay === rDay) reservedSpaceIds.add(r.id_space);
  }

  // Pick a random available space
  const availableSpaces = allSpaces.filter(
    (s) => !occupiedIds.has(s.id) && !reservedSpaceIds.has(s.id),
  );
  if (availableSpaces.length === 0) {
    return { error: "No hay espacios disponibles para la fecha y hora seleccionadas." };
  }
  const space = availableSpaces[Math.floor(Math.random() * availableSpaces.length)];
  const idSpace = space.id;

  const expiresAt = new Date(
    reservationDate.getTime() + Number(params.expires_reservation) * 60_000,
  );

  // Insert reservation
  const { data: newReservation, error: resError } = await admin
    .from("Reservations")
    .insert({
      date: reservationDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      id_space: idSpace,
      id_car: idCar,
    })
    .select("id")
    .single();

  if (resError || !newReservation) {
    return { error: resError?.message ?? "Error al crear la reserva." };
  }

  const referenceCode = `PARKING${newReservation.id}${Date.now()}`;
  const buyerName = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") || user.email;
  const description = `Reserva ${parking?.name ?? "parqueadero"} - ${space.name}`;

  // Insert payment in pending state before redirecting al checkout
  const { error: payError } = await admin.from("Payments").insert({
    amount: Number(params.cost_reservation),
    currency: "COP",
    idempotency_key: referenceCode,
    status: "pendiente",
    id_car: idCar,
    id_reservation: newReservation.id,
  });

  if (payError) {
    await admin.from("Reservations").delete().eq("id", newReservation.id);
    return { error: `Error al registrar el pago: ${payError.message}` };
  }

  revalidatePath("/conductor/reservas");
  revalidatePath("/reservar");
  return {
    success: true,
    reservationId: newReservation.id,
    referenceCode,
    amount: Number(params.cost_reservation),
    description,
    vehiclePlate: vehicle.plate,
    parkingName: parking?.name ?? "",
    reservationDate: reservationDate.toISOString(),
    buyerEmail: user.email,
    buyerName,
  };
}

export async function addVehicle(
  _prev: AddVehicleState,
  formData: FormData,
): Promise<AddVehicleState> {
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const idTypev = Number(formData.get("id_typev"));

  if (!plate || !idTypev) {
    return { error: "La placa y el tipo de vehículo son obligatorios." };
  }

  // Validate plate format: 3 letters + 3 alphanumeric chars (Colombia)
  if (!/^[A-Z]{3}[A-Z0-9]{3}$/.test(plate)) {
    return { error: "Formato de placa inválido. Ejemplo: ABC123 o ABC12D." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "No autenticado." };

  const admin = createAdminClient();

  const { data: dbUser } = await admin
    .from("Users")
    .select("id, id_role")
    .eq("email", user.email)
    .single();
  if (!dbUser) return { error: "Usuario no encontrado." };
  if (dbUser.id_role !== ROLE_CONDUCTOR) {
    return { error: "Solo los conductores pueden registrar vehículos." };
  }

  // Check plate is not already registered to this user
  const { data: existing } = await admin
    .from("Vehicle")
    .select("id")
    .eq("plate", plate)
    .eq("id_user", dbUser.id)
    .maybeSingle();
  if (existing) return { error: `Ya tienes un vehículo registrado con la placa ${plate}.` };

  const { data: newVehicle, error: insError } = await admin
    .from("Vehicle")
    .insert({ plate, id_typev: idTypev, id_user: dbUser.id })
    .select("id")
    .single();

  if (insError || !newVehicle) {
    return { error: insError?.message ?? "Error al registrar el vehículo." };
  }

  revalidatePath("/conductor/vehiculos");
  return { success: true, vehicleId: newVehicle.id };
}
