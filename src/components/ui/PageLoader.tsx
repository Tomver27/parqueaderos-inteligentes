"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Car } from "lucide-react";

declare global {
  interface WindowEventMap {
    "app:navigate:start": Event;
    "app:navigate:end": Event;
  }
}

export default function PageLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function show() {
      setVisible(true);
    }
    function hide() {
      setVisible(false);
    }

    window.addEventListener("app:navigate:start", show);
    window.addEventListener("app:navigate:end", hide);

    return () => {
      window.removeEventListener("app:navigate:start", show);
      window.removeEventListener("app:navigate:end", hide);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{
            background: "rgba(11,17,32,0.88)",
            backdropFilter: "blur(12px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: 16 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-5"
          >
            {/* Logo con glow */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl blur-xl opacity-50"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
              />
              <div
                className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
              >
                <Car size={38} className="text-white" />
              </div>
            </div>

            {/* Nombre */}
            <div className="text-center">
              <p className="text-white font-bold text-2xl tracking-tight">
                Park<span style={{ color: "#06b6d4" }}>Go</span>
              </p>
              <p className="text-slate-500 text-xs mt-1 tracking-widest uppercase">
                Cargando…
              </p>
            </div>

            {/* Anillos contra-rotatorios */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-slate-700/60" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
              <div
                className="absolute inset-[3px] rounded-full border border-transparent border-t-cyan-400 animate-spin"
                style={{ animationDuration: "0.65s", animationDirection: "reverse" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
