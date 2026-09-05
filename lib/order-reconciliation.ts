import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const STALE_ORDER_GRACE_MINUTES = 30;

/**
 * Cancels online orders that were abandoned during checkout and releases their
 * reserved stock. This is a server-only helper (not exposed as a client-callable
 * server action) intended to be invoked from authenticated server components or a
 * scheduled job. A 30-minute grace comfortably exceeds Razorpay's 3-15 minute
 * transaction timeout, so it will never cancel an in-progress payment.
 */
export async function reconcileStaleOnlineOrders(): Promise<{ ok: true; cancelled: number }> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_ORDER_GRACE_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("orders")
    .select("id")
    .eq("payment_method", "online")
    .in("payment_status", ["pending", "failed"])
    .eq("status", "confirmed")
    .lt("created_at", cutoff);
  if (error) throw new Error(error.message);
  let cancelled = 0;
  for (const order of data ?? []) {
    const { data: updated, error: failError } = await supabase.from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id)
      .neq("payment_status", "paid")
      .select("id");
    if (failError || !updated?.length) continue;
    const { error: statusError } = await supabase.rpc("set_market_order_status", {
      order_id_input: order.id,
      status_input: "cancelled",
    });
    if (!statusError) cancelled += 1;
  }
  return { ok: true, cancelled };
}
