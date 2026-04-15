"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { UpdateParamsState, CreateReservaState } from "@/types";

/* ------------------------------------------------------------------ */
/*  Crear reserva + pago                                               */
/* ------------------------------------------------------------------ */
export async function createReserva(
  _prev: CreateReservaState,
  formData: FormData,
): Promise<CreateReservaState> {
  const idSpace = Number(formData.get("id_space"));
  const idCar = Number(formData.get("id_car"));
  const currency = String(formData.get("currency") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "").trim();

  if (!idSpace || !idCar || !currency || !dateStr) {
    return { error: "Todos los campos son obligatorios." };
  }
  if (currency !== "COP" && currency !== "USD") {
    return { error: "La moneda debe ser COP o USD." };
  }

  const reservationDate = new Date(dateStr);
  if (isNaN(reservationDate.getTime())) {
    return { error: "Fecha inválida." };
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "No autenticado." };

  const admin = createAdminClient();

  const { data: dbUser } = await admin
    .from("Users")
    .select("id")
    .eq("email", user.email)
    .single();
  if (!dbUser) return { error: "Usuario no encontrado." };

  // Verify space exists and is bookable
  const { data: space } = await admin
    .from("Spaces")
    .select("id, bookable, id_parking")
    .eq("id", idSpace)
    .single();
  if (!space) return { error: "Espacio no encontrado." };
  if (!space.bookable) return { error: "El espacio no es reservable." };

  // Verify operator is assigned to this parking
  const { data: assignment } = await admin
    .from("ParkingOperators")
    .select("id")
    .eq("id_user", dbUser.id)
    .eq("id_parking", space.id_parking)
    .single();
  if (!assignment) return { error: "No tienes permisos para este parqueadero." };

  // Verify vehicle exists
  const { data: vehicle } = await admin
    .from("Vehicle")
    .select("id")
    .eq("id", idCar)
    .single();
  if (!vehicle) return { error: "Vehículo no encontrado." };

  // Get parking parameters (cost_reservation, expires_reservation)
  const { data: params } = await admin
    .from("Parameters")
    .select("cost_reservation, expires_reservation")
    .eq("id_parking", space.id_parking)
    .single();
  if (!params) return { error: "Parámetros no configurados para este parqueadero." };

  const now = new Date();
  const reservationDayStr = reservationDate.toISOString().slice(0, 10);

  // Check existing non-expired reservations for this space
  const { data: existingReservations } = await admin
    .from("Reservations")
    .select("id, date, expires_at, id_car")
    .eq("id_space", idSpace)
    .order("date", { ascending: false });

  for (const r of existingReservations ?? []) {
    const expiresAt = r.expires_at ? new Date(r.expires_at) : null;

    // If already expired, skip
    if (expiresAt && expiresAt < now) continue;

    // Not expired — check if there's also an active occupation with same car
    const { data: occupation } = await admin
      .from("Occupations")
      .select("id")
      .eq("id_space", idSpace)
      .eq("id_car", r.id_car)
      .is("end_date", null)
      .maybeSingle();

    if (occupation) {
      // Reservation + occupation with same car → space is taken for THAT day
      const existingDayStr = new Date(r.date).toISOString().slice(0, 10);
      if (reservationDayStr === existingDayStr) {
        return {
          error: `El espacio ya tiene una reserva activa con ocupación para el día ${existingDayStr}.`,
        };
      }
      // Different day → OK, continue checking other reservations
      continue;
    }

    // Not expired and no matching occupation → space has a pending reservation
    return {
      error: "El espacio ya tiene una reserva vigente que no ha expirado.",
    };
  }

  // Compute expires_at = date + expires_reservation minutes
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

  // Insert payment linked to the reservation
  const { error: payError } = await admin.from("Payments").insert({
    amount: Number(params.cost_reservation),
    currency,
    idempotency_key: randomUUID(),
    status: "Pagado",
    id_car: idCar,
    id_reservation: newReservation.id,
  });

  if (payError) {
    // Rollback reservation if payment fails
    await admin.from("Reservations").delete().eq("id", newReservation.id);
    return { error: `Error al crear el pago: ${payError.message}` };
  }

  revalidatePath("/operador/reservas");
  return { success: true, reservationId: newReservation.id };
}

export async function updateParameters(
  _prev: UpdateParamsState,
  formData: FormData,
): Promise<UpdateParamsState> {
  const idParking = Number(formData.get("id_parking"));
  const expiresReservation = Number(formData.get("expires_reservation"));
  const deadlineReservation = Number(formData.get("deadline_reservation"));
  const costReservation = Number(formData.get("cost_reservation"));
  const fee = Number(formData.get("fee"));

  if (!idParking || [expiresReservation, deadlineReservation, costReservation, fee].some(isNaN)) {
    return { error: "Todos los campos son obligatorios y deben ser numéricos." };
  }

  // Verify the current user is an operator assigned to this parking
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "No autenticado." };

  const admin = createAdminClient();

  const { data: dbUser } = await admin
    .from("Users")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!dbUser) return { error: "Usuario no encontrado." };

  const { data: assignment } = await admin
    .from("ParkingOperators")
    .select("id")
    .eq("id_user", dbUser.id)
    .eq("id_parking", idParking)
    .single();

  if (!assignment) return { error: "No tienes permisos para este parqueadero." };

  const { error } = await admin
    .from("Parameters")
    .update({
      expires_reservation: expiresReservation,
      deadline_reservation: deadlineReservation,
      cost_reservation: costReservation,
      fee,
    })
    .eq("id_parking", idParking);

  if (error) return { error: error.message };

  revalidatePath("/operador");
  return { success: true };
}
