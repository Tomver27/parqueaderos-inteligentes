"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  MapPin,
  CalendarCheck,
  Car,
  ChevronRight,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  {
    id: "nearby",
    label: "Parqueaderos cercanos",
    icon: MapPin,
    description: "Encuentra los parqueaderos más cercanos a tu ubicación",
    path: "/parqueaderos",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "reserve",
    label: "Reserva tu puesto",
    icon: CalendarCheck,
    description: "Reserva un espacio con anticipación y sin complicaciones",
    path: "/reservar",
    color: "from-purple-500 to-indigo-500",
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data: { firstName: string | null }) => {
        setFirstName(data.firstName);
      })
      .catch(() => setFirstName(null));
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setFirstName(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(11,17,32,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
          }}
        >
          <Car size={20} className="text-white" />
        </div>
        <span
          className="text-white"
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Park<span style={{ color: "#06b6d4" }}>Go</span>
        </span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-3" ref={menuRef}>
        {/* Login button / User greeting */}
        {firstName ? (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#cbd5e1",
            }}
          >
            <User size={15} />
            <span className="hidden sm:inline">Bienvenido, {firstName}</span>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:bg-white/10"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#cbd5e1",
            }}
          >
            <User size={15} />
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
        )}

        {/* Hamburger menu */}
        <button
          onClick={() => {
            setMenuOpen(!menuOpen);
            setUserMenuOpen(false);
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
          style={{
            background: menuOpen
              ? "linear-gradient(135deg,#3b82f6,#06b6d4)"
              : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Expandable Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-6 top-16 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
              style={{
                background: "#131e35",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="p-4 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#64748b" }}
                >
                  Menú principal
                </p>
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all group hover:bg-white/5"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${item.color}`}
                    >
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white text-sm"
                        style={{ fontWeight: 600 }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "#64748b" }}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      style={{ color: "#475569" }}
                      className="group-hover:text-white transition-colors"
                    />
                  </Link>
                );
              })}
              <div
                className="p-4 border-t"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                {firstName ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 cursor-pointer"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                      fontWeight: 600,
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogIn size={15} />
                    Iniciar sesión / Registrarse
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
