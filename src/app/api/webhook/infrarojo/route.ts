import { NextResponse } from "next/server";

interface SensorPayload {
  device: string;
  estado: "LIBRE" | "OCUPADO";
  valor_adc: number;
}

interface SensorState extends SensorPayload {
  updated_at: string;
}

// Module-level singleton — persists within the Node.js process lifetime
let sensorState: SensorState | null = null;

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

  sensorState = { device, estado, valor_adc, updated_at: new Date().toISOString() };

  return NextResponse.json({ message: "Estado del sensor actualizado", sensor: sensorState });
}

// GET /api/webhook/infrarojo
export async function GET() {
  return NextResponse.json({ sensor: sensorState });
}
