"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import type { InviteState } from "@/types";

export async function inviteOperador(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const firstName = (formData.get("first_name") as string).trim();
  const secondName = (formData.get("second_name") as string | null)?.trim() ?? "";
  const lastName = (formData.get("last_name") as string).trim();
  const document = (formData.get("document") as string).trim();
  const phoneNumber = (formData.get("phone_number") as string).trim();
  const idDocumentType = Number(formData.get("id_document_type"));
  const idParking = Number(formData.get("id_parking"));

  if (!email || !firstName || !lastName || !document || !phoneNumber || !idParking) {
    return { error: "Todos los campos obligatorios deben estar completos." };
  }

  const admin = createAdminClient();

  // Check if email already exists in Users table
  const { data: existing } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return { error: "Ya existe un usuario con ese correo electrónico." };
  }

  // Build the origin from request headers for the redirect URL
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  // 1. Create auth user and send invite email
  const { data: authData, error: authError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { needs_password_setup: true },
      redirectTo: `${origin}/auth/callback`,
    });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Insert profile in Users table (role 2 = Operador)
  const { data: newUser, error: profileError } = await admin
    .from("Users")
    .insert({
      document,
      first_name: firstName,
      second_name: secondName,
      last_name: lastName,
      email,
      phone_number: phoneNumber,
      id_document_type: idDocumentType,
      id_role: 2,
    })
    .select("id")
    .single();

  if (profileError || !newUser) {
    if (authData?.user) {
      await admin.auth.admin.deleteUser(authData.user.id);
    }
    return { error: profileError?.message ?? "Error al crear el perfil." };
  }

  // 3. Link operator to parking via ParkingOperators
  const { error: linkError } = await admin.from("ParkingOperators").insert({
    id_user: newUser.id,
    id_parking: idParking,
  });

  if (linkError) {
    // Rollback user + auth
    await admin.from("Users").delete().eq("id", newUser.id);
    if (authData?.user) {
      await admin.auth.admin.deleteUser(authData.user.id);
    }
    return { error: linkError.message };
  }

  return { success: true, email };
}

export async function resendInvite(email: string): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  // Delete the existing auth user so we can re-invite
  const { data: users } = await admin.auth.admin.listUsers();
  const existing = users?.users.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id);
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { needs_password_setup: true },
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) return { error: error.message };
  return {};
}
