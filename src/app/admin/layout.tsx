"use client";

import DashboardSidebar, {
  type NavItem,
} from "@/components/layout/DashboardSidebar";
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Users,
  CalendarCheck,
  CreditCard,
  Settings,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Parqueaderos", href: "/admin/parqueaderos", icon: Building2 },
  { label: "Operadores", href: "/admin/operadores", icon: UserCog },
  { label: "Conductores", href: "/admin/conductores", icon: Users },
  { label: "Reservas", href: "/admin/reservas", icon: CalendarCheck },
  { label: "Pagos", href: "/admin/pagos", icon: CreditCard },
  { label: "Parámetros", href: "/admin/parametros", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSidebar
      navItems={navItems}
      roleLabel="Administrador"
      roleColor="from-blue-600 to-cyan-500"
    >
      {children}
    </DashboardSidebar>
  );
}
