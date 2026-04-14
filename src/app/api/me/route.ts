import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ firstName: null, role: null });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("Users")
    .select("first_name, id_role, Roles ( name )")
    .eq("email", user.email!)
    .single();

  return NextResponse.json({
    firstName: data?.first_name ?? null,
    role: (data as any)?.Roles?.name ?? null,
    roleId: data?.id_role ?? null,
  });
}
