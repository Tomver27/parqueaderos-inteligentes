"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Zap, Car, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "40%", label: "Reducción en tiempo de acceso", icon: Clock },
  { value: "<2s", label: "Latencia de actualización", icon: Zap },
  { value: "30%", label: "Del tráfico es por buscar parqueo", icon: Car },
  { value: "100%", label: "Monitoreo en tiempo real", icon: ShieldCheck },
];

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".stat-item", sectionRef.current!);
      gsap.set(items, { opacity: 0, y: 30, scale: 0.95 });

      ScrollTrigger.batch(items, {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.4)",
            overwrite: true,
          }),
        start: "top 88%",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 border-y"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-item text-center">
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
