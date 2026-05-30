"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, ChevronRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(boxRef.current, { opacity: 0, y: 50 });
      gsap.to(boxRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: boxRef.current,
          start: "top 85%",
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 px-6">
      <div
        ref={boxRef}
        className="max-w-4xl mx-auto text-center rounded-3xl p-16 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%)",
          border: "1px solid rgba(59,130,246,0.3)",
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(6,182,212,0.3) 0%, transparent 50%)",
          }}
        />
        <div className="relative">
          <h2
            className="mb-4"
            style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            ¿Listo para estacionar inteligente?
          </h2>
          <p
            className="mb-8 max-w-xl mx-auto"
            style={{ color: "#94a3b8" }}
          >
            Encuentra parqueaderos cercanos, reserva tu espacio y olvídate de
            dar vueltas buscando donde estacionar.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/parqueaderos"
              className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                fontWeight: 700,
              }}
            >
              <MapPin size={18} />
              Ver parqueaderos
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
