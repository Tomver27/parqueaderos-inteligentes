# Estructura de Carpetas — Parqueaderos Inteligentes

Documento que describe la organización de carpetas de la aplicación Next.js y la lógica detrás de cada zona de rutas.

---

## Principio de diseño

La aplicación se divide en **4 zonas** según nivel de acceso:

| Zona | Layout | Acceso |
|---|---|---|
| `(public)` | Navbar + Footer público | Todos |
| `(auth)` | Card centrada sin navbar | No autenticados |
| `admin/` | Sidebar admin (azul) | Solo `id_role = 1` |
| `operador/` | Sidebar operador (violeta) | Solo `id_role = 2` |
| `conductor/` | Sidebar conductor (verde) | Solo `id_role = 3` |

Los paréntesis `()` en Next.js son **route groups** — agrupan archivos bajo un layout compartido SIN afectar la URL.

---

## Árbol completo

```
src/
├── app/
│   ├── layout.tsx                          # Root Layout (fuentes, html, body)
│   │
│   ├── (auth)/                             # ── ZONA AUTH ──
│   │   ├── layout.tsx                      # Card centrada, fondo #0b1120
│   │   ├── login/page.tsx                  # /login
│   │   └── register/page.tsx               # /register
│   │
│   ├── (public)/                           # ── ZONA PÚBLICA ──
│   │   ├── layout.tsx                      # Navbar + Footer
│   │   ├── page.tsx                        # / (landing con stats reales)
│   │   ├── parqueaderos/page.tsx           # /parqueaderos (mapa + lista)
│   │   └── reservar/page.tsx               # /reservar (placeholder)
│   │
│   ├── admin/                              # ── PANEL ADMINISTRADOR ──
│   │   ├── layout.tsx                      # Sidebar con DashboardSidebar
│   │   ├── page.tsx                        # /admin (dashboard global)
│   │   ├── parqueaderos/page.tsx           # /admin/parqueaderos
│   │   ├── operadores/page.tsx             # /admin/operadores
│   │   ├── conductores/page.tsx            # /admin/conductores
│   │   ├── reservas/page.tsx               # /admin/reservas
│   │   ├── pagos/page.tsx                  # /admin/pagos
│   │   └── parametros/page.tsx             # /admin/parametros
│   │
│   ├── operador/                           # ── PANEL OPERADOR ──
│   │   ├── layout.tsx                      # Sidebar con DashboardSidebar
│   │   ├── page.tsx                        # /operador (dashboard parqueadero)
│   │   ├── espacios/page.tsx               # /operador/espacios
│   │   ├── reservas/page.tsx               # /operador/reservas
│   │   ├── ingresos/page.tsx               # /operador/ingresos
│   │   └── configuracion/page.tsx          # /operador/configuracion
│   │
│   ├── conductor/                          # ── PANEL CONDUCTOR ──
│   │   ├── layout.tsx                      # Sidebar con DashboardSidebar
│   │   ├── page.tsx                        # /conductor (inicio personal)
│   │   ├── reservas/page.tsx               # /conductor/reservas
│   │   ├── vehiculos/page.tsx              # /conductor/vehiculos
│   │   ├── pagos/page.tsx                  # /conductor/pagos
│   │   └── perfil/page.tsx                 # /conductor/perfil
│   │
│   ├── api/
│   │   ├── me/route.ts                     # GET → { firstName, role, roleId }
│   │   └── sensors/route.ts                # POST/GET sensores IoT
│   │
│   └── auth/
│       └── callback/route.ts               # Supabase email confirmation
│
├── components/
│   ├── auth/                               # LoginForm, RegisterForm
│   ├── landing/                            # HeroSection, StatsSection, etc.
│   ├── layout/                             # Navbar, Footer, DashboardSidebar
│   ├── map/                                # ParkingMap, ParkingMapWrapper (Leaflet)
│   ├── parking/                            # ParkingDetailCard, ParkingListSidebar, etc.
│   └── parkings/                           # ParkingCard, ParkingList
│
├── lib/
│   ├── actions/auth.ts                     # Server actions: signIn, signUp, signOut
│   ├── queries/stats.ts                    # getParkingStats() para landing
│   └── supabase/
│       ├── client.ts                       # Browser client (anon key)
│       └── server.ts                       # Server client + Admin client
│
├── styles/
│   └── globals.css                         # Tailwind + estilos globales
│
├── types/
│   └── index.ts                            # Parking, Space, ParkingWithSpaces, etc.
│
└── proxy.ts                                # Middleware: auth + role-based routing
```

---

## Middleware (`proxy.ts`)

El middleware intercepta TODAS las peticiones y decide:

1. **Rutas públicas** (`/`, `/parqueaderos`, `/reservar`, `/api/sensors`): pasan sin sesión.
2. **Rutas auth** (`/login`, `/register`): si ya hay sesión, redirige a `/`.
3. **Rutas protegidas**: si no hay sesión, redirige a `/login`.
4. **Rutas con rol** (`/admin/*`, `/operador/*`, `/conductor/*`): además de sesión, verifica `id_role` en la tabla `Users`. Si no coincide, redirige a `/`.

---

## Componente compartido: `DashboardSidebar`

Los 3 paneles de rol usan el mismo componente `DashboardSidebar` con props diferentes:

| Prop | Admin | Operador | Conductor |
|---|---|---|---|
| `roleLabel` | "Administrador" | "Operador" | "Conductor" |
| `roleColor` | `from-blue-600 to-cyan-500` | `from-violet-500 to-purple-500` | `from-emerald-500 to-teal-500` |
| `navItems` | 7 ítems | 5 ítems | 5 ítems |

Incluye: sidebar responsive, logo ParkGo, avatar del usuario, enlace "Volver al inicio", botón cerrar sesión.

---

## API `/api/me`

Retorna información del usuario autenticado para el Navbar:

```json
{
  "firstName": "Tomás",
  "role": "Conductor",
  "roleId": 3
}
```

El Navbar usa `role` para mostrar un enlace al panel correspondiente ("Panel Admin", "Panel Operador", "Mi Panel").
