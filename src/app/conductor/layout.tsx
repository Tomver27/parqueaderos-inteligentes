"use client";

import DashboardSidebar, {
  type NavItem,
} from "@/components/layout/DashboardSidebar";
import {
  LayoutDashboard,
  CalendarCheck,
  CarFront,
  CreditCard,
  UserCircle,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Inicio", href: "/conductor", icon: LayoutDashboard },
  { label: "Mis reservas", href: "/conductor/reservas", icon: CalendarCheck },
  { label: "Mis vehículos", href: "/conductor/vehiculos", icon: CarFront },
  { label: "Mis pagos", href: "/conductor/pagos", icon: CreditCard },
  { label: "Mi perfil", href: "/conductor/perfil", icon: UserCircle },
];

export default function ConductorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSidebar
      navItems={navItems}
      roleLabel="Conductor"
      roleColor="from-emerald-500 to-teal-500"
    >
      {children}
    </DashboardSidebar>
  );
}
