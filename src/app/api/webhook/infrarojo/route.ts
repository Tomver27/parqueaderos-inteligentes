import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface SensorPayload {
  device: string;
  estado: "LIBRE" | "OCUPADO";
  valor_adc: number;
}

// POST /api/webhook/infrarojo
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { device, estado, valor_adc } = body as Partial<SensorPayload>;

  if (!device || !estado || typeof valor_adc !== "number") {
    return NextResponse.json(
      { error: "Se requiere device (string), estado (string) y valor_adc (number)" },
      { status: 400 },
    );
  }

  if (estado !== "LIBRE" && estado !== "OCUPADO") {
    return NextResponse.json(
      { error: `estado inválido: "${estado}". Valores permitidos: "LIBRE" o "OCUPADO"` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("SensorInfrarrojo")
    .upsert({ device, estado, valor_adc, updated_at: new Date().toISOString() }, { onConflict: "device" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Estado del sensor actualizado", sensor: data });
}

// GET /api/webhook/infrarojo
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("SensorInfrarrojo")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sensor: data ?? null });
}
