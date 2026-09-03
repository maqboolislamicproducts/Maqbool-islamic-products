"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { useCustomer } from "@/components/providers/customer-provider";
import { formatPrice } from "@/lib/commerce";
import type { MarketSlug } from "@/lib/markets";

const statusStyles: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-800",
  processing: "bg-amber-50 text-amber-800",
  shipped: "bg-violet-50 text-violet-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-800",
};

export function OrderList() {
  const { orders } = useCustomer();
  return (
    <div className="rounded-xl border border-[#e8ddc8] bg-white p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Purchase history</p>
      <h1 className="mt-1 font-heading text-3xl text-forest">Your orders</h1>
      {!orders.length ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#d8caaa] bg-cream/50 px-6 py-12 text-center">
          <PackageOpen className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl text-forest">No orders yet</h2>
          <p className="mt-2 text-sm text-muted">Once you complete checkout, your order will be shown here.</p>
          <Link href="/shop" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-forest px-5 text-sm font-semibold text-white">Browse products</Link>
        </div>
      ) : (
        <ul className="mt-7 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/profile/orders/${order.id}`} className="group grid gap-4 rounded-xl border border-[#e8ddc8] p-5 transition-colors hover:border-gold sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <strong className="font-heading text-lg text-forest">#{order.id}</strong>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(order.createdAt))} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) · {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentStatus === "paid" ? "Paid online" : "Online payment pending"}</p>
                </div>
                <span className="flex items-center justify-between gap-5 font-bold text-forest">{formatPrice(order.total, (order.marketSlug ?? "in") as MarketSlug)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
