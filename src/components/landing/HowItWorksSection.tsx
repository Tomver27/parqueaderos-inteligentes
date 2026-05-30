"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const howItWorks = [
  {
    step: "01",
    title: "Sensores detectan",
    desc: "Los sensores de cada parqueadero identifican si el espacio está ocupado o libre.",
  },
  {
    step: "02",
    title: "Datos se transmiten",
    desc: "La información viaja desde parqueadero hacia nuestra plataforma.",
  },
  {
    step: "03",
    title: "Sistema procesa",
    desc: "Nuestro sistema procesa la información y actualiza en tiempo real la disponibilidad de los espacios.",
  },
  {
    step: "04",
    title: "Tú decides",
    desc: "Desde la web o la app, visualizas la disponibilidad y reservas tu espacio antes de salir.",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>(".step-item", sectionRef.current!);
      gsap.set(steps, { opacity: 0, y: 30 });

      ScrollTrigger.batch(steps, {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "power3.out",
            overwrite: true,
          }),
        start: "top 82%",
      });

      const lines = gsap.utils.toArray<HTMLElement>(".connector-line", sectionRef.current!);
      if (lines.length) {
        gsap.set(lines, { scaleX: 0, transformOrigin: "left center" });
        gsap.to(lines, {
          scaleX: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "top 20%",
            scrub: 0.8,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24" style={{ background: "rgba(255,255,255,0.02)" }}>
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
            <div key={step.step} className="step-item relative">
              {i < howItWorks.length - 1 && (
                <div
                  className="connector-line hidden lg:block absolute top-6 left-full w-full h-px z-10"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
