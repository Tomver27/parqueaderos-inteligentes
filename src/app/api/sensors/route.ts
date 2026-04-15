import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/sensors — recibe datos de los sensores IoT
// Body: { id_space: number, occupied: boolean }
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { id_space, occupied } = body as { id_space?: number; occupied?: boolean };

  if (typeof id_space !== "number" || typeof occupied !== "boolean") {
    return NextResponse.json(
      { error: "Se requiere id_space (number) y occupied (boolean)" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Verify the space exists
  const { data: space } = await admin
    .from("Spaces")
    .select("id")
    .eq("id", id_space)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  }

  if (occupied) {
    // Check if there's already an active occupation for this space
    const { data: active } = await admin
      .from("Occupations")
      .select("id")
      .eq("id_space", id_space)
      .is("end_date", null)
      .single();

    if (active) {
      return NextResponse.json({ message: "El espacio ya está ocupado" }, { status: 200 });
    }

    // Create new occupation
    const { error } = await admin.from("Occupations").insert({
      id_space,
      start_date: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Ocupación registrada" }, { status: 201 });
  } else {
    // Close the active occupation by setting end_date
    const { data: active } = await admin
      .from("Occupations")
      .select("id")
      .eq("id_space", id_space)
      .is("end_date", null)
      .single();

    if (!active) {
      return NextResponse.json({ message: "No hay ocupación activa para este espacio" }, { status: 200 });
    }

    const { error } = await admin
      .from("Occupations")
      .update({ end_date: new Date().toISOString() })
      .eq("id", active.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Ocupación finalizada" }, { status: 200 });
  }
}

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
