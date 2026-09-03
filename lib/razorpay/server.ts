import "server-only";

import Razorpay from "razorpay";

export function getRazorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay server environment variables are not configured.");
  return { keyId, keySecret };
}

export function createRazorpayClient() {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function toCurrencySubunits(amount: number) {
  const subunits = Math.round(amount * 100);
  if (!Number.isSafeInteger(subunits) || subunits < 100) throw new Error("The payment amount is invalid.");
  return subunits;
}
