"server-only";

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { fmtDateTimeCO, dbTs } from "@/lib/dates";

const resend = new Resend(process.env.RESEND_API_KEY);

type PaymentInfo = {
  id: number;
  id_reservation: number;
  amount: number;
  currency: string;
  id_car: number;
};

/**
 * Sets IS_PAID = true and sends the confirmation email.
 * Guards against double execution: if IS_PAID is already true, skips both actions.
 * This allows safe calling from both the confirmacion webhook and the respuesta page.
 */
export async function confirmPaymentAndNotify(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentInfo,
) {
  const { data: reservation } = await admin
    .from("Reservations")
    .select("IS_PAID")
    .eq("id", payment.id_reservation)
    .single();

  if (reservation?.IS_PAID) {
    console.log("[email] already confirmed, skipping reservation:", payment.id_reservation);
    return;
  }

  await admin
    .from("Reservations")
    .update({ IS_PAID: true })
    .eq("id", payment.id_reservation);

  await sendConfirmationEmail(admin, payment);
}

async function sendConfirmationEmail(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentInfo,
) {
  const { data: reservationDetail } = await admin
    .from("Reservations")
    .select(`
      id, date, expires_at,
      Spaces ( name, Parkings ( name, address ) ),
      Vehicle ( plate, Users ( first_name, last_name, email ) )
    `)
    .eq("id", payment.id_reservation)
    .single();

  if (!reservationDetail) {
    console.error("[email] reservation not found for id:", payment.id_reservation);
    return;
  }

  const space = (reservationDetail as any).Spaces;
  const parking = space?.Parkings;
  const vehicle = (reservationDetail as any).Vehicle;
  const conductor = vehicle?.Users;

  console.log("[email] space:", space?.name, "| parking:", parking?.name, "| conductor email:", conductor?.email);

  if (!conductor?.email) {
    console.error("[email] conductor email missing — check Vehicle→Users FK in Supabase");
    return;
  }

  const toEmail = process.env.RESEND_TO_OVERRIDE ?? conductor.email;

  const fechaEntrada = fmtDateTimeCO(dbTs(reservationDetail.date));
  const fechaLimite = reservationDetail.expires_at
    ? fmtDateTimeCO(dbTs(reservationDetail.expires_at))
    : "—";
  const conductorNombre = `${conductor.first_name} ${conductor.last_name}`.trim();
  const monto = Number(payment.amount).toLocaleString("es-CO");

  const { data: emailData, error: emailError } = await resend.emails.send({
    from: "ParkGo <onboarding@resend.dev>",
    to: [toEmail],
    subject: `✅ Reserva confirmada — ${space?.name ?? "espacio asignado"}`,
    html: buildEmailHtml({ conductorNombre, space, parking, fechaEntrada, fechaLimite, vehicle, monto, currency: payment.currency, reservationId: reservationDetail.id }),
  });

  if (emailError) {
    console.error("[email] Resend error:", emailError);
  } else {
    console.log("[email] sent ok, id:", emailData?.id, "→", toEmail);
  }
}

function buildEmailHtml(d: {
  conductorNombre: string;
  space: any;
  parking: any;
  fechaEntrada: string;
  fechaLimite: string;
  vehicle: any;
  monto: string;
  currency: string;
  reservationId: number;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <div style="background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:32px 32px 24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.7);text-transform:uppercase;">ParkGo</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">¡Tu reserva está confirmada!</h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Pago procesado exitosamente. Aquí están todos los detalles.</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Hola <strong style="color:#e2e8f0;">${d.conductorNombre}</strong>, tu plaza ha sido asignada. Preséntate con tu vehículo dentro del tiempo límite.</p>
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Plaza asignada</p>
        <p style="margin:0;font-size:32px;font-weight:900;color:#fff;">${d.space?.name ?? "—"}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${d.parking?.name ?? "—"}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Parqueadero", d.parking?.name ?? "—")}
        ${row("Dirección", d.parking?.address ?? "—")}
        ${row("Fecha de entrada", d.fechaEntrada)}
        ${row("Tiempo límite de llegada", d.fechaLimite)}
        ${row("Vehículo (placa)", d.vehicle?.plate ?? "—")}
        ${row("Monto pagado", `$${d.monto} ${d.currency}`)}
        ${row("ID de reserva", `#${d.reservationId}`)}
      </table>
      <div style="margin-top:24px;padding:14px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;">
        <p style="margin:0;font-size:13px;color:#6ee7b7;line-height:1.5;">
          <strong>Importante:</strong> Debes presentarte antes del tiempo límite de llegada.
          La cámara de acceso reconocerá tu placa automáticamente.
          Si no llegas a tiempo, la reserva expirará y el espacio quedará disponible para otros.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:12px;color:#475569;text-align:center;">ParkGo · Sistema de parqueaderos inteligentes</p>
    </div>
  </div>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;font-size:12px;color:#64748b;border-bottom:1px solid rgba(255,255,255,0.05);width:45%;">${label}</td>
    <td style="padding:10px 0;font-size:13px;color:#e2e8f0;border-bottom:1px solid rgba(255,255,255,0.05);font-weight:500;">${value}</td>
  </tr>`;
}
