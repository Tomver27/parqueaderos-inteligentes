"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type AuthError = { error: string };
type CheckEmail = { checkEmail: true; email: string };
export type ActionState = AuthError | CheckEmail | undefined;

export async function signIn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signUp(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("first_name") as string;
  const secondName = (formData.get("second_name") as string) ?? "";
  const lastName = formData.get("last_name") as string;
  const document = formData.get("document") as string;
  const phoneNumber = formData.get("phone_number") as string;
  const idDocumentType = Number(formData.get("id_document_type"));

  const supabase = await createClient();

  // 1. Crear usuario en Supabase Auth
  const { error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return { error: authError.message };

  // 2. Insertar perfil en la tabla Users (admin client para saltar RLS)
  const admin = createAdminClient();
  const { error: profileError } = await admin.from("Users").insert({
    document,
    first_name: firstName,
    second_name: secondName,
    last_name: lastName,
    email,
    phone_number: phoneNumber,
    id_document_type: idDocumentType,
    id_role: 3, // Conductor por defecto
  });
  if (profileError) return { error: profileError.message };

  // No redirigir — el usuario debe confirmar su correo primero
  return { checkEmail: true, email };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
    data: { needs_password_setup: null },
  });

  if (error) return { error: error.message };

  redirect("/");
}
