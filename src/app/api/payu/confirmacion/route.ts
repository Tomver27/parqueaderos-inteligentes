import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.formData();
  const transactionState = body.get("transactionState")?.toString();
  const referenceCode = body.get("referenceCode")?.toString();

  if (!referenceCode) {
    return new Response("referenceCode es obligatorio", { status: 400 });
  }

  const statusMap: Record<string, string> = {
    "4": "exitoso",
    "6": "rechazado",
    "7": "pendiente",
  };

  const status = statusMap[transactionState ?? ""] ?? "error";
  const admin = createAdminClient();

  await admin
    .from("Payments")
    .update({ status })
    .eq("idempotency_key", referenceCode);

  return new Response("OK", { status: 200 });
}
