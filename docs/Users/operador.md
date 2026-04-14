# operador.md

> **Propósito de este documento:** Describir con exactitud la lógica de negocio, flujos de interacción y modelo de persistencia del rol **Operador** dentro de la plataforma web de Parqueaderos Inteligentes. Este documento está escrito para ser consumido por un agente de IA que asistirá en el desarrollo; por tanto es exhaustivo, preciso y evita ambigüedades.

---

## 1. Identidad del rol

El Operador es la persona responsable de gestionar uno o más parqueaderos dentro de la plataforma. **No puede registrarse por su cuenta:** su cuenta es creada por el Administrador o por otro Operador con permisos suficientes (ver sección 6).

Un Operador está siempre ligado a al menos un parqueadero. Toda acción que realice está **acotada al alcance de los parqueaderos que le fueron asignados**: no puede ver ni modificar datos de parqueaderos ajenos.

---

## 2. Autenticación y acceso

### 2.1 Inicio de sesión

- El Operador accede mediante **email + contraseña** gestionado por Supabase Auth.
- **No existe OAuth** para el rol Operador.
- En la pantalla de login (ruta `/operador/login`, independiente del login de conductores) se presenta un **CAPTCHA** (hCaptcha o Cloudflare Turnstile) que debe resolverse correctamente antes de poder enviar las credenciales. El token del CAPTCHA se valida en una Next.js API Route antes de invocar Supabase Auth.
- Tras 5 intentos fallidos consecutivos, el formulario se bloquea durante 10 minutos en el cliente. Supabase Auth aplica su propio rate-limiting adicional en el servidor.

### 2.2 Primer inicio de sesión

Cuando el Administrador o un Operador crea una nueva cuenta de Operador, la cuenta llega con una **contraseña temporal**. En el primer login, el sistema detecta el flag `requiere_cambio_contrasena = true` en la tabla `perfiles` y redirige obligatoriamente al flujo de cambio de contraseña antes de mostrar el panel. No se puede omitir este paso.

### 2.3 Sesión

- JWT emitido por Supabase Auth con el claim `role: 'operador'` y un claim adicional `parqueadero_ids: [uuid, ...]` con los IDs de los parqueaderos asignados.
- Estos claims se insertan mediante un Supabase Database Hook (función PostgreSQL que consulta `operador_parqueadero` en cada emisión de token).
- El middleware de Next.js valida el claim `role` en cada petición a rutas bajo `/operador/*`.
- Duración del JWT: 1 hora. El refresh token dura 7 días.

### 2.4 Cambio de contraseña

Disponible desde la sección de perfil en cualquier momento. El Operador ingresa su contraseña actual, la nueva contraseña y la confirmación. La actualización se realiza vía `supabase.auth.updateUser({ password })`.

### 2.5 Recuperación de contraseña

Si el Operador olvida su contraseña, puede usar el flujo de **recuperación por correo** en la pantalla de login. El sistema envía un enlace de restablecimiento con expiración de 15 minutos. El enlace es de un solo uso y se invalida tras ser utilizado. No hay CAPTCHA en esta pantalla (para no bloquear a operadores legítimos), pero sí rate-limiting estricto por IP en la API Route que lo gestiona.

---

## 3. Estructura del panel de Operador

El panel de operador vive bajo `/operador` y es completamente independiente del portal del conductor.

| Sección | Descripción |
|---|---|
| Dashboard | Métricas del parqueadero en tiempo real y agregadas |
| Mi parqueadero | Configuración y parametrización |
| Puestos | Layout y estado de puestos |
| Reservas | Gestión de reservas del parqueadero |
| Ingresos | Resumen financiero |
| Operadores | Creación y gestión de operadores subordinados |
| Mi perfil | Datos personales y cambio de contraseña |

Si el Operador tiene más de un parqueadero asignado, aparece un **selector de parqueadero** en la cabecera del panel. Cada sección muestra datos del parqueadero actualmente seleccionado.

---

## 4. Dashboard del Operador

### 4.1 Métricas del parqueadero seleccionado

- **Puestos disponibles ahora:** `COUNT(*) FROM puestos WHERE parqueadero_id = ? AND estado = 'libre'`
- **Puestos ocupados ahora:** `COUNT(*) FROM puestos WHERE parqueadero_id = ? AND estado IN ('ocupado_con_reserva', 'ocupado_sin_reserva')`
- **Reservas activas:** `COUNT(*) FROM reservas WHERE parqueadero_id = ? AND estado IN ('confirmada', 'en_curso')`
- **Ingresos del día:** `SUM(monto) FROM pagos WHERE parqueadero_id = ? AND estado = 'exitoso' AND DATE(created_at) = today`
- **Tasa de ocupación:** porcentaje calculado sobre total de puestos del parqueadero.

### 4.2 Gráficas

- **Ocupación por hora (hoy):** gráfica de barras con la ocupación promedio por franja horaria.
- **Reservas de los últimos 7 días:** gráfica de línea.
- **Distribución por tipo de vehículo:** gráfica de dona.

Los datos se obtienen mediante consultas desde Next.js Server Components al momento del request.

---

## 5. Parametrización del parqueadero

Esta es la sección central del Operador. Puede modificar todos los parámetros operativos de **su propio parqueadero**. No puede cambiar datos estructurales como nombre, dirección o coordenadas (esos los gestiona únicamente el Administrador).

### 5.1 Campos editables por el Operador

El Operador puede editar exactamente tres categorías de parámetros: horarios de operación, tolerancia de llegada y tarifas. Los parámetros de anticipación mínima/máxima de reservas y el porcentaje máximo de puestos reservables son gestionados únicamente por el **Administrador**.

| Campo | Descripción | Tipo |
|---|---|---|
| `horario_apertura` | Hora de apertura diaria | time |
| `horario_cierre` | Hora de cierre diaria | time |
| `dias_operacion` | Días de la semana operativos | integer[] (0=dom … 6=sáb) |
| `tolerancia_llegada_minutos` | Minutos de gracia antes de marcar no-presentación | integer |

### 5.2 Tarifas por tipo de vehículo

Almacenadas en la tabla `tarifas`:

```sql
tarifas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parqueadero_id   uuid REFERENCES parqueaderos(id),
  tipo_vehiculo_id uuid REFERENCES tipos_vehiculo(id),
  tarifa_hora      numeric(10,2) NOT NULL CHECK (tarifa_hora >= 0),
  tarifa_fraccion  numeric(10,2),  -- tarifa por fracción mínima (ej. 15 min)
  fraccion_minutos integer DEFAULT 60,
  activo           boolean DEFAULT true,
  updated_at       timestamptz DEFAULT now()
)
```

El Operador puede crear, editar y desactivar tarifas. No puede eliminarlas (soft disable con `activo = false`) para preservar el historial de reservas que usaron esa tarifa.

### 5.3 Persistencia de cambios

Cada cambio en la parametrización actualiza la tabla `parqueaderos` o la tabla `tarifas`. El campo `updated_at` se actualiza automáticamente mediante un trigger de PostgreSQL. No se lleva versionado histórico de políticas en el MVP; solo se conserva el estado actual.

---

## 6. Gestión de Puestos (Layout)

### 6.1 Tabla `puestos`

```sql
puestos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parqueadero_id   uuid REFERENCES parqueaderos(id),
  identificador    text NOT NULL,  -- ej. "A-01", "B-12"
  categoria_id     uuid REFERENCES categorias_puesto(id),
  tipo_vehiculo_id uuid REFERENCES tipos_vehiculo(id),  -- NULL = cualquier tipo
  estado           text DEFAULT 'libre' CHECK (estado IN (
                     'libre', 'ocupado_con_reserva', 'ocupado_sin_reserva',
                     'fuera_de_servicio', 'reservado')),
  activo           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
)
```

### 6.2 Operaciones del Operador sobre puestos

| Operación | Detalle |
|---|---|
| Ver layout | Vista de cuadrícula/lista de todos los puestos con su estado actual. |
| Editar puesto | Puede cambiar `identificador`, `categoria_id` y `tipo_vehiculo_id`. |
| Marcar fuera de servicio | Cambia `estado` a `fuera_de_servicio`. El sistema no permite crear reservas sobre este puesto. Si había una reserva futura, el operador debe reasignarla o cancelarla manualmente. |
| Reactivar puesto | Devuelve el estado a `libre` si no hay sensor que indique ocupación. |

El Operador **no puede crear ni eliminar puestos** (eso lo gestiona el Administrador modificando `total_puestos` en el parqueadero).

---

## 7. Gestión de Reservas

### 7.1 Vista de reservas

El Operador ve una tabla paginada de todas las reservas de **su parqueadero seleccionado**. Columnas: código de reserva, conductor (nombre), vehículo (placa), puesto, fecha/hora de inicio, fecha/hora de fin, estado, monto.

Filtros: estado, fecha, tipo de vehículo, puesto específico.

### 7.2 Estados de una reserva

```
confirmada → en_curso → finalizada
confirmada → no_presentada
confirmada → cancelada (por conductor)
en_curso → finalizada
```

### 7.3 Acciones disponibles para el Operador

| Acción | Condición | Resultado en BD |
|---|---|---|
| Marcar como no presentada | Reserva en estado `confirmada` y ha expirado la tolerancia de llegada | `estado = 'no_presentada'`, `estado` del puesto vuelve a `libre` |
| Finalizar reserva manualmente | Reserva en estado `en_curso` | `estado = 'finalizada'`, timestamp de salida = now() |
| Ver detalle completo | Cualquier estado | Solo lectura |

El operador **no puede cancelar reservas** de conductores ni modificar montos de pago. Cualquier cambio de estado manual queda registrado en `reservas_log` con el `user_id` del operador y un campo `motivo`.

### 7.4 Tabla `reservas`

```sql
reservas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id      uuid REFERENCES perfiles(id),
  parqueadero_id    uuid REFERENCES parqueaderos(id),
  puesto_id         uuid REFERENCES puestos(id),
  vehiculo_id       uuid REFERENCES vehiculos(id),
  fecha_inicio      timestamptz NOT NULL,
  fecha_fin         timestamptz NOT NULL,
  estado            text NOT NULL,
  codigo_qr         text UNIQUE,
  monto_total       numeric(12,2) NOT NULL,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
)
```

### 7.5 Tabla `reservas_log`

```sql
reservas_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id   uuid REFERENCES reservas(id),
  actor_id     uuid REFERENCES perfiles(id),
  estado_antes text,
  estado_nuevo text,
  motivo       text,
  created_at   timestamptz DEFAULT now()
)
```

---

## 8. Ingresos del parqueadero

El Operador puede ver un resumen financiero de **su parqueadero**:

- **Ingresos del día / semana / mes:** filtros por período.
- **Desglose por tipo de vehículo.**
- **Listado de transacciones:** tabla con referencia de pago, monto, fecha, estado y conductor (solo nombre, no datos sensibles).

El Operador **no puede** modificar ningún registro de pagos. Solo lectura. La exportación en CSV no está disponible para el Operador en el MVP (solo para el Administrador).

---

## 9. Creación de otros Operadores

### 9.1 Alcance

Un Operador puede crear nuevas cuentas de Operador, pero **únicamente para sus propios parqueaderos**. No puede asignar operadores a parqueaderos ajenos ni a parqueaderos sin asignar.

### 9.2 Flujo de creación

1. El Operador accede a la sección "Operadores" de su panel.
2. Ve la lista de operadores actualmente asignados a sus parqueaderos.
3. Hace clic en "Crear operador" y completa: nombre, email, contraseña temporal y selección del parqueadero (solo puede elegir entre los suyos).
4. El frontend envía la solicitud a `POST /api/operador/crear-operador`.
5. La API Route valida que el parqueadero destino esté dentro de los `parqueadero_ids` del JWT del Operador solicitante.
6. Si la validación pasa, usa el **Supabase Admin SDK** para crear el usuario en `auth.users`.
7. Inserta el perfil en `perfiles` con `rol = 'operador'` y `requiere_cambio_contrasena = true`.
8. Inserta la relación en `operador_parqueadero`.
9. Envía un correo al nuevo operador (via Resend) con credenciales temporales.

### 9.3 Restricciones

- Un Operador **no puede desactivar ni eliminar** a otros operadores. Esa acción es exclusiva del Administrador.
- Un Operador **no puede ver** los operadores de parqueaderos que no le pertenecen.
- Un Operador **no puede modificarse a sí mismo** la asignación de parqueaderos.

---

## 10. Perfil del Operador

Sección `/operador/perfil`:

| Campo | Editable |
|---|---|
| Nombre completo | Sí |
| Teléfono de contacto | Sí |
| Email | No (solo el Administrador puede cambiarlo) |
| Contraseña | Sí (flujo de cambio con contraseña actual) |
| Foto de perfil | Sí (subida a Supabase Storage, bucket `avatares`) |

---

## 11. Modelo de persistencia — resumen de tablas y permisos del Operador

Las RLS policies en Supabase verifican que `auth.jwt() ->> 'role' = 'operador'` y que el `parqueadero_id` del registro esté dentro del arreglo `parqueadero_ids` del JWT.

| Tabla | Permisos del Operador |
|---|---|
| `parqueaderos` | SELECT (solo los suyos), UPDATE (campos de política únicamente) |
| `puestos` | SELECT (solo los suyos), UPDATE (identificador, categoria, estado) |
| `tarifas` | SELECT, INSERT, UPDATE (solo para sus parqueaderos) |
| `reservas` | SELECT (solo sus parqueaderos), UPDATE (estado con motivo) |
| `reservas_log` | SELECT, INSERT |
| `pagos` | SELECT (solo sus parqueaderos) |
| `perfiles` | SELECT (operadores de sus parqueaderos), INSERT (crear nuevos) |
| `auth.users` | Via Admin SDK solo en el flujo de creación de operador |
| `operador_parqueadero` | SELECT, INSERT (solo para sus parqueaderos) |
| `vehiculos` | SELECT (de conductores con reservas en sus parqueaderos) |
| `tipos_vehiculo` | SELECT (solo lectura) |
| `categorias_puesto` | SELECT (solo lectura) |
| `configuracion` | SELECT (solo lectura) |
