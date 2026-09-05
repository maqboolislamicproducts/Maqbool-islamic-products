"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/models";
import { getCustomerSession } from "@/lib/customer-auth";

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export async function syncCustomerOrderStatuses(input: {
  phone: string;
  orderNumbers: string[];
}): Promise<{ ok: true; orders: Array<{ orderNumber: string; status: OrderStatus; paymentStatus: "pending" | "simulated" | "paid" | "failed" | "refunded" }> } | { ok: false }> {
  const session = await getCustomerSession();
  if (!session) return { ok: false };
  const phone = normalizePhone(input.phone);
  if (normalizePhone(session.phone) !== phone) return { ok: false };
  const orderNumbers = [...new Set(input.orderNumbers.map((item) => item.trim().toUpperCase()).filter(Boolean))].slice(0, 50);
  if (phone.length < 7 || phone.length > 15 || !orderNumbers.length) return { ok: false };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_number,customer_phone,status,payment_status")
    .in("order_number", orderNumbers);
  if (error) return { ok: false };

  return {
    ok: true,
    orders: (data ?? [])
      .filter((order) => normalizePhone(order.customer_phone) === phone)
      .map((order) => ({ orderNumber: order.order_number, status: order.status, paymentStatus: order.payment_status })),
  };
}
