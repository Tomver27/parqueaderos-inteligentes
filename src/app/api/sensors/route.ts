import { NextResponse } from "next/server";

// POST /api/sensors — recibe datos de los sensores IoT
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: persistir en Supabase
  return NextResponse.json({ received: true, data: body }, { status: 201 });
}

// GET /api/sensors — devuelve el estado actual de los sensores
export async function GET() {
  // TODO: consultar Supabase
  return NextResponse.json({ sensors: [] });
}
