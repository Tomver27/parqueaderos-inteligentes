import { DollarSign } from "lucide-react";

export default function OperadorIngresosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Ingresos</h1>
      <p className="text-slate-400 text-sm mb-6">
        Resumen financiero de tu parqueadero
      </p>

      <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
        <DollarSign size={32} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">
          Próximamente: resumen de ingresos, gráficas y desglose por tipo de
          vehículo.
        </p>
      </div>
    </div>
  );
}
