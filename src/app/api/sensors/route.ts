import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/sensors — devuelve las ocupaciones activas
export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("Occupations")
    .select("id, start_date, id_space, Spaces ( name, id_parking )")
    .is("end_date", null)
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ occupations: data });
}
