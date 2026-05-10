"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  referenceCode: string;
  amount: number;
  description: string;
  buyerEmail: string;
  buyerName: string;
  reservationId: number;
  parkingName: string;
  reservationDate: string;
  vehiclePlate: string;
};

const ACCOUNT_ID = process.env.NEXT_PUBLIC_PAYU_ACCOUNT_ID ?? "512321";
const CURRENCY = "COP";
const IS_TEST = "1"; // Cambia a "0" en producción cuando uses PayU real

export default function PayUCheckout({
  referenceCode,
  amount,
  description,
  buyerEmail,
  buyerName,
  reservationId,
  parkingName,
  reservationDate,
  vehiclePlate,
}: Props) {
  const [merchantId, setMerchantId] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  // Refs scoped to this component instance — safe across router refreshes that
  // remount the component (unlike window globals which persist across instances).
  const signatureFetched = useRef(false);
  const formSubmitted = useRef(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (!referenceCode || !amount) return;
    if (signatureFetched.current) return;
    signatureFetched.current = true;

    const numericAmount = Number(amount);
    const formattedAmount = Number.isInteger(numericAmount)
      ? String(numericAmount)
      : numericAmount.toFixed(2);

    fetch("/api/payu/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode, amount: formattedAmount, currency: CURRENCY }),
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) throw new Error(text || "Error al generar la firma.");
        return JSON.parse(text);
      })
      .then((data) => {
        setMerchantId(data.merchantId);
        setSignature(data.signature);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo generar la firma de pago. Intenta nuevamente.");
      });
  }, [referenceCode, amount]);

  useEffect(() => {
    if (!merchantId || !signature || !baseUrl || !formRef.current) return;
    if (formSubmitted.current) return;
    formSubmitted.current = true;
    setSubmitted(true);
    formRef.current.submit();
  }, [merchantId, signature, baseUrl]);

  if (error) {
    return (
      <div className="rounded-2xl p-6 bg-red-500/10 text-red-200 border border-red-500/20">
        <p className="text-sm font-semibold">Ocurrió un error :(</p>
        <p className="mt-2 text-sm text-red-100">{error}</p>
      </div>
    );
  }

  const responseUrl = `${baseUrl}/pagos/respuesta`;
  const confirmationUrl = `${baseUrl}/api/payu/confirmacion`;

  return (
    <div className="rounded-2xl p-6 bg-slate-900 border border-white/10">
      <p className="text-white font-semibold mb-2">Preparando pago...</p>
      <p className="text-sm text-slate-400 mb-4">
        Serás redirigido a PayU para completar el pago de tu reserva.
      </p>
      <div className="rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
        <p>
          <strong>Reserva:</strong> #{reservationId} · {parkingName}
        </p>
        <p>
          <strong>Espacio:</strong> {description}
        </p>
        <p>
          <strong>Monto:</strong> ${amount.toLocaleString("es-CO")} {CURRENCY}
        </p>
        <p>
          <strong>Vehículo:</strong> {vehiclePlate}
        </p>
      </div>

      <form
        ref={formRef}
        method="POST"
        action="https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
        style={{ display: "none" }}
      >
        <input name="merchantId" value={merchantId} readOnly />
        <input name="accountId" value={ACCOUNT_ID} readOnly />
        <input name="description" value={description} readOnly />
        <input name="referenceCode" value={referenceCode} readOnly />
        <input
          name="amount"
          value={Number.isInteger(Number(amount)) ? String(amount) : Number(amount).toFixed(2)}
          readOnly
        />
        <input name="tax" value="0" readOnly />
        <input name="taxReturnBase" value="0" readOnly />
        <input name="currency" value={CURRENCY} readOnly />
        <input name="signature" value={signature} readOnly />
        <input name="test" value={IS_TEST} readOnly />
        <input name="buyerEmail" value={buyerEmail} readOnly />
        <input name="buyerFullName" value={buyerName} readOnly />
        <input name="buyerDocument" value="0000000000" readOnly />
        <input name="buyerDocumentType" value="CC" readOnly />
        <input name="telephone" value="3000000000" readOnly />
        <input name="responseUrl" value={responseUrl} readOnly />
        <input name="confirmationUrl" value={confirmationUrl} readOnly />
      </form>

      {(!signature || !merchantId || !baseUrl) && (
        <p className="text-sm text-slate-500 mt-3">
          Cargando pago... si tarda más de unos segundos, recarga la página.
        </p>
      )}
    </div>
  );
}
