import { DollarSign, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOperadorRevenue } from "@/lib/actions/operador";

export default async function OperadorIngresosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const revenue = user?.email ? await getOperadorRevenue(user.email) : null;

  if (!revenue || (revenue.totalCOP === 0 && revenue.totalUSD === 0)) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Ingresos</h1>
        <p className="text-slate-400 text-sm mb-6">
          Resumen financiero de tu parqueadero
        </p>

        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <DollarSign size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">
            Sin ingresos registrados aún
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Ingresos</h1>
      <p className="text-slate-400 text-sm mb-6">
        Resumen financiero de tu parqueadero
      </p>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {revenue.totalCOP > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total COP</p>
                <p className="text-3xl font-bold text-emerald-400">
                  ${revenue.totalCOP.toLocaleString("es-CO")}
                </p>
              </div>
              <TrendingUp size={24} className="text-emerald-400" />
            </div>
            <p className="text-slate-500 text-xs mt-3">
              {revenue.paymentsCOP.length} pagos aceptados
            </p>
          </div>
        )}

        {revenue.totalUSD > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total USD</p>
                <p className="text-3xl font-bold text-blue-400">
                  ${revenue.totalUSD.toLocaleString("en-US")}
                </p>
              </div>
              <TrendingUp size={24} className="text-blue-400" />
            </div>
            <p className="text-slate-500 text-xs mt-3">
              {revenue.paymentsUSD.length} pagos aceptados
            </p>
          </div>
        )}
      </div>

      {/* Tabla de pagos */}
      {revenue.allPayments.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] overflow-hidden">
          <div className="p-4 border-b border-white/[0.07]">
            <h2 className="font-semibold text-white">Pagos Aceptados</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">
                    ID Pago
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">
                    Monto
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">
                    Moneda
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">
                    Placa
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenue.allPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-white/[0.07] hover:bg-white/[0.01] transition"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      #{payment.id}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">
                      ${Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {payment.currency}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {payment.Vehicle?.plate ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          payment.status === "Pagado"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-blue-500/15 text-blue-400"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
