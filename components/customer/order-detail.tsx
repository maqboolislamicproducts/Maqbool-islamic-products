"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, Package } from "lucide-react";
import { useParams } from "next/navigation";
import { useCustomer } from "@/components/providers/customer-provider";
import { formatPrice } from "@/lib/commerce";
import type { MarketSlug } from "@/lib/markets";

export function OrderDetail() {
  const params = useParams<{ id: string }>();
  const { orders } = useCustomer();
  const order = orders.find((item) => item.id === decodeURIComponent(params.id));
  const marketSlug = (order?.marketSlug ?? "in") as MarketSlug;
  if (!order) {
    return (
      <div className="rounded-xl border border-[#e8ddc8] bg-white p-8 text-center">
        <Package className="mx-auto h-8 w-8 text-gold" />
        <h1 className="mt-4 font-heading text-2xl text-forest">Order not found</h1>
        <p className="mt-2 text-sm text-muted">This order may have been placed on another device or removed with local browser data.</p>
        <Link href="/profile/orders" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-forest px-5 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e8ddc8] bg-white p-6 sm:p-8">
        <Link href="/profile/orders" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest"><ArrowLeft className="h-4 w-4" /> All orders</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Order details</p><h1 className="mt-1 font-heading text-3xl text-forest">#{order.id}</h1><p className="mt-2 text-sm text-muted">Placed {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(order.createdAt))}</p></div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">{order.status}</span>
        </div>
        <div className="mt-8 space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-b border-[#eee7d8] pb-4 text-sm"><div><strong className="text-forest">{item.name}</strong><p className="mt-1 text-xs text-muted">{item.variantName} · Qty {item.quantity}</p></div><strong>{formatPrice(item.price * item.quantity, marketSlug)}</strong></div>
          ))}
        </div>
        <dl className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
          {[["Subtotal", order.subtotal], ["Shipping", order.shipping], ["Discount", -order.discount], [order.taxLabel ?? "Tax", order.tax ?? 0], ["COD charge", order.codCharge]].map(([label, value]) => Number(value) !== 0 && <div key={String(label)} className="flex justify-between"><dt className="text-muted">{label}</dt><dd>{Number(value) < 0 ? "−" : ""}{formatPrice(Math.abs(Number(value)), marketSlug)}</dd></div>)}
          <div className="flex justify-between border-t border-[#e8ddc8] pt-3 font-bold text-forest"><dt>Total</dt><dd>{formatPrice(order.total, marketSlug)}</dd></div>
        </dl>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-[#e8ddc8] bg-white p-6"><MapPin className="h-5 w-5 text-gold" /><h2 className="mt-3 font-heading text-xl text-forest">Delivery address</h2><address className="mt-3 text-sm not-italic leading-6 text-muted">{order.address.name}<br />{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br />{order.address.city}, {order.address.state} {order.address.pincode}<br />{order.address.phone}</address></section>
        <section className="rounded-xl border border-[#e8ddc8] bg-white p-6"><CheckCircle2 className="h-5 w-5 text-gold" /><h2 className="mt-3 font-heading text-xl text-forest">Payment</h2><p className="mt-3 text-sm text-muted">{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentStatus === "paid" ? "Paid online" : "Online payment pending"}</p><p className="mt-1 text-xs text-muted">{order.paymentMethod === "online" ? "Payment is processed securely through Razorpay." : "Pay the order total when your parcel arrives."}</p></section>
      </div>
    </div>
  );
}
