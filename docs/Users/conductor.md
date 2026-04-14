# conductor.md

> **Propósito de este documento:** Describir el rol **Conductor** dentro de la plataforma web de Parqueaderos Inteligentes, alineado con la base de datos real y la estructura de la aplicación implementada.

---

## 1. Identidad del rol

El Conductor (también llamado "cliente") es el usuario final de la plataforma (`id_role = 3` en la tabla `Roles`). Es la persona que busca un parqueadero, crea una reserva y paga por ella. **Se registra de forma autónoma** a través del formulario en `/register`; no requiere aprobación.

Un conductor puede tener **múltiples vehículos** registrados bajo la misma cuenta (tabla `Vehicle`).

---

## 2. Registro

### 2.1 Formulario de registro

Ruta: `/register`

Campos del formulario implementado:

| Campo | Validación |
|---|---|
| Nombre (first_name) | Requerido |
| Segundo nombre (second_name) | Opcional |
| Apellido (last_name) | Requerido |
| Email | Formato válido, único |
| Contraseña | Mínimo requerido por Supabase |
| Confirmar contraseña | Debe coincidir |
| Número de documento (document) | Requerido |
| Tipo de documento (id_document_type) | Select: CC, CE, PE |
| Teléfono (phone_number) | Requerido |

### 2.2 Flujo de creación de cuenta

1. El frontend valida los campos y envía el formulario.
2. El server action `signUp` en `src/lib/actions/auth.ts`:
   a. Llama a `supabase.auth.signUp({ email, password })` para crear el usuario en Supabase Auth.
   b. Usa `createAdminClient()` para insertar el perfil en la tabla `Users` con `id_role = 3` (Conductor).
3. Supabase Auth envía un **correo de verificación**.
4. El usuario ve una pantalla de confirmación indicando que debe verificar su correo.
5. Al confirmar, Supabase redirige a `/auth/callback` que intercambia el código por una sesión.

---

## 3. Inicio de sesión

Ruta: `/login`

- **Email + contraseña** mediante `supabase.auth.signInWithPassword`.
- Tras login exitoso, redirige a `/`.
- El middleware (`proxy.ts`) protege rutas `/conductor/*` verificando sesión + `id_role = 3`.

---

## 4. Estructura del panel de Conductor

El panel vive bajo `/conductor` con su propio sidebar (`DashboardSidebar` con color `from-emerald-500 to-teal-500`).

### 4.1 Secciones implementadas

| Ruta | Sección | Descripción |
|---|---|---|
| `/conductor` | Inicio | Saludo personalizado + tarjetas resumen (vehículos, reservas, pagos) |
| `/conductor/reservas` | Mis reservas | Tabla con historial de reservas del conductor |
| `/conductor/vehiculos` | Mis vehículos | Listado de vehículos registrados (placa + tipo) |
| `/conductor/pagos` | Mis pagos | Tabla con historial de pagos |
| `/conductor/perfil` | Mi perfil | Información personal del conductor (lectura) |

### 4.2 Funcionalidad planificada (por implementar)

| Funcionalidad | Descripción |
|---|---|
| Registrar vehículo | Formulario para agregar vehículos a la cuenta |
| Crear reserva | Flujo completo: seleccionar parqueadero → espacio → pagar |
| Cancelar reserva | Botón para cancelar reservas en estado confirmada |
| Editar perfil | Modificar nombre, teléfono |
| Cambiar contraseña | Ingresando contraseña actual |
| Buscar parqueaderos | Búsqueda por geolocalización o dirección |
| Descargar recibo PDF | Generar recibo de pago en PDF |

---

## 5. Flujo de datos del Conductor

Las páginas del conductor obtienen datos así:

1. `createClient().auth.getUser()` → obtiene el email del usuario autenticado.
2. `createAdminClient().from("Users").select(...).eq("email", email)` → obtiene `id` del conductor.
3. `createAdminClient().from("Vehicle").select(...).eq("id_user", userId)` → obtiene vehículos.
4. Con los `vehicleIds`, consulta `Reservations` y `Payments` filtrados por `id_car IN (vehicleIds)`.

Este patrón se repite en todas las páginas del conductor. La relación indirecta es:
```
Users → Vehicle (id_user) → Reservations (id_car) → Payments (id_car, id_reservation)
```

---

## 6. Gestión de vehículos

Tabla `Vehicle`:

```sql
CREATE TABLE "Vehicle" (
    id SERIAL PRIMARY KEY,
    plate TEXT NOT NULL,
    id_typev INTEGER NOT NULL REFERENCES "TypeVehicles"(id),
    id_user INTEGER REFERENCES "Users"(id)
);
```

Actualmente solo lectura en `/conductor/vehiculos`. El CRUD de vehículos es funcionalidad planificada.

---

## 7. Reservas del Conductor

Tabla `Reservations`:

```sql
CREATE TABLE "Reservations" (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    id_space INTEGER NOT NULL REFERENCES "Spaces"(id),
    id_car INTEGER NOT NULL REFERENCES "Vehicle"(id)
);
```

La página `/conductor/reservas` muestra las reservas cuyos `id_car` pertenecen a los vehículos del conductor, con joins a `Spaces`, `Parkings` y `Vehicle`.

### 7.1 Flujo de creación de reserva (planificado)

1. Conductor busca parqueadero en `/parqueaderos` (público).
2. Selecciona espacio disponible + fecha/hora.
3. Selecciona vehículo de los registrados.
4. Pago via pasarela (por implementar).
5. Se crea registro en `Reservations` + `Payments`.

---

## 8. Pagos del Conductor

Tabla `Payments`:

```sql
CREATE TABLE "Payments" (
    id SERIAL PRIMARY KEY,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    id_car INTEGER NOT NULL REFERENCES "Vehicle"(id),
    id_reservation INTEGER NOT NULL REFERENCES "Reservations"(id)
);
```

La página `/conductor/pagos` muestra pagos con monto, estado, vehículo y parqueadero.

---

## 9. Páginas públicas accesibles al conductor (sin panel)

Estas páginas son accesibles sin autenticación pero el conductor las usa para buscar dónde estacionar:

| Ruta | Descripción |
|---|---|
| `/` | Landing page con estadísticas generales |
| `/parqueaderos` | Mapa Leaflet + listado de parqueaderos con espacios disponibles |
| `/reservar` | Placeholder — futuro flujo de reserva |

---

## 10. Seguridad

- Las rutas `/conductor/*` son protegidas por el middleware. Se verifica sesión + `id_role = 3`.
- Cada consulta filtra datos exclusivamente por los vehículos del conductor autenticado.
- El registro inserta con `id_role = 3` usando el admin client (el conductor no puede elegir su rol).
- Las consultas usan `createAdminClient()` en server components, nunca desde el cliente.
