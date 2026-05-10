import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { referenceCode, amount, currency } = await req.json();

    if (!referenceCode || !amount || !currency) {
      return NextResponse.json(
        { error: "referenceCode, amount y currency son obligatorios." },
        { status: 400 },
      );
    }

    const apiKey = process.env.PAYU_API_KEY;
    const merchantId = process.env.PAYU_MERCHANT_ID;

    if (!apiKey || !merchantId) {
      return NextResponse.json(
        { error: "Faltan variables de entorno de PayU." },
        { status: 500 },
      );
    }

    const numericAmount = Number(amount);
    const formattedAmount = Number.isInteger(numericAmount)
      ? String(numericAmount)
      : numericAmount.toFixed(2);

    const raw = `${apiKey}~${merchantId}~${referenceCode}~${formattedAmount}~${currency}`;
    const signature = crypto.createHash("md5").update(raw).digest("hex");

    console.log("PayU signature generated", {
      referenceCode,
      amount: formattedAmount,
      currency,
      merchantId,
      signature,
    });

    return NextResponse.json({ signature, merchantId });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al generar la firma." },
      { status: 500 },
    );
  }
}
