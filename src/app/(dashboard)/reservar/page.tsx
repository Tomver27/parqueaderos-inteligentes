import Link from "next/link";
import { Car, ChevronRight } from "lucide-react";

export default function ReservarPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#0b1120" }}
    >
      <div
        className="text-center max-w-md rounded-3xl p-12"
        style={{
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          }}
        >
          <Car size={28} className="text-white" />
        </div>
        <h1
          className="text-white mb-3"
          style={{ fontWeight: 800, fontSize: "1.5rem" }}
        >
          Reserva tu puesto
        </h1>
        <p className="mb-8 text-sm" style={{ color: "#94a3b8" }}>
          Próximamente podrás reservar tu puesto de parqueadero directamente
          desde aquí. Por ahora, explora los parqueaderos disponibles.
        </p>
        <Link
          href="/parqueaderos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90 text-white"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            fontWeight: 600,
          }}
        >
          Ver parqueaderos
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
