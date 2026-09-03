import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay/signatures";

describe("Razorpay signatures", () => {
  it("verifies a payment signature", () => {
    const signature = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature, secret: "secret" })).toBe(true);
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_2", signature, secret: "secret" })).toBe(false);
  });

  it("verifies the raw webhook body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", "webhook-secret").update(body).digest("hex");
    expect(verifyWebhookSignature({ body, signature, secret: "webhook-secret" })).toBe(true);
    expect(verifyWebhookSignature({ body: `${body} `, signature, secret: "webhook-secret" })).toBe(false);
  });
});
