import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(expected: string, received: string) {
  if (!/^[a-f0-9]+$/i.test(expected) || !/^[a-f0-9]+$/i.test(received)) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}) {
  const expected = createHmac("sha256", input.secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, input.signature);
}

export function verifyWebhookSignature(input: { body: string; signature: string; secret: string }) {
  const expected = createHmac("sha256", input.secret).update(input.body).digest("hex");
  return safeEqualHex(expected, input.signature);
}
