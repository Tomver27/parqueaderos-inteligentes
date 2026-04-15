# administrador.md

> **Propósito de este documento:** Describir el rol **Administrador** dentro de la plataforma web de Parqueaderos Inteligentes, alineado con la base de datos real y la estructura de la aplicación implementada.

---

## 1. Identidad del rol

El Administrador es el **superusuario** de la plataforma (`id_role = 1` en la tabla `Roles`). Existe un número reducido de cuentas con este rol. Su acceso no es público: las cuentas se crean manualmente desde Supabase o mediante el script de seed.

El Administrador **no opera parqueaderos** directamente ni realiza reservas. Su función es la **gobernanza global** de la plataforma: datos maestros, usuarios, parqueaderos y métricas.

---

## 2. Autenticación y acceso

### 2.1 Inicio de sesión

- El Administrador accede mediante **email + contraseña** gestionado por Supabase Auth.
- Usa la misma pantalla de login general (`/login`).
- El middleware (`proxy.ts`) valida la sesión y, para rutas bajo `/admin/*`, consulta la tabla `Users` para verificar que `id_role = 1`. Si no coincide, redirige a `/`.

### 2.2 Sesión

- La sesión se maneja mediante el JWT emitido por Supabase Auth, almacenado en cookies gestionadas por el middleware de Next.js.
- Al acceder a `/api/me`, el servidor retorna `{ firstName, role: "Administrador", roleId: 1 }`.
- El Navbar público muestra un enlace "Panel Admin" en el menú hamburguesa cuando el usuario tiene rol Administrador.

---

## 3. Estructura de la interfaz (Panel de Administración)

El panel de administración vive bajo la ruta `/admin` y usa un layout con sidebar lateral propio (`DashboardSidebar` con color `from-blue-600 to-cyan-500`), completamente separado de la navegación pública (Navbar + Footer).

### 3.1 Secciones implementadas

| Ruta | Sección | Descripción |
|---|---|---|
| `/admin` | Dashboard | Tarjetas con métricas globales (parkings, conductores, operadores, reservas hoy, ocupados) |
| `/admin/parqueaderos` | Parqueaderos | Listado + mapa Leaflet de todas las sedes |
| `/admin/operadores` | Operadores | Tabla con nombre, email, teléfono de usuarios con `id_role = 2` |
| `/admin/conductores` | Conductores | Tabla con nombre, email, teléfono, fecha de registro de usuarios con `id_role = 3` |
| `/admin/reservas` | Reservas | Vista global de reservas con espacio, parqueadero y vehículo |
| `/admin/pagos` | Pagos | Vista global de pagos con monto, estado, vehículo y parqueadero |
| `/admin/parametros` | Parámetros | Configuración por parqueadero (expiración, límite, costo, tarifa) |

### 3.2 Funcionalidad planificada (por implementar)

| Funcionalidad | Descripción |
|---|---|
| CRUD Parqueaderos | Crear, editar, activar/desactivar parqueaderos. Al crear, generar registros en `Spaces`. |
| CRUD Operadores | Crear operadores con `supabaseAdmin.auth.admin.createUser`, insertar en `Users` y `ParkingOperators`. |
| Moderación Conductores | Desactivar/reactivar conductores. |
| Cambio estado Reservas | Modificar estado de reservas manualmente con motivo (requiere campo `status` en `Reservations`). |
| Exportación CSV | Exportar listados de pagos para conciliación contable. |
| Tablas maestras | CRUD de `DocumentTypes`, `TypeVehicles`. |
| Gráficas | Reservas por día, ingresos por semana, distribución por tipo de vehículo (con Recharts). |

---

## 4. Dashboard (`/admin`)

Métricas calculadas en server component con `createAdminClient()`:

| Métrica | Consulta |
|---|---|
| Total de parqueaderos | `SELECT count(*) FROM "Parkings"` |
| Total de conductores | `SELECT count(*) FROM "Users" WHERE id_role = 3` |
| Total de operadores | `SELECT count(*) FROM "Users" WHERE id_role = 2` |
| Reservas hoy | `SELECT count(*) FROM "Reservations" WHERE date >= hoy AND date < mañana` (solo espacios con `bookable = true`) |
| Espacios ocupados ahora | `SELECT count(*) FROM "Occupations" WHERE end_date IS NULL` (todos los espacios, bookable y no bookable) |

---

## 5. Modelo de datos — Tablas del sistema

Todas las consultas del panel admin usan `createAdminClient()` (service role key, sin RLS).

| Tabla | Campos clave |
|---|---|
| `Parkings` | id, name, latitude, longitude, address |
| `Spaces` | id, name, **bookable** (bool, default true), id_parking → `Parkings`, id_typev → `TypeVehicles`. `bookable = true` → reservable por web; `bookable = false` → uso libre, solo `Occupations` |
| `Users` | id, document, first_name, second_name, last_name, email, phone_number, created_at, id_document_type → `DocumentTypes`, id_role → `Roles` |
| `Roles` | id (1=Administrador, 2=Operador, 3=Conductor), name, description |
| `DocumentTypes` | id, name, name_normalized (CC, CE, PE) |
| `TypeVehicles` | id, name (Automóvil, Moto) |
| `Vehicle` | id, plate, id_typev → `TypeVehicles`, id_user → `Users` |
| `Reservations` | id, date, expires_at, id_space → `Spaces`, id_car → `Vehicle` |
| `Payments` | id, amount, currency, idempotency_key, status, id_car → `Vehicle`, id_reservation → `Reservations` |
| `Occupations` | id, start_date, end_date, id_space → `Spaces`, id_car → `Vehicle` |
| `ParkingOperators` | id, id_user → `Users`, id_parking → `Parkings`, assigned_at |
| `Parameters` | id, expires_reservation, deadline_reservation, cost_reservation, fee, id_parking → `Parkings` (1-a-1) |

---

## 6. Seguridad

- Las rutas `/admin/*` son protegidas por el middleware (`src/proxy.ts`). Se verifica:
  1. Sesión activa (JWT válido via `supabase.auth.getUser()`).
  2. `id_role = 1` en la tabla `Users` (consultada con admin client en el middleware).
- Si falla alguna verificación, se redirige a `/` (home) o `/login`.
- Todas las consultas de datos usan `createAdminClient()`, que bypasea RLS. Solo se ejecutan desde server components, nunca desde el cliente.
