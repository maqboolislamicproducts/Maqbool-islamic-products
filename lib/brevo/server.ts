import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

export async function sendOrderConfirmationEmail(orderNumber: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "Maqbool Islamic Products";
  if (!apiKey || !senderEmail) return { ok: false as const, error: "Brevo server environment variables are not configured." };

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id,order_number,customer_name,customer_email,total,currency_code,confirmation_email_sent_at")
    .eq("order_number", orderNumber).single();
  if (orderError || !order) return { ok: false as const, error: "Order was not found." };
  if (!order.customer_email) return { ok: false as const, error: "Customer email is unavailable." };
  if (order.confirmation_email_sent_at) return { ok: true as const, skipped: true };

  const { data: items } = await supabase.from("order_items")
    .select("product_name,variant_name,quantity,line_total").eq("order_id", order.id);
  const itemLines = (items ?? []).map((item) => `<li>${escapeHtml(item.product_name)} — ${escapeHtml(item.variant_name)} × ${item.quantity}: ${escapeHtml(String(item.line_total))} ${escapeHtml(order.currency_code)}</li>`).join("");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ name: order.customer_name, email: order.customer_email }],
      subject: `Order confirmation — ${order.order_number}`,
      htmlContent: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Thank you for your order, ${escapeHtml(order.customer_name)}.</h2><p>Your order <strong>${escapeHtml(order.order_number)}</strong> has been confirmed.</p><ul>${itemLines}</ul><p><strong>Total: ${escapeHtml(String(order.total))} ${escapeHtml(order.currency_code)}</strong></p><p>We’ll send another update when your order ships.</p></div>`,
      textContent: `Thank you for your order, ${order.customer_name}. Order ${order.order_number} is confirmed. Total: ${order.total} ${order.currency_code}.`,
      headers: { "Idempotency-Key": `order-confirmation-${order.id}` },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Brevo order email failed", response.status, await response.text());
    return { ok: false as const, error: "Unable to send the order email." };
  }
  await supabase.from("orders").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", order.id).is("confirmation_email_sent_at", null);
  return { ok: true as const, skipped: false };
}
