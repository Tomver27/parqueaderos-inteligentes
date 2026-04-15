"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type UpdateParamsState = { error: string } | { success: true } | undefined;

export type { UpdateParamsState };

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
