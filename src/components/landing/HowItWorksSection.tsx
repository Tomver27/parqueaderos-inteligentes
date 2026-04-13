"use client";

import { motion } from "motion/react";

const howItWorks = [
  {
    step: "01",
    title: "Sensores detectan",
    desc: "Los sensores ultrasónicos instalados en cada plaza detectan si hay un vehículo presente o no.",
  },
  {
    step: "02",
    title: "Datos se transmiten",
    desc: "La información viaja desde el microcontrolador al backend mediante protocolo MQTT o HTTP de forma inalámbrica.",
  },
  {
    step: "03",
    title: "Backend procesa",
    desc: "El servidor centralizado actualiza la disponibilidad y gestiona las reservas en tiempo real.",
  },
  {
    step: "04",
    title: "Tú decides",
    desc: "Desde la web o la app, visualizas la disponibilidad y reservas tu espacio antes de salir.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p
            className="text-sm uppercase tracking-widest mb-3"
            style={{ color: "#06b6d4" }}
          >
            ¿Cómo funciona?
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Del sensor a tu pantalla
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorks.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {i < howItWorks.length - 1 && (
                <div
                  className="hidden lg:block absolute top-6 left-full w-full h-px z-10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.4), transparent)",
                  }}
                />
              )}
              <div
                className="text-4xl mb-4"
                style={{
                  fontWeight: 900,
                  color: "rgba(59,130,246,0.2)",
                  letterSpacing: "-0.05em",
                }}
              >
                {step.step}
              </div>
              <h3 className="mb-2" style={{ fontWeight: 700 }}>
                {step.title}
              </h3>
              <p
                className="text-sm"
                style={{ color: "#94a3b8", lineHeight: 1.6 }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
