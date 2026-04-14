"use client";

import DashboardSidebar, {
  type NavItem,
} from "@/components/layout/DashboardSidebar";
import {
  LayoutDashboard,
  ParkingSquare,
  CalendarCheck,
  DollarSign,
  Settings,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/operador", icon: LayoutDashboard },
  { label: "Espacios", href: "/operador/espacios", icon: ParkingSquare },
  { label: "Reservas", href: "/operador/reservas", icon: CalendarCheck },
  { label: "Ingresos", href: "/operador/ingresos", icon: DollarSign },
  { label: "Configuración", href: "/operador/configuracion", icon: Settings },
];

export default function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSidebar
      navItems={navItems}
      roleLabel="Operador"
      roleColor="from-violet-500 to-purple-500"
    >
      {children}
    </DashboardSidebar>
  );
}
