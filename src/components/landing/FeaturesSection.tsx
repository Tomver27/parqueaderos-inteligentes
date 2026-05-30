"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Wifi, Cpu, MapPin, Clock, Zap, Smartphone } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Wifi,
    title: "Sensores IoT en tiempo real",
    desc: "Sensores ultrasónicos HC-SR04 detectan la ocupación de cada plaza y transmiten los datos vía MQTT en menos de 2 segundos.",
    color: "#3b82f6",
  },
  {
    icon: Cpu,
    title: "Backend inteligente",
    desc: "Arquitectura de microservicios que procesa y distribuye la información de disponibilidad a todos los clientes conectados.",
    color: "#8b5cf6",
  },
  {
    icon: MapPin,
    title: "Parqueaderos cercanos",
    desc: "Visualiza en tiempo real los parqueaderos más próximos a tu ubicación con la cantidad de espacios disponibles.",
    color: "#06b6d4",
  },
  {
    icon: Clock,
    title: "Reservas anticipadas",
    desc: "Reserva tu puesto con antelación para garantizar un espacio cuando llegues a tu destino.",
    color: "#10b981",
  },
  {
    icon: Zap,
    title: "Detección instantánea",
    desc: "El sistema refleja el cambio de estado (vehículo presente/ausente) en la aplicación en menos de 2 segundos.",
    color: "#f59e0b",
  },
  {
    icon: Smartphone,
    title: "Aplicación móvil",
    desc: "Gestiona tus reservas, consulta disponibilidad y navega al parqueadero desde tu smartphone con iOS o Android.",
    color: "#ec4899",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".feature-card", sectionRef.current!);
      gsap.set(cards, { opacity: 0, y: 40 });

      ScrollTrigger.batch(cards, {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.09,
            ease: "power3.out",
            overwrite: true,
          }),
        start: "top 88%",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p
          className="text-sm uppercase tracking-widest mb-3"
          style={{ color: "#06b6d4" }}
        >
          Características
        </p>
        <h2
          style={{
            fontSize: "clamp(1.8rem,4vw,2.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Tecnología al servicio
          <br />
          de la movilidad urbana
        </h2>
        <p
          className="mt-4 max-w-2xl mx-auto"
          style={{ color: "#94a3b8" }}
        >
          Combinamos hardware embebido, comunicación inalámbrica y software
          moderno para resolver uno de los mayores problemas del tráfico
          urbano.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="feature-card p-6 rounded-2xl transition-all hover:scale-[1.02]"
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `${f.color}20`,
                  border: `1px solid ${f.color}40`,
                }}
              >
                <Icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className="mb-2" style={{ fontWeight: 700 }}>
                {f.title}
              </h3>
              <p
                className="text-sm"
                style={{ color: "#94a3b8", lineHeight: 1.6 }}
              >
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
