# Políticas de Reservas — Parqueaderos Inteligentes

Este documento define las reglas de negocio que rigen el sistema de reservas para conductores.

---

## Acceso y roles

| Regla | Detalle |
|---|---|
| **Autenticación requerida** | Solo usuarios con sesión activa pueden realizar reservas |
| **Rol autorizado** | Únicamente el rol **Conductor** (`id_role = 3`) puede reservar |
| **Roles excluidos** | Administrador y Operador no tienen acceso a esta función |

---

## Ventana de fechas disponibles

- Un conductor puede reservar para cualquier fecha dentro de los **próximos 7 días** (desde hoy hasta hoy + 7 días, inclusive).
- No existen restricciones por día de la semana; todos los días están habilitados.
- Adicionalmente, la reserva debe realizarse con al menos **`deadline_reservation` minutos de anticipación** respecto a la hora deseada (parámetro configurable por parqueadero).
- Ejemplo: si `deadline_reservation = 30`, no se puede reservar para las 14:00 después de las 13:30.
- Todas las fechas y horas se muestran en **hora Colombia (UTC−5)**.

---

## Bloqueo de espacios — por día completo

Una reserva vigente bloquea el espacio para el **día calendario completo** (hora Colombia) en que fue agendada. Esto significa:

- No importa la hora que elija el conductor: si hay una reserva activa para ese día, el espacio aparece como **Reservado** para cualquier hora de ese día.
- El bloqueo desaparece cuando la reserva expira (`expires_at < NOW()`) o cuando el vehículo se presentó (`taken = true`).
- Si `taken = true`, el vehículo ya llegó al parqueadero; el espacio pasa a estado **Ocupado** (gestionado por `Occupations`).

---

## Visibilidad de espacios

Un espacio aparece como **disponible** únicamente si cumple **todas** las condiciones:

1. **Reservable**: `bookable = true` en la tabla `Spaces`.
2. **Sin ocupación activa**: no existe registro en `Occupations` con `end_date IS NULL` para ese espacio.
3. **Sin reserva vigente para ese día**: no existe ninguna reserva con `taken = false` y `expires_at >= NOW()` cuyo campo `date` coincida con el día seleccionado (en hora Colombia).

---

## Vigencia y expiración

- Al crear la reserva: `expires_at = date + expires_reservation` (minutos, parámetro por parqueadero).
- Si el conductor no se presenta antes de `expires_at`, la reserva expira automáticamente y el espacio queda disponible para nuevas reservas.
- Cuando la cámara ANPR detecta la placa, el endpoint `POST /api/plates` marca la reserva con `taken = true`.
- El pago se registra automáticamente en **COP** al momento de confirmar la reserva.

---

## Resumen de estados de un espacio

| Estado | Condición | Color en UI | Seleccionable |
|---|---|---|---|
| **Disponible** | `bookable = true`, sin ocupación activa, sin reserva vigente ese día | 🟢 Verde | ✅ Sí |
| **Reservado** | Reserva vigente (`taken = false`, `expires_at >= NOW()`) para ese día | 🟡 Amarillo | ❌ No |
| **Ocupado** | Ocupación activa (`end_date IS NULL`) | 🔴 Rojo | ❌ No |
| **No reservable** | `bookable = false` | — (no aparece en /reservar) | ❌ No |


