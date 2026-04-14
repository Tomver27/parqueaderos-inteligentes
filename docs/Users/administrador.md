# administrador.md

> **Propósito de este documento:** Describir con exactitud la lógica de negocio, flujos de interacción y modelo de persistencia del rol **Administrador** dentro de la plataforma web de Parqueaderos Inteligentes. Este documento está escrito para ser consumido por un agente de IA que asistirá en el desarrollo; por tanto es exhaustivo, preciso y evita ambigüedades.

---

## 1. Identidad del rol

El Administrador es el **superusuario** de la plataforma. Existe un número reducido de cuentas con este rol (idealmente una por organización). Su acceso no es público: no hay registro abierto para administradores; las cuentas se crean manualmente desde Supabase o mediante un script de seed protegido.

El Administrador **no opera parqueaderos** directamente ni realiza reservas. Su función es la **gobernanza global** de la plataforma: datos maestros, usuarios, parqueaderos y métricas.

---

## 2. Autenticación y acceso

### 2.1 Inicio de sesión

- El Administrador accede mediante **email + contraseña** gestionado por Supabase Auth.
- **No existe OAuth** (Google u otro) para el rol Administrador, por seguridad.
- En la pantalla de login se presenta un **CAPTCHA** (hCaptcha o Cloudflare Turnstile) que debe resolverse antes de poder enviar las credenciales. El token del CAPTCHA se valida en el servidor (Next.js API Route) antes de llamar a Supabase Auth.
- Ante un intento de login fallido, Supabase Auth aplica rate-limiting nativo. Adicionalmente, el frontend registra intentos fallidos y bloquea temporalmente el formulario tras 5 intentos consecutivos.

### 2.2 Sesión

- La sesión se maneja mediante el JWT emitido por Supabase Auth, almacenado en una cookie `httpOnly` gestionada por el proxy de Next.js.
- El JWT contiene el claim `role: 'administrador'` insertado vía Custom Claims con un Supabase Database Hook (función PostgreSQL que enriquece el JWT en cada emisión).
- El proxy de Next.js valida el claim en cada petición a rutas protegidas bajo `/admin/*`. Si el claim no existe o el token expiró, redirige a `/login`.
- No existe recuperación de contraseña por correo para el Administrador (por política de seguridad); el restablecimiento se hace directamente en Supabase Dashboard.

---

## 3. Estructura de la interfaz (Panel de Administración)

El panel de administración vive bajo la ruta `/admin` y está completamente separado visualmente del portal de conductores y del panel de operadores.

Secciones principales:

| Sección | Descripción |
|---|---|
| Dashboard | Métricas globales en tiempo real y agregadas |
| Parqueaderos | CRUD completo de parqueaderos |
| Operadores | CRUD completo de cuentas de operador |
| Conductores | Lectura y moderación de cuentas de conductor |
| Reservas | Vista global de todas las reservas |
| Pagos | Vista global de todas las transacciones |
| Tablas maestras | Edición de catálogos del sistema |
| Configuración | Parámetros globales de la plataforma |

---

## 4. Dashboard

El dashboard es la pantalla de inicio del Administrador. Muestra indicadores calculados mediante **Supabase Views** o consultas directas desde Server Components de Next.js (no se usa Realtime aquí salvo para el contador de puestos ocupados).

### 4.1 Métricas globales (tarjetas superiores)

- **Total de parqueaderos activos:** `COUNT(*) FROM parqueaderos WHERE activo = true`
- **Total de conductores registrados:** `COUNT(*) FROM usuarios WHERE rol = 'conductor'`
- **Total de operadores activos:** `COUNT(*) FROM usuarios WHERE rol = 'operador' AND activo = true`
- **Reservas activas en este momento:** `COUNT(*) FROM reservas WHERE estado IN ('confirmada', 'en_curso')`
- **Ingresos totales del mes:** `SUM(monto) FROM pagos WHERE estado = 'exitoso' AND fecha >= inicio_del_mes`
- **Tasa de ocupación global:** `(puestos_ocupados / puestos_totales) * 100` calculada sobre la vista `v_ocupacion_global`

### 4.2 Gráficas

- **Reservas por día (últimos 30 días):** gráfica de barras. Fuente: `SELECT DATE(created_at), COUNT(*) FROM reservas GROUP BY 1`.
- **Ingresos por semana (últimas 8 semanas):** gráfica de línea.
- **Distribución de reservas por tipo de vehículo:** gráfica de dona.
- **Top 5 parqueaderos por ocupación:** tabla ordenada por `tasa_ocupacion DESC`.

Todas las gráficas se renderizan en el cliente con una librería como Recharts. Los datos se obtienen desde API Routes de Next.js que ejecutan las consultas al momento del request (no hay cache agresivo en el dashboard de administración).

---

## 5. Gestión de Parqueaderos

El Administrador tiene acceso total al CRUD de la tabla `parqueaderos`.

### 5.1 Tabla `parqueaderos` (esquema relevante)

```sql
parqueaderos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL,
  direccion       text NOT NULL,
  latitud         numeric(10,7) NOT NULL,
  longitud        numeric(10,7) NOT NULL,
  total_puestos   integer NOT NULL CHECK (total_puestos > 0),
  activo          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

### 5.2 Operaciones disponibles

| Operación | Detalle |
|---|---|
| Crear parqueadero | El admin ingresa nombre, dirección, coordenadas y total de puestos. Al crear, se generan automáticamente los registros en `puestos` (un registro por puesto, numerados). |
| Editar parqueadero | Puede modificar cualquier campo. Si cambia `total_puestos`, el sistema ajusta la tabla `puestos` (agrega o marca como eliminados los sobrantes). |
| Activar / Desactivar | Toggle del campo `activo`. Un parqueadero inactivo no aparece en búsquedas de conductores ni acepta nuevas reservas. Las reservas existentes no se cancelan automáticamente (el admin debe gestionarlas manualmente). |
| Eliminar | Soft delete: campo `deleted_at timestamptz`. Los registros eliminados no se borran de la base de datos para preservar el historial de reservas y pagos asociados. |

### 5.3 Vista detalle de un parqueadero

Desde la lista de parqueaderos, el admin puede entrar al detalle de uno y ver:
- Datos básicos y políticas actuales.
- Operadores asignados (con opción de reasignar).
- Listado de puestos y su estado actual.
- Historial de reservas del parqueadero.
- Ingresos históricos del parqueadero.

---

## 6. Gestión de Operadores

### 6.1 Crear operador

El flujo para crear un operador desde el panel del Administrador es:

1. Admin completa el formulario: nombre, email, contraseña temporal, parqueadero(s) asignado(s).
2. El frontend llama a una **Next.js API Route** protegida (`POST /api/admin/operadores`).
3. La API Route usa el **Supabase Admin SDK** (`supabaseAdmin.auth.admin.createUser`) para crear el usuario en Supabase Auth sin necesidad de verificación de correo.
4. Inmediatamente después inserta un registro en la tabla `perfiles`:

```sql
perfiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  rol         text NOT NULL CHECK (rol IN ('conductor', 'operador', 'administrador')),
  nombre      text,
  telefono    text,
  activo      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
)
```

5. Inserta en `operador_parqueadero` la relación entre el operador y su(s) parqueadero(s).
6. Se envía un correo al operador (via Resend) con sus credenciales temporales y un enlace para cambiar la contraseña en el primer ingreso.

### 6.2 Editar operador

El admin puede modificar: nombre, email, parqueaderos asignados y estado (`activo`). Cambiar el email actualiza también `auth.users` vía Admin SDK.

### 6.3 Desactivar / reactivar operador

Toggle del campo `activo` en `perfiles`. Un operador inactivo no puede iniciar sesión (el proxy lo detecta y rechaza la sesión aunque el JWT sea válido).

### 6.4 Eliminar operador

Soft delete en `perfiles` (campo `deleted_at`). El usuario en `auth.users` se desactiva pero no se borra para preservar auditoría.

---

## 7. Gestión de Conductores

El Administrador **no crea conductores** (ellos se registran solos), pero puede:

- **Ver** el listado completo de conductores con filtros (fecha de registro, estado, número de reservas).
- **Ver el detalle** de un conductor: datos personales, vehículos registrados, historial de reservas y pagos.
- **Desactivar** una cuenta de conductor (soft disable). El conductor no podrá iniciar sesión ni crear nuevas reservas. Sus reservas activas quedan en estado `suspendida` hasta que el admin las gestione.
- **Reactivar** una cuenta desactivada.
- **No puede** ver ni editar la contraseña de un conductor.

---

## 8. Vista global de Reservas

El admin tiene una tabla paginada con todas las reservas del sistema. Columnas: ID de reserva, conductor, parqueadero, puesto, fecha de inicio, fecha de fin, estado, monto pagado.

Filtros disponibles: parqueadero, estado, rango de fechas, tipo de vehículo.

El admin puede:
- **Ver el detalle completo** de cualquier reserva.
- **Cambiar manualmente el estado** de una reserva (para corrección de errores operativos): `confirmada → cancelada`, `en_curso → finalizada`, etc. Cada cambio manual queda registrado en `reservas_log` con el `user_id` del admin y un campo `motivo` obligatorio.
- **No puede crear reservas** (eso es exclusivo del conductor).

---

## 9. Vista global de Pagos

Tabla paginada con todas las transacciones. Columnas: ID de pago, conductor, reserva, monto, método, estado, fecha.

Estados posibles de un pago: `pendiente`, `exitoso`, `fallido`, `reembolsado`.

El admin puede:
- **Ver el detalle** de cualquier pago incluyendo la referencia de la pasarela.
- **Registrar manualmente un reembolso** (cuando la gestión se hizo fuera de la plataforma). Esto actualiza el estado del pago a `reembolsado` y deja registro en `pagos_log`.
- **Exportar** el listado de pagos en CSV para conciliación contable.

---

## 10. Tablas maestras (Catálogos)

El Administrador es el único rol que puede editar las tablas de referencia del sistema:

| Tabla | Propósito |
|---|---|
| `tipos_vehiculo` | Catálogo de tipos de vehículo (carro, moto, bicicleta, camión, etc.) |
| `estados_reserva` | Catálogo de estados válidos para una reserva |
| `metodos_pago` | Métodos de pago habilitados en la pasarela |
| `categorias_puesto` | Tipos de puesto (estándar, discapacidad, moto, bicicleta, VIP) |

La edición de estas tablas es directa (formulario de CRUD simple). Los cambios se propagan inmediatamente al resto del sistema porque las demás tablas referencian estas por FK.

> **Restricción:** No se puede eliminar un registro de tabla maestra que tenga registros hijos activos. El sistema valida esto antes de ejecutar el DELETE y muestra un mensaje descriptivo del error.

---

## 11. Configuración global

El admin puede editar parámetros globales almacenados en la tabla `configuracion`:

```sql
configuracion (
  clave   text PRIMARY KEY,
  valor   text NOT NULL,
  tipo    text CHECK (tipo IN ('string', 'integer', 'boolean', 'decimal')),
  descripcion text
)
```

Parámetros relevantes:

| Clave | Descripción | Valor por defecto |
|---|---|---|
| `captcha_habilitado` | Activa/desactiva el CAPTCHA en login | `true` |
| `tolerancia_llegada_minutos` | Minutos de gracia antes de marcar no-presentación | `15` |
| `max_cancelaciones_por_mes` | Máximo de cancelaciones permitidas a un conductor por mes | `5` |
| `radio_busqueda_km` | Radio por defecto para búsqueda de parqueaderos | `5` |
| `moneda` | Moneda del sistema | `COP` |

---

## 12. Modelo de persistencia — resumen de tablas que el Administrador puede leer y escribir

| Tabla | Permisos del Admin |
|---|---|
| `parqueaderos` | SELECT, INSERT, UPDATE, soft DELETE |
| `puestos` | SELECT, INSERT, UPDATE |
| `perfiles` | SELECT, UPDATE (activo, deleted_at) |
| `auth.users` | Via Admin SDK: CREATE, UPDATE email, DISABLE |
| `operador_parqueadero` | SELECT, INSERT, UPDATE, DELETE |
| `reservas` | SELECT, UPDATE (estado, motivo) |
| `reservas_log` | SELECT, INSERT |
| `pagos` | SELECT, UPDATE (estado reembolsado) |
| `pagos_log` | SELECT, INSERT |
| `tipos_vehiculo` | SELECT, INSERT, UPDATE, DELETE (con validación de hijos) |
| `estados_reserva` | SELECT, INSERT, UPDATE, DELETE (con validación de hijos) |
| `metodos_pago` | SELECT, INSERT, UPDATE, DELETE |
| `categorias_puesto` | SELECT, INSERT, UPDATE, DELETE (con validación de hijos) |
| `configuracion` | SELECT, UPDATE |

La seguridad de estos permisos se implementa mediante **RLS policies** en Supabase que verifican `auth.jwt() ->> 'role' = 'administrador'` en cada operación.
