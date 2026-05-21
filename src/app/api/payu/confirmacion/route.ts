import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { fmtDateTimeCO, dbTs } from "@/lib/dates";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    .select("id, id_reservation, amount, currency, id_car")
    .single();

  if (transactionState === "4" && payment?.id_reservation) {
    await admin
      .from("Reservations")
      .update({ IS_PAID: true })
      .eq("id", payment.id_reservation);

    await sendConfirmationEmail(admin, payment);
  }

  return new Response("OK", { status: 200 });
}

async function sendConfirmationEmail(
  admin: ReturnType<typeof createAdminClient>,
  payment: { id: number; id_reservation: number; amount: number; currency: string; id_car: number },
) {
  const { data: reservation } = await admin
    .from("Reservations")
    .select(`
      id, date, expires_at,
      Spaces ( name, Parkings ( name, address ) ),
      Vehicle ( plate, Users ( first_name, last_name, email ) )
    `)
    .eq("id", payment.id_reservation)
    .single();

  if (!reservation) {
    console.error("[email] reservation not found for id:", payment.id_reservation);
    return;
  }

  const space = (reservation as any).Spaces;
  const parking = space?.Parkings;
  const vehicle = (reservation as any).Vehicle;
  const conductor = vehicle?.Users;

  console.log("[email] space:", space?.name, "| parking:", parking?.name, "| conductor email:", conductor?.email);

  if (!conductor?.email) {
    console.error("[email] conductor email missing — check Vehicle→Users FK in Supabase");
    return;
  }

  // While using onboarding@resend.dev (shared domain), Resend only allows
  // sending to the account owner's email. RESEND_TO_OVERRIDE redirects all
  // emails to that address for testing. Remove this once a real domain is verified.
  const toEmail = process.env.RESEND_TO_OVERRIDE ?? conductor.email;

  const fechaEntrada = fmtDateTimeCO(dbTs(reservation.date));
  const fechaLimite = reservation.expires_at
    ? fmtDateTimeCO(dbTs(reservation.expires_at))
    : "—";
  const conductorNombre = `${conductor.first_name} ${conductor.last_name}`.trim();
  const monto = Number(payment.amount).toLocaleString("es-CO");

  const { data: emailData, error: emailError } = await resend.emails.send({

    from: "ParkGo <onboarding@resend.dev>",
    to: [toEmail],
    subject: `✅ Reserva confirmada — ${space?.name ?? "espacio asignado"}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:32px 32px 24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.7);text-transform:uppercase;">ParkGo</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">¡Tu reserva está confirmada!</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Pago procesado exitosamente. Aquí están todos los detalles.</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Hola <strong style="color:#e2e8f0;">${conductorNombre}</strong>, tu plaza ha sido asignada. Preséntate con tu vehículo dentro del tiempo límite.</p>

      <!-- Space highlight -->
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Plaza asignada</p>
        <p style="margin:0;font-size:32px;font-weight:900;color:#fff;">${space?.name ?? "—"}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${parking?.name ?? "—"}</p>
      </div>

      <!-- Details table -->
      <table style="width:100%;border-collapse:collapse;">
        ${row("Parqueadero", parking?.name ?? "—")}
        ${row("Dirección", parking?.address ?? "—")}
        ${row("Fecha de entrada", fechaEntrada)}
        ${row("Tiempo límite de llegada", fechaLimite)}
        ${row("Vehículo (placa)", vehicle?.plate ?? "—")}
        ${row("Monto pagado", `$${monto} ${payment.currency}`)}
        ${row("ID de reserva", `#${reservation.id}`)}
      </table>

      <div style="margin-top:24px;padding:14px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;">
        <p style="margin:0;font-size:13px;color:#6ee7b7;line-height:1.5;">
          <strong>Importante:</strong> Debes presentarte antes del tiempo límite de llegada.
          La cámara de acceso reconocerá tu placa automáticamente.
          Si no llegas a tiempo, la reserva expirará y el espacio quedará disponible para otros.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:12px;color:#475569;text-align:center;">ParkGo · Sistema de parqueaderos inteligentes</p>
    </div>
  </div>
</body>
</html>`,
  });

  if (emailError) {
    console.error("[email] Resend error:", emailError);
  } else {
    console.log("[email] sent ok, id:", emailData?.id, "→", toEmail);
  }
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;font-size:12px;color:#64748b;border-bottom:1px solid rgba(255,255,255,0.05);width:45%;">${label}</td>
      <td style="padding:10px 0;font-size:13px;color:#e2e8f0;border-bottom:1px solid rgba(255,255,255,0.05);font-weight:500;">${value}</td>
    </tr>`;
}
