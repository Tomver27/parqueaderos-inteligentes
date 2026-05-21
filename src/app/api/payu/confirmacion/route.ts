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

  const { data: payment } = await admin
    .from("Payments")
    .update({ status })
    .eq("idempotency_key", referenceCode)
    .select("id_reservation")
    .single();

  if (transactionState === "4" && payment?.id_reservation) {
    await admin
      .from("Reservations")
      .update({ IS_PAID: true })
      .eq("id", payment.id_reservation);
  }

  return new Response("OK", { status: 200 });
}
