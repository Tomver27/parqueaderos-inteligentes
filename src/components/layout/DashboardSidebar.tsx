"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Car,
  LogOut,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type Props = {
  navItems: NavItem[];
  roleLabel: string;
  roleColor: string; // tailwind gradient e.g. "from-blue-500 to-cyan-500"
  children: React.ReactNode;
};

export default function DashboardSidebar({
  navItems,
  roleLabel,
  roleColor,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: { firstName: string | null }) => setFirstName(d.firstName))
      .catch(() => setFirstName(null));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-[#0b1120]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-white/[0.07] bg-[#0f172a]
          transition-transform duration-200
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo + role */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              }}
            >
              <Car size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold leading-none">
                Park<span className="text-cyan-400">Go</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href.split("/").length >= 3 && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${
                    active
                      ? `bg-gradient-to-r ${roleColor} text-white`
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.07] p-4 space-y-3">
          {firstName && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{firstName}</span>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={14} />
            Volver al inicio
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: "rgba(239,68,68,0.12)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="text-white text-sm font-semibold">
            Park<span className="text-cyan-400">Go</span>
            <span className="text-slate-500 text-xs ml-2 font-normal uppercase tracking-wider">
              {roleLabel}
            </span>
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
