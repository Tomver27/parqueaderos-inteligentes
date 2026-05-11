import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { fmtDateTimeCO } from "@/lib/dates";

const statusMap: Record<string, string> = {
  "4": "exitoso",
  "6": "rechazado",
  "7": "pendiente",
};

async function syncAndGetPayment(referenceCode: string, transactionState: string) {
  const admin = createAdminClient();

  const newStatus = statusMap[transactionState] ?? "error";
  if (newStatus !== "pendiente" && newStatus !== "error") {
    await admin
      .from("Payments")
      .update({ status: newStatus })
      .eq("idempotency_key", referenceCode);
  }

  const { data } = await admin
    .from("Payments")
    .select(
      `id, status, amount, currency, Vehicle ( plate ), Reservations ( id, date, Spaces ( name, Parkings ( name ) ) )`,
    )
    .eq("idempotency_key", referenceCode)
    .single();

  return data ?? null;
}

export default async function PagoRespuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ transactionState?: string; referenceCode?: string }>;
}) {
  const { transactionState = "", referenceCode = "" } = await searchParams;
  const payment = referenceCode
    ? await syncAndGetPayment(referenceCode, transactionState)
    : null;

  const messages: Record<string, { title: string; description: string; positive: boolean }> = {
    "4": {
      title: "Pago exitoso",
      description: "Tu reserva fue pagada correctamente.",
      positive: true,
    },
    "6": {
      title: "Pago rechazado",
      description: "Ocurrió un error :( Intenta nuevamente o usa otro método de pago.",
      positive: false,
    },
    "7": {
      title: "Pago pendiente",
      description:
        "Tu transacción está en estado pendiente. Verifica el estado más tarde en tu panel.",
      positive: false,
    },
  };

  const result = messages[transactionState] ?? {
    title: "Estado desconocido",
    description:
      "No fue posible determinar el resultado del pago. Revisa tu historial en el panel.",
    positive: false,
  };

  const reservation = Array.isArray(payment?.Reservations)
    ? payment.Reservations[0]
    : payment?.Reservations;
  const space = Array.isArray(reservation?.Spaces)
    ? reservation?.Spaces[0]
    : reservation?.Spaces;
  const parking = Array.isArray(space?.Parkings)
    ? space?.Parkings[0]
    : space?.Parkings;
  const vehicle = Array.isArray(payment?.Vehicle)
    ? payment.Vehicle[0]
    : payment?.Vehicle;

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "#0b1120" }}>
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-slate-950 p-10">
          <h1 className="text-3xl font-bold text-white mb-3">{result.title}</h1>
          <p className="text-slate-400 mb-8">{result.description}</p>

          {payment ? (
            <div className="rounded-2xl bg-slate-900 p-5 space-y-3 border border-white/10">
              <p className="text-sm text-slate-400">Referencia de pago</p>
              <p className="text-white font-medium">{referenceCode}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Reserva</p>
                  <p className="font-semibold text-white">
                    #{reservation?.id ?? "—"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {parking?.name ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Puesto</p>
                  <p className="font-semibold text-white">
                    {space?.name ?? "—"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Espacio reservado</p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Vehículo</p>
                  <p className="font-semibold text-white">{vehicle?.plate ?? "—"}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {payment.amount?.toLocaleString("es-CO")} {payment.currency}
                  </p>
                </div>
                {reservation?.date && (
                  <div className="rounded-2xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Fecha de la reserva</p>
                    <p className="font-semibold text-white">
                      {fmtDateTimeCO(new Date(
                        reservation.date.endsWith("Z") || reservation.date.includes("+")
                          ? reservation.date
                          : reservation.date + "Z"
                      ))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900 p-5 border border-white/10">
              <p className="text-slate-400">No se encontró información de la reserva vinculada.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/conductor"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white"
            >
              Volver al panel
            </Link>
            <Link
              href="/conductor/pagos"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white/80"
            >
              Ver mis pagos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
