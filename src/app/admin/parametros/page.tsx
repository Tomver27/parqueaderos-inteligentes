import { createAdminClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";

export default async function AdminParametrosPage() {
  const admin = createAdminClient();
  const { data: parameters } = await admin
    .from("Parameters")
    .select(`
      id,
      expires_reservation,
      deadline_reservation,
      cost_reservation,
      fee,
      Parkings ( name )
    `);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Parámetros</h1>
      <p className="text-slate-400 text-sm mb-6">
        Configuración por parqueadero
      </p>

      {parameters && parameters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parameters.map((param: any) => (
            <div
              key={param.id}
              className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-5"
            >
              <h3 className="font-semibold mb-4">
                {param.Parkings?.name ?? "Parqueadero"}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block mb-1">
                    Expiración reserva
                  </span>
                  <span>{param.expires_reservation} min</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">
                    Límite reserva
                  </span>
                  <span>{param.deadline_reservation} min</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">
                    Costo reserva
                  </span>
                  <span>${Number(param.cost_reservation).toLocaleString("es-CO")}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">
                    Tarifa
                  </span>
                  <span>${Number(param.fee).toLocaleString("es-CO")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <Settings size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">
            No hay parámetros configurados
          </p>
        </div>
      )}
    </div>
  );
}
