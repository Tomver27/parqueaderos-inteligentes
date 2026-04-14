# conductor.md

> **Propósito de este documento:** Describir con exactitud la lógica de negocio, flujos de interacción y modelo de persistencia del rol **Conductor** dentro de la plataforma web de Parqueaderos Inteligentes. Este documento está escrito para ser consumido por un agente de IA que asistirá en el desarrollo; por tanto es exhaustivo, preciso y evita ambigüedades.

---

## 1. Identidad del rol

El Conductor (también llamado "cliente" en el documento de requerimientos) es el usuario final de la plataforma. Es la persona que busca un parqueadero, crea una reserva y paga por ella. **Se registra de forma autónoma** a través del portal web; no requiere aprobación de ningún otro actor.

Un conductor puede tener **múltiples vehículos** registrados bajo la misma cuenta.

---

## 2. Registro

### 2.1 Formulario de registro

Ruta: `/registro`

Campos requeridos:

| Campo | Validación |
|---|---|
| Nombre completo | No vacío, máximo 100 caracteres |
| Email | Formato válido, no debe estar ya registrado |
| Contraseña | Mínimo 8 caracteres, al menos 1 mayúscula, 1 número |
| Confirmación de contraseña | Debe coincidir con el campo anterior |
| Aceptación de términos y política de privacidad | Checkbox obligatorio |
| **CAPTCHA** | Debe resolverse correctamente antes de enviar |

El token del CAPTCHA (hCaptcha o Cloudflare Turnstile) se valida en una **Next.js API Route** (`POST /api/auth/registro`) antes de llamar a Supabase Auth. Si el CAPTCHA es inválido, la API retorna `400` y el registro no procede.

### 2.2 Flujo de creación de cuenta

1. El frontend valida los campos localmente y obtiene el token del CAPTCHA.
2. Envía todo a `POST /api/auth/registro`.
3. La API Route valida el CAPTCHA contra el proveedor.
4. Llama a `supabase.auth.signUp({ email, password })`.
5. Supabase Auth envía un **correo de verificación** al email ingresado.
6. Se inserta un registro en `perfiles`:

```sql
perfiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id),
  rol        text DEFAULT 'conductor',
  nombre     text NOT NULL,
  telefono   text,
  activo     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)
```

7. El conductor es redirigido a una pantalla de confirmación que indica que debe verificar su correo antes de poder iniciar sesión.

### 2.3 Verificación de correo

El correo enviado por Supabase Auth contiene un enlace de confirmación con expiración de 24 horas. Al hacer clic, el conductor queda verificado en `auth.users` (`email_confirmed_at` se llena). Solo entonces puede iniciar sesión.

Si el enlace expira, el conductor puede solicitar el reenvío desde la pantalla de login.

---

## 3. Inicio de sesión

Ruta: `/login`

### 3.1 Métodos disponibles

| Método | Flujo |
|---|---|
| Email + contraseña | Formulario estándar con CAPTCHA previo |
| Google OAuth | Botón "Continuar con Google"; no requiere CAPTCHA (Google ya valida al usuario) |

### 3.2 CAPTCHA en login con email

El CAPTCHA se presenta **siempre** en el formulario de email + contraseña, antes de que el usuario pueda hacer submit. El token se valida en la API Route `POST /api/auth/login`. Solo si el CAPTCHA es válido se llama a `supabase.auth.signInWithPassword`. El flujo OAuth de Google no pasa por esta API Route; el CAPTCHA no aplica ahí.

### 3.3 Google OAuth

Al hacer clic en "Continuar con Google":
1. Se llama a `supabase.auth.signInWithOAuth({ provider: 'google' })`.
2. Supabase redirige al flujo de consentimiento de Google.
3. Al regresar, Supabase Auth crea o asocia la cuenta en `auth.users`.
4. Un **Database Trigger** en `auth.users` detecta si el `id` ya existe en `perfiles`. Si no existe, inserta automáticamente un registro con `rol = 'conductor'` y `nombre` tomado del `raw_user_meta_data.full_name` de Google.
5. El conductor queda autenticado y es redirigido al portal.

### 3.4 Rate-limiting y bloqueos

- Tras 5 intentos fallidos consecutivos con email + contraseña, el formulario del frontend se bloquea 10 minutos.
- Supabase Auth aplica rate-limiting adicional en el servidor de forma independiente.

### 3.5 Sesión

- JWT emitido por Supabase Auth con claim `role: 'conductor'`.
- Almacenado en cookie `httpOnly` gestionada por el middleware de Next.js.
- Duración del JWT: 1 hora, refresh token: 7 días.
- El middleware valida el claim en cada petición a rutas bajo `/portal/*`.

---

## 4. Recuperación de contraseña

Disponible solo para cuentas de **email + contraseña** (las cuentas OAuth no tienen contraseña en la plataforma).

### 4.1 Flujo

1. El conductor accede a `/login` y hace clic en "¿Olvidé mi contraseña?".
2. Ingresa su email en el formulario de recuperación. **No hay CAPTCHA** en este paso, pero sí rate-limiting por IP (máximo 5 solicitudes por hora).
3. El sistema llama a `supabase.auth.resetPasswordForEmail(email)`.
4. Supabase Auth envía un correo con un enlace de restablecimiento con **expiración de 15 minutos**.
5. Al hacer clic en el enlace, el conductor llega a `/reset-password?token=...` donde puede ingresar y confirmar su nueva contraseña.
6. El frontend llama a `supabase.auth.updateUser({ password: nuevaContrasena })` usando la sesión temporal provista por el token del enlace.
7. El enlace es de **un solo uso** y se invalida tras ser utilizado.
8. Tras el cambio exitoso, el conductor es redirigido a `/login`.

---

## 5. Cambio de contraseña (estando autenticado)

Disponible en la sección de perfil, `/portal/perfil`.

El conductor debe ingresar su contraseña actual (para reautenticarse), la nueva contraseña y su confirmación. La actualización se realiza vía `supabase.auth.updateUser({ password })`. No aplica para cuentas OAuth.

---

## 6. Gestión del perfil

Ruta: `/portal/perfil`

| Campo | Editable |
|---|---|
| Nombre completo | Sí |
| Teléfono | Sí |
| Email | No (cambiar email requiere flujo de verificación especial; no está en el MVP) |
| Contraseña | Sí (si la cuenta es email + contraseña) |
| Foto de perfil | Sí (subida a Supabase Storage, bucket `avatares`) |

El conductor **no puede** ver ni editar su campo `rol`. No puede convertirse en Operador desde el portal.

---

## 7. Gestión de vehículos

### 7.1 Tabla `vehiculos`

```sql
vehiculos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id     uuid REFERENCES perfiles(id),
  placa            text NOT NULL UNIQUE,
  tipo_vehiculo_id uuid REFERENCES tipos_vehiculo(id),
  marca            text,
  modelo           text,
  color            text,
  activo           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
)
```

### 7.2 Operaciones

| Operación | Detalle |
|---|---|
| Registrar vehículo | El conductor ingresa placa, tipo, marca, modelo y color. La placa se normaliza a mayúsculas sin espacios antes de guardar. El sistema valida que la placa no exista ya en la tabla. |
| Editar vehículo | Puede cambiar marca, modelo, color y tipo. La placa no es editable (identificador principal). |
| Desactivar vehículo | Soft disable (`activo = false`). El vehículo deja de aparecer en el selector de reservas. Las reservas pasadas con ese vehículo se conservan en el historial. |
| Reactivar vehículo | Devuelve `activo = true`. |

No hay límite de vehículos por conductor.

---

## 8. Búsqueda de parqueaderos

Ruta: `/portal/buscar`

### 8.1 Flujo de búsqueda

1. El conductor puede ingresar una dirección/lugar o usar su geolocalización del navegador.
2. El frontend llama a la API de Google Maps / Mapbox para convertir la dirección a coordenadas (geocoding).
3. Se hace una consulta a Supabase con la función PostGIS `ST_DWithin` (o fórmula de Haversine si no se usa PostGIS):

```sql
SELECT *
FROM parqueaderos
WHERE activo = true
  AND ST_DWithin(
    ST_MakePoint(longitud, latitud)::geography,
    ST_MakePoint(:lng_usuario, :lat_usuario)::geography,
    :radio_metros
  )
ORDER BY ST_Distance(...) ASC;
```

4. Los resultados se muestran simultáneamente en un **mapa interactivo** (marcadores) y en una **lista lateral** con: nombre, dirección, distancia, puestos disponibles en este momento, tarifa desde (la mínima de ese parqueadero), horario.
5. El radio de búsqueda por defecto viene de `configuracion.radio_busqueda_km` pero el conductor puede ajustarlo.

### 8.2 Filtros disponibles

- Tipo de vehículo (filtra parqueaderos que tengan tarifa activa para ese tipo).
- Rango de fechas y horas (filtra según disponibilidad real en ese intervalo).
- Radio de búsqueda (slider de 1 a 20 km).

---

## 9. Consulta de disponibilidad

### 9.1 Disponibilidad en tiempo real

Desde la tarjeta o el detalle de un parqueadero, el conductor ve el número de puestos disponibles **en este momento**. Este dato se obtiene con una consulta directa y se puede suscribir mediante Supabase Realtime para actualización automática.

### 9.2 Disponibilidad a futuro (cupo a cierta hora)

El conductor puede seleccionar:
- Fecha de entrada
- Hora de entrada
- Hora de salida

El sistema calcula cuántos puestos estarán disponibles en ese intervalo:

```sql
-- Puestos del parqueadero NO cruzados por reservas en el intervalo
SELECT COUNT(*)
FROM puestos p
WHERE p.parqueadero_id = :parqueadero_id
  AND p.activo = true
  AND p.estado != 'fuera_de_servicio'
  AND p.id NOT IN (
    SELECT r.puesto_id
    FROM reservas r
    WHERE r.parqueadero_id = :parqueadero_id
      AND r.estado IN ('confirmada', 'en_curso')
      AND r.fecha_inicio < :hora_fin
      AND r.fecha_fin > :hora_inicio
  )
```

También se respeta `restricciones_tipo_vehiculo` si el conductor seleccionó un tipo de vehículo específico.

---

## 10. Creación de reserva

### 10.1 Flujo completo

**Paso 1 — Selección de parqueadero y franja horaria**
- El conductor elige el parqueadero desde el buscador.
- Selecciona tipo de vehículo (de sus vehículos registrados o ingresa la placa manualmente).
- Selecciona fecha, hora de entrada y hora de salida.
- El sistema muestra el monto total calculado: `tarifa_hora * duración_horas` (o la fracción mínima si aplica).

**Paso 2 — Selección de puesto (si el operador lo permite)**
- Si el parqueadero tiene `seleccion_puesto_habilitada = true` (parámetro del operador), el conductor ve una grilla de puestos disponibles y puede elegir uno.
- Si no, el sistema asigna el puesto automáticamente al confirmar el pago (primer puesto libre compatible con el tipo de vehículo).

**Paso 3 — Pago**
- El conductor es dirigido al widget de la pasarela de pagos (ePayco / Wompi), embebido o en redirección.
- Los datos del pago **nunca pasan por el servidor de Next.js directamente**: el frontend inicializa el widget con parámetros generados por una API Route (`POST /api/pagos/iniciar`) que crea una referencia de pago única en Supabase y la pasa al widget.

**Paso 4 — Confirmación (webhook)**
- La pasarela envía un webhook a `POST /api/pagos/webhook`.
- La API Route verifica la firma del webhook (hash HMAC con la llave secreta de la pasarela).
- Si el pago es `exitoso`:
  - Se actualiza la tabla `pagos` con `estado = 'exitoso'`.
  - Se inserta el registro en `reservas` con `estado = 'confirmada'`.
  - Si no se había asignado puesto aún, se asigna ahora y se actualiza `puestos.estado = 'reservado'`.
  - Se genera el `codigo_qr` único de la reserva.
  - Se envía correo de confirmación al conductor (via Resend) con todos los detalles y el código QR.
- Si el pago es `fallido`:
  - Se actualiza `pagos.estado = 'fallido'`.
  - La reserva **no se crea**.
  - El conductor es notificado en la interfaz y puede reintentar.

**La reserva queda activa inmediatamente tras el webhook de pago exitoso.** No hay paso de confirmación adicional por parte del conductor.

### 10.2 Tabla `pagos`

```sql
pagos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id        uuid REFERENCES perfiles(id),
  reserva_id          uuid REFERENCES reservas(id),
  parqueadero_id      uuid REFERENCES parqueaderos(id),
  referencia_pasarela text UNIQUE,
  monto               numeric(12,2) NOT NULL,
  metodo_pago_id      uuid REFERENCES metodos_pago(id),
  estado              text DEFAULT 'pendiente' CHECK (estado IN (
                        'pendiente', 'exitoso', 'fallido', 'reembolsado')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
)
```

---

## 11. Mis reservas

Ruta: `/portal/reservas`

### 11.1 Vista del listado

El conductor ve todas sus reservas ordenadas por fecha de inicio descendente. Columnas: parqueadero, puesto, vehículo, fecha/hora entrada, fecha/hora salida, estado, monto.

Filtros: estado, rango de fechas.

Estados visibles:

| Estado | Significado |
|---|---|
| `confirmada` | Pago realizado, reserva vigente, aún no ha llegado al parqueadero |
| `en_curso` | El sensor detectó que el conductor ocupó el puesto |
| `finalizada` | Reserva completada |
| `cancelada` | Cancelada por el conductor |
| `no_presentada` | No llegó al parqueadero en el tiempo de tolerancia |

### 11.2 Detalle de reserva

Al entrar al detalle, el conductor ve:
- Todos los datos de la reserva.
- El **código QR** de la reserva (para mostrar al entrar al parqueadero).
- El **estado en tiempo real** (suscripción a Supabase Realtime sobre la fila de la reserva).
- El recibo de pago descargable en PDF.
- Botón de cancelación (si aplica).

---

## 12. Cancelación de reserva

### 12.1 Condiciones para cancelar

El conductor puede cancelar una reserva mientras su estado sea `confirmada` (no puede cancelar si ya está `en_curso`). No hay restricción de tiempo mínimo de anticipación desde el lado del conductor para cancelar; puede hacerlo incluso minutos antes de la hora de inicio.

### 12.2 Política de reembolso

**No hay reembolso.** El monto pagado no se devuelve bajo ninguna circunstancia cuando el conductor cancela. Esta política es fija a nivel de plataforma (parámetro `politica_reembolso = 'sin_reembolso'` en `configuracion`).

### 12.3 Flujo de cancelación

1. El conductor hace clic en "Cancelar reserva" desde el detalle.
2. El sistema muestra un modal de confirmación que indica claramente: *"Al cancelar esta reserva no recibirás ningún reembolso. ¿Deseas continuar?"*
3. El conductor debe confirmar explícitamente.
4. La API Route `POST /api/reservas/:id/cancelar` valida que:
   - La reserva pertenece al conductor autenticado.
   - El estado actual es `confirmada`.
5. Si las validaciones pasan:
   - `reservas.estado` se actualiza a `'cancelada'`.
   - `puestos.estado` vuelve a `'libre'` (o `'reservado'` si había otra reserva posterior que lo bloqueara, pero ese caso se resuelve por lógica de disponibilidad, no por estado directo del puesto).
   - Se registra en `reservas_log`: actor = conductor, estado_antes = `confirmada`, estado_nuevo = `cancelada`, motivo = `'cancelado_por_conductor'`.
   - El pago permanece con `estado = 'exitoso'` (no se toca).
6. Se envía un correo de notificación de cancelación al conductor (sin mención de reembolso).

---

## 13. Historial de pagos

Ruta: `/portal/pagos`

El conductor ve una tabla con todas sus transacciones. Columnas: referencia de pago, parqueadero, monto, método de pago, estado, fecha.

Filtros: estado, rango de fechas.

Desde el detalle de cada pago puede **descargar el recibo en PDF** (generado en una API Route de Next.js que construye el PDF con la información de `pagos` + `reservas`).

El conductor **no puede** crear, modificar ni eliminar registros de pagos. Solo lectura.

---

## 14. Modelo de persistencia — resumen de tablas y permisos del Conductor

Las RLS policies en Supabase verifican que `auth.jwt() ->> 'role' = 'conductor'` y que el `conductor_id` del registro coincida con `auth.uid()` (el ID del usuario autenticado).

| Tabla | Permisos del Conductor |
|---|---|
| `perfiles` | SELECT y UPDATE (solo su propio registro) |
| `vehiculos` | SELECT, INSERT, UPDATE (solo los suyos) |
| `parqueaderos` | SELECT (solo activos) |
| `puestos` | SELECT (solo activos de parqueaderos activos) |
| `tarifas` | SELECT (solo activas) |
| `tipos_vehiculo` | SELECT |
| `categorias_puesto` | SELECT |
| `reservas` | SELECT (solo las suyas), INSERT (mediante API Route), UPDATE (solo cancelar las suyas en estado `confirmada`) |
| `reservas_log` | INSERT (acción de cancelación propia) |
| `pagos` | SELECT (solo los suyos) |
| `configuracion` | SELECT (parámetros públicos: radio, moneda) |

> **Nota de implementación:** El INSERT en `reservas` no lo hace el cliente directamente contra Supabase; pasa siempre por la API Route `POST /api/reservas/crear` que valida disponibilidad, calcula el monto final y coordina el inicio del pago. La RLS de `reservas` solo permite INSERT desde el service role (la API Route usa el Admin SDK internamente), no desde el JWT del conductor. Esto previene manipulación de montos o estados desde el frontend.
