"use client";

import { motion } from "motion/react";
import { Clock, Zap, Car, ShieldCheck } from "lucide-react";

const stats = [
  { value: "40%", label: "Reducción en tiempo de acceso", icon: Clock },
  { value: "<2s", label: "Latencia de actualización", icon: Zap },
  { value: "30%", label: "Del tráfico es por buscar parqueo", icon: Car },
  { value: "100%", label: "Monitoreo en tiempo real", icon: ShieldCheck },
];

export default function StatsSection() {
  return (
    <section
      className="py-16 border-y"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <Icon size={20} style={{ color: "#60a5fa" }} />
              </div>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#06b6d4",
                }}
              >
                {s.value}
              </p>
              <p className="text-sm" style={{ color: "#64748b" }}>
                {s.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
