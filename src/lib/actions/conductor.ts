"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { CreateReservaState, AddVehicleState } from "@/types";

const ROLE_CONDUCTOR = 3;

export async function createReservaConductor(
  _prev: CreateReservaState,
  formData: FormData,
): Promise<CreateReservaState> {
  const idSpace = Number(formData.get("id_space"));
  const idCar = Number(formData.get("id_car"));
  const dateStr = String(formData.get("date") ?? "").trim();

  if (!idSpace || !idCar || !dateStr) {
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
    .select("id, id_role")
    .eq("email", user.email)
    .single();
  if (!dbUser) return { error: "Usuario no encontrado." };
  if (dbUser.id_role !== ROLE_CONDUCTOR) {
    return { error: "Solo los conductores pueden realizar reservas." };
  }

  // Verify the vehicle belongs to this conductor
  const { data: vehicle } = await admin
    .from("Vehicle")
    .select("id")
    .eq("id", idCar)
    .eq("id_user", dbUser.id)
    .single();
  if (!vehicle) return { error: "Vehículo no encontrado o no te pertenece." };

  // Verify space exists and is bookable
  const { data: space } = await admin
    .from("Spaces")
    .select("id, bookable, id_parking")
    .eq("id", idSpace)
    .single();
  if (!space) return { error: "Espacio no encontrado." };
  if (!space.bookable) return { error: "El espacio no es reservable." };

  // Get parking parameters
  const { data: params } = await admin
    .from("Parameters")
    .select("cost_reservation, expires_reservation, deadline_reservation")
    .eq("id_parking", space.id_parking)
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

  // Reservations block the ENTIRE Colombia calendar day of their `date`.
  // A reservation only blocks if: expires_at >= now AND taken = false.
  // DB timestamps are stored as UTC via .toISOString() but returned without Z
  // (TIMESTAMP WITHOUT TIME ZONE strips it). We re-add Z to parse as UTC.
  const toUTC = (s: string) =>
    new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z");

  const requestedDay = reservationDate.toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });

  const { data: existingReservations } = await admin
    .from("Reservations")
    .select("id, date, expires_at, taken")
    .eq("id_space", idSpace)
    .eq("taken", false)
    .gte("expires_at", now.toISOString())
    .order("date", { ascending: false });

  for (const r of existingReservations ?? []) {
    const rDay = toUTC(r.date).toLocaleDateString("en-CA", {
      timeZone: "America/Bogota",
    });
    if (requestedDay === rDay) {
      return {
        error: `El espacio ya tiene una reserva vigente para el ${rDay}. Elige otro día u otro espacio.`,
      };
    }
  }

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

  // Insert payment
  const { error: payError } = await admin.from("Payments").insert({
    amount: Number(params.cost_reservation),
    currency: "COP",
    idempotency_key: randomUUID(),
    status: "Pagado",
    id_car: idCar,
    id_reservation: newReservation.id,
  });

  if (payError) {
    await admin.from("Reservations").delete().eq("id", newReservation.id);
    return { error: `Error al registrar el pago: ${payError.message}` };
  }

  revalidatePath("/conductor/reservas");
  revalidatePath("/reservar");
  return { success: true, reservationId: newReservation.id };
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
