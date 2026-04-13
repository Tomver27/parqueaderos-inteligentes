import Link from "next/link";
import { Car } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="py-8 px-6 border-t text-center"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
            }}
          >
            <Car size={14} className="text-white" />
          </div>
          <span className="text-sm" style={{ fontWeight: 700, color: "#94a3b8" }}>
            Park<span style={{ color: "#06b6d4" }}>Go</span>
          </span>
        </Link>
        <p className="text-sm" style={{ color: "#475569" }}>
          ParkGo © 2026 · Sistema Inteligente de Gestión y Reserva de
          Estacionamientos basado en IoT · Universidad Piloto de Colombia
        </p>
      </div>
    </footer>
  );
}
