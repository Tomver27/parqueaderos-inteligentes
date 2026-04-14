# operador.md

> **Propósito de este documento:** Describir el rol **Operador** dentro de la plataforma web de Parqueaderos Inteligentes, alineado con la base de datos real y la estructura de la aplicación implementada.

---

## 1. Identidad del rol

El Operador es la persona responsable de gestionar uno o más parqueaderos dentro de la plataforma (`id_role = 2` en la tabla `Roles`). **No puede registrarse por su cuenta:** su cuenta es creada por el Administrador (o por otro operador, en futuro).

Un Operador está siempre ligado a al menos un parqueadero via la tabla `ParkingOperators`. Toda acción que realice está **acotada al alcance de los parqueaderos que le fueron asignados**.

---

## 2. Autenticación y acceso

### 2.1 Inicio de sesión

- El Operador accede mediante **email + contraseña** gestionado por Supabase Auth.
- Usa la misma pantalla de login general (`/login`).
- El middleware (`proxy.ts`) valida la sesión y, para rutas bajo `/operador/*`, consulta `Users` para verificar `id_role = 2`. Si no coincide, redirige a `/`.

### 2.2 Sesión

- JWT emitido por Supabase Auth, almacenado en cookies gestionadas por el middleware.
- Al acceder a `/api/me`, retorna `{ firstName, role: "Operador", roleId: 2 }`.
- El Navbar público muestra un enlace "Panel Operador" cuando el usuario tiene rol Operador.

---

## 3. Estructura del panel de Operador

El panel de operador vive bajo `/operador` con su propio sidebar (`DashboardSidebar` con color `from-violet-500 to-purple-500`).

### 3.1 Secciones implementadas

| Ruta | Sección | Descripción |
|---|---|---|
| `/operador` | Dashboard | Métricas del parqueadero asignado (espacios, ocupados, reservas hoy) |
| `/operador/espacios` | Espacios | Listado de espacios del parqueadero con tipo de vehículo |
| `/operador/reservas` | Reservas | Reservas de los espacios del parqueadero |
| `/operador/ingresos` | Ingresos | Placeholder — resumen financiero (por implementar) |
| `/operador/configuracion` | Configuración | Parámetros operativos del parqueadero (lectura) |

### 3.2 Funcionalidad planificada (por implementar)

| Funcionalidad | Descripción |
|---|---|
| Editar configuración | Modificar horarios, tolerancia de llegada y tarifas |
| Marcar espacios fuera de servicio | Toggle de estado en la tabla `Spaces` |
| Marcar reservas como no-presentada | Cambiar estado de reserva tras tolerancia expirada |
| Finalizar reserva manualmente | Para conductores que olvidan registrar salida |
| Gráficas de ocupación | Ocupación por hora, reservas de últimos 7 días |
| Crear otros operadores | Solo para los parqueaderos que el operador gestiona |

---

## 4. Dashboard (`/operador`)

El dashboard muestra métricas del parqueadero asignado al operador. El flujo es:

1. Se obtiene el email del usuario autenticado via `createClient().auth.getUser()`.
2. Se busca el `id` del usuario en `Users` por email.
3. Se consulta `ParkingOperators` para obtener los `id_parking` asignados.
4. Se calculan métricas solo para esos parqueaderos:

| Métrica | Consulta (filtrada por parkingIds) |
|---|---|
| Espacios totales | `count(*) FROM "Spaces" WHERE id_parking IN (parkingIds)` |
| Ocupados ahora | `count(*) FROM "Occupations" WHERE end_date IS NULL` (con join a Spaces del parqueadero) |
| Reservas hoy | `count(*) FROM "Reservations"` (con join a Spaces del parqueadero, filtro fecha hoy) |

---

## 5. Relación Operador ↔ Parqueadero

La relación se almacena en `ParkingOperators`:

```sql
CREATE TABLE "ParkingOperators" (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES "Users"(id),
    id_parking INTEGER NOT NULL REFERENCES "Parkings"(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Un operador puede tener múltiples asignaciones (un registro por parqueadero). Si tiene más de uno, el dashboard muestra los datos del primero (en futuro: selector de parqueadero en la cabecera).

---

## 6. Tabla `Parameters` (Configuración por parqueadero)

```sql
CREATE TABLE "Parameters" (
    id SERIAL PRIMARY KEY,
    expires_reservation NUMERIC NOT NULL,   -- Minutos para expirar una reserva
    deadline_reservation NUMERIC NOT NULL,  -- Minutos límite para reservar
    cost_reservation NUMERIC NOT NULL,      -- Costo de la reserva
    fee NUMERIC NOT NULL,                   -- Tarifa por hora
    id_parking INTEGER NOT NULL UNIQUE REFERENCES "Parkings"(id)
);
```

Relación 1-a-1 con `Parkings`. El operador puede ver estos parámetros en `/operador/configuracion`.

---

## 7. Seguridad

- Las rutas `/operador/*` son protegidas por el middleware. Se verifica sesión + `id_role = 2`.
- Las consultas filtran datos exclusivamente por los `id_parking` asignados al operador via `ParkingOperators`.
- Usa `createAdminClient()` para queries (sin RLS) pero siempre filtrado por parqueaderos del operador.
