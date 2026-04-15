import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Supabase redirige aquí después de que el usuario confirma su correo.
// Este handler intercambia el código por una sesión y lleva al dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Invited users (operators) need to set their password first
      if (data.user?.user_metadata?.needs_password_setup) {
        return NextResponse.redirect(`${origin}/set-password`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Si algo falla, volver al login con un mensaje
  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
