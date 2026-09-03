"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, PackageCheck, ShoppingBag } from "lucide-react";
import { useCustomer } from "@/components/providers/customer-provider";
import { formatPrice } from "@/lib/commerce";
import type { MarketSlug } from "@/lib/markets";

export function OrderSuccess() {
  const params = useParams<{ id: string }>();
  const { orders } = useCustomer();
  const id = decodeURIComponent(params.id);
  const order = orders.find((item) => item.id === id);
  return (
    <main className="bg-cream py-14 sm:py-20">
      <div className="site-container">
        <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#e8ddc8] bg-white text-center shadow-[0_24px_70px_rgba(15,56,44,.1)]">
          <div className="bg-forest px-7 py-10 text-white">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/50 bg-white/10"><Check className="h-8 w-8 text-gold" strokeWidth={2.5} /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.22em] text-gold">Alhamdulillah</p>
            <h1 className="mt-2 font-heading text-3xl sm:text-4xl">Your order is confirmed</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#d7e4df]">Thank you for choosing Maqbool. We’ll prepare your items with care.</p>
          </div>
          <div className="p-7 sm:p-10">
            <div className="grid gap-4 rounded-xl bg-cream p-5 text-left sm:grid-cols-2">
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Order number</p><p className="mt-1 font-heading text-lg text-forest">#{id}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Order total</p><p className="mt-1 font-heading text-lg text-forest">{order ? formatPrice(order.total, (order.marketSlug ?? "in") as MarketSlug) : "Saved locally"}</p></div>
              {order && <><div><p className="text-xs font-bold uppercase tracking-wide text-muted">Payment</p><p className="mt-1 text-sm font-semibold text-forest">{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentStatus === "paid" ? "Paid securely online" : "Payment verification pending"}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-muted">Delivering to</p><p className="mt-1 text-sm font-semibold text-forest">{order.address.city}, {order.address.pincode}</p></div></>}
            </div>
            {!order && <p className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">Order details are stored in this browser and are not available in the current local session.</p>}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/profile/orders/${id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-forest px-6 text-sm font-semibold text-white"><PackageCheck className="h-4 w-4" /> View order</Link>
              <Link href="/shop" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-forest px-6 text-sm font-semibold text-forest"><ShoppingBag className="h-4 w-4" /> Continue shopping</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
