# Integración PayU WebCheckout con Next.js
### Proyecto: Sistema ITS Parqueaderos Inteligentes

---

## ¿Necesitas cuenta para usar el sandbox?

**No.** PayU expone credenciales de prueba públicas en su documentación oficial. Puedes usarlas directamente sin crear una cuenta:

```
merchantId : 508029
accountId  : 512321   (Colombia)
apiKey     : 4Vj8eK4rloUd272L48hsrarnUA
```

> **Resumen:** Para probar en sandbox usas esas credenciales hardcodeadas. Solo necesitas una cuenta real cuando vayas a producción.

| accountId | País / Variante |
|-----------|----------------|
| `512321`  | Colombia |
| `516686`  | Colombia con 3DS |
| `512327`  | Brasil |
| `512322`  | Argentina |

El endpoint de sandbox es:
```
https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/
```

---

## Arquitectura recomendada

```
Usuario hace reserva
        │
        ▼
Next.js Server Action / API Route
  → genera la firma (SHA256)
  → retorna merchantId + signature
        │
        ▼
Client Component renderiza <form> oculto
        │
        ▼
Redirect a PayU sandbox (HTTP POST)
        │
        ▼
PayU devuelve a responseUrl / confirmationUrl
```

> **⚠️ Importante:** La `signature` se debe generar **en el servidor** (API Route o Server Action), nunca en el cliente, porque usa el `apiKey`.

---

## Paso 1 — Variables de entorno

Crea o agrega al archivo `.env.local` en la raíz del proyecto:

```env
# Sandbox — credenciales públicas de PayU
PAYU_API_KEY=4Vj8eK4rloUd272L48hsrarnUA
PAYU_MERCHANT_ID=508029

# URL base del proyecto (cambiar en producción)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Paso 2 — API Route: Generador de firma

La firma se construye concatenando los campos en este orden exacto y encriptando con SHA256:

```
apiKey~merchantId~referenceCode~amount~currency
```

```ts
// app/api/payu/signature/route.ts
import crypto from "crypto";

export async function POST(req: Request) {
  const { referenceCode, amount, currency } = await req.json();

  const apiKey     = process.env.PAYU_API_KEY!;
  const merchantId = process.env.PAYU_MERCHANT_ID!;

  const raw = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
  const signature = crypto.createHash("sha256").update(raw).digest("hex");

  return Response.json({ signature, merchantId });
}
```

---

## Paso 3 — Componente de pago (Client Component)

```tsx
// components/PayUCheckout.tsx
"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  referenceCode : string;  // ej: "PARKING-RES-001"
  amount        : number;  // ej: 5000 (tarifa por no-show)
  description   : string;  // ej: "Reserva parqueadero - Plaza 3"
  buyerEmail    : string;
  buyerName     : string;
  buyerDoc      : string;
}

export default function PayUCheckout({
  referenceCode,
  amount,
  description,
  buyerEmail,
  buyerName,
  buyerDoc,
}: Props) {
  const formRef              = useRef<HTMLFormElement>(null);
  const [signature, setSignature]   = useState("");
  const [merchantId, setMerchantId] = useState("");

  const ACCOUNT_ID = "512321"; // Colombia sandbox
  const CURRENCY   = "COP";
  const IS_TEST    = "1";      // Cambiar a "0" en producción

  useEffect(() => {
    fetch("/api/payu/signature", {
      method  : "POST",
      headers : { "Content-Type": "application/json" },
      body    : JSON.stringify({ referenceCode, amount, currency: CURRENCY }),
    })
      .then((r) => r.json())
      .then(({ signature, merchantId }) => {
        setSignature(signature);
        setMerchantId(merchantId);
      });
  }, [referenceCode, amount]);

  const handlePay = () => {
    if (signature && formRef.current) formRef.current.submit();
  };

  return (
    <>
      {/* Formulario oculto — PayU requiere HTTP POST tradicional */}
      <form
        ref={formRef}
        method="POST"
        action="https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
        style={{ display: "none" }}
      >
        <input name="merchantId"        value={merchantId}    readOnly />
        <input name="accountId"         value={ACCOUNT_ID}    readOnly />
        <input name="description"       value={description}   readOnly />
        <input name="referenceCode"     value={referenceCode} readOnly />
        <input name="amount"            value={amount}        readOnly />
        <input name="tax"               value="0"             readOnly />
        <input name="taxReturnBase"     value="0"             readOnly />
        <input name="currency"          value={CURRENCY}      readOnly />
        <input name="signature"         value={signature}     readOnly />
        <input name="test"              value={IS_TEST}       readOnly />
        <input name="buyerEmail"        value={buyerEmail}    readOnly />
        <input name="buyerFullName"     value={buyerName}     readOnly />
        <input name="buyerDocument"     value={buyerDoc}      readOnly />
        <input name="buyerDocumentType" value="CC"            readOnly />
        <input name="telephone"         value="3000000000"    readOnly />
        <input
          name="responseUrl"
          value={`${process.env.NEXT_PUBLIC_BASE_URL}/pagos/respuesta`}
          readOnly
        />
        <input
          name="confirmationUrl"
          value={`${process.env.NEXT_PUBLIC_BASE_URL}/api/payu/confirmacion`}
          readOnly
        />
      </form>

      <button onClick={handlePay} disabled={!signature}>
        {signature ? "Pagar reserva" : "Cargando..."}
      </button>
    </>
  );
}
```

---

## Paso 4 — API Route: Confirmación (webhook de PayU)

PayU llama a `confirmationUrl` con un `POST` cuando el estado de la transacción cambia. Aquí debes actualizar tu base de datos.

```ts
// app/api/payu/confirmacion/route.ts
export async function POST(req: Request) {
  const body = await req.formData();

  const transactionState = body.get("transactionState"); // "4"=Aprobado, "6"=Rechazado, "7"=Pendiente
  const referenceCode    = body.get("referenceCode") as string;
  const txValue          = body.get("TX_VALUE");

  console.log({ transactionState, referenceCode, txValue });

  if (transactionState === "4") {
    // ✅ Pago aprobado — actualiza estado en Supabase
    // await supabase
    //   .from("reservas")
    //   .update({ estado: "pagada" })
    //   .eq("referencia", referenceCode);
  }

  if (transactionState === "6") {
    // ❌ Pago rechazado
  }

  // PayU espera HTTP 200 para confirmar que recibiste el webhook
  return new Response("OK", { status: 200 });
}
```

### Códigos de `transactionState`

| Código | Estado |
|--------|--------|
| `4`    | Aprobado |
| `6`    | Rechazado |
| `7`    | Pendiente |
| `104`  | Error |

---

## Paso 5 — Página de respuesta (responseUrl)

Esta ruta la ve el usuario al regresar de PayU. No es el webhook — no uses esta URL para lógica crítica de negocio.

```tsx
// app/pagos/respuesta/page.tsx
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function RespuestaContent() {
  const params           = useSearchParams();
  const transactionState = params.get("transactionState");
  const referenceCode    = params.get("referenceCode");

  const mensajes: Record<string, string> = {
    "4" : "✅ Pago aprobado. Tu reserva ha sido confirmada.",
    "6" : "❌ Pago rechazado. Intenta de nuevo.",
    "7" : "⏳ Pago pendiente. Te notificaremos por correo.",
  };

  return (
    <div>
      <h1>Estado del pago</h1>
      <p>{mensajes[transactionState ?? ""] ?? "Estado desconocido."}</p>
      <p>Referencia: {referenceCode}</p>
    </div>
  );
}

export default function PaginaRespuesta() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <RespuestaContent />
    </Suspense>
  );
}
```

---

## Tarjetas de prueba (sandbox)

Usa estas tarjetas para simular transacciones sin dinero real:

| Franquicia | Número | CVV | Vencimiento |
|-----------|--------|-----|-------------|
| VISA      | `4097272000` | `123` | Cualquier fecha futura |
| Mastercard | `5170394490` | `123` | Cualquier fecha futura |
| PSE (banco test) | — | — | Seleccionar cualquier banco en sandbox |

Para el módulo de antifraude usa estos emails al llenar el formulario:

| Email | Resultado simulado |
|-------|-------------------|
| `approved@payu.com` | Transacción aprobada |
| `rejected@payu.com` | Transacción rechazada por fraude |
| `pending_approved@payu.com` | Pendiente → aprobada en 5 min |

---

## Flujo aplicado al proyecto de Parqueaderos

Considerando la lógica de negocio definida (tarifa por no-show a los 30 min):

| Momento | Acción PayU |
|---------|-------------|
| Usuario reserva y no llega en 30 min | Se genera `referenceCode` único y se lanza `PayUCheckout` |
| PayU confirma pago (`transactionState=4`) | `confirmationUrl` actualiza el estado de la reserva en Supabase |
| Usuario cancela a tiempo | No se genera ninguna transacción |
| Pago rechazado (`transactionState=6`) | Se notifica al usuario y se registra el intento |

### Ejemplo de `referenceCode` sugerido

```ts
// Formato: PARKING-{reservaId}-{timestamp}
const referenceCode = `PARKING-${reserva.id}-${Date.now()}`;
```

> Debe ser **único por transacción**. PayU rechaza referencias duplicadas.

---

## Resumen de archivos creados

```
app/
├── api/
│   └── payu/
│       ├── signature/
│       │   └── route.ts         ← Generador de firma (servidor)
│       └── confirmacion/
│           └── route.ts         ← Webhook de PayU (servidor)
└── pagos/
    └── respuesta/
        └── page.tsx             ← Página de retorno visible al usuario

components/
└── PayUCheckout.tsx             ← Componente que lanza el formulario

.env.local                       ← Variables de entorno (NO subir al repo)
```

---

## Checklist antes de ir a producción

- [ ] Crear cuenta real en [PayU Colombia](https://colombia.payu.com)
- [ ] Reemplazar `merchantId`, `accountId` y `apiKey` con credenciales reales
- [ ] Cambiar `IS_TEST` de `"1"` a `"0"` en `PayUCheckout.tsx`
- [ ] Cambiar `action` del formulario a `https://checkout.payulatam.com/ppp-web-gateway-payu/`
- [ ] Actualizar `NEXT_PUBLIC_BASE_URL` con la URL de producción (Vercel)
- [ ] Verificar que `confirmationUrl` sea accesible públicamente (no `localhost`)
- [ ] Validar firma en `confirmationUrl` antes de actualizar la BD
