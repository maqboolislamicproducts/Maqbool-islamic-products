import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lightweight deployment health check for the Razorpay integration.
 * Returns booleans only — never the secret values.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    razorpay: {
      webhookSecretSet: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      keyIdSet: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
      keySecretSet: Boolean(process.env.RAZORPAY_KEY_SECRET),
    },
  });
}
