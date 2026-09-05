import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay/signatures";

export const runtime = "nodejs";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number; amount_refunded?: number } };
    order?: { entity?: { id?: string; status?: string } };
    refund?: { entity?: { payment_id?: string; status?: string } };
  };
};

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const body = await request.text();
  if (!secret || !signature || !verifyWebhookSignature({ body, signature, secret })) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: RazorpayWebhook;
  try {
    event = JSON.parse(body) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const gatewayOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  const supabase = createAdminClient();

  if ((event.event === "payment.captured" || event.event === "order.paid") && gatewayOrderId) {
    const { data: order, error: orderError } = await supabase.from("orders")
      .select("id,total,status")
      .eq("razorpay_order_id", gatewayOrderId)
      .maybeSingle();
    if (orderError) return NextResponse.json({ error: "Webhook update failed." }, { status: 500 });
    if (order) {
      const expectedAmount = Math.round(Number(order.total) * 100);
      const amountOk = typeof payment?.amount === "number" && payment.amount === expectedAmount;
      if (amountOk && order.status !== "cancelled") {
        const { error } = await supabase.from("orders").update({
          payment_status: "paid",
          payment_verified_at: new Date().toISOString(),
          ...(payment?.id ? { razorpay_payment_id: payment.id } : {}),
        }).eq("id", order.id);
        if (error) return NextResponse.json({ error: "Webhook update failed." }, { status: 500 });
      } else if (!amountOk) {
        console.error("Razorpay webhook amount mismatch", { gatewayOrderId, amount: payment?.amount, expectedAmount });
      } else {
        console.error("Razorpay webhook captured for cancelled order", { gatewayOrderId, orderId: order.id });
      }
    }
  } else if (event.event === "payment.failed" && gatewayOrderId) {
    const { error } = await supabase.from("orders").update({
      payment_status: "failed",
      ...(payment?.id ? { razorpay_payment_id: payment.id } : {}),
    })
      .eq("razorpay_order_id", gatewayOrderId).neq("payment_status", "paid");
    if (error) return NextResponse.json({ error: "Webhook update failed." }, { status: 500 });
  } else if (event.event === "refund.processed") {
    const paymentId = event.payload?.refund?.entity?.payment_id;
    const fullyRefunded = payment?.status === "refunded"
      || (typeof payment?.amount === "number" && payment.amount_refunded === payment.amount);
    if (paymentId && fullyRefunded) {
      const { error } = await supabase.from("orders").update({ payment_status: "refunded" })
        .eq("razorpay_payment_id", paymentId);
      if (error) return NextResponse.json({ error: "Webhook update failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
