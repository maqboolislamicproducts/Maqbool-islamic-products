"use client";

import { BadgeCheck, CalendarDays, Package, Phone } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedCustomer } from "@/components/customer/protected-customer";
import { AccountShell } from "@/components/customer/account-shell";
import { AddressBook } from "@/components/customer/address-book";
import { useCustomer } from "@/components/providers/customer-provider";
import { useMarket } from "@/components/providers/market-provider";
import { displayPhone } from "@/lib/phone";

function ProfileContent() {
  const { customer, orders } = useCustomer();
  const { marketSlug } = useMarket();
  const joined = customer ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(customer.verifiedAt)) : "";
  return (
    <AccountShell>
      <div className="rounded-xl border border-[#e8ddc8] bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Personal details</p>
        <h1 className="mt-1 font-heading text-3xl text-forest">Assalamu alaikum, {customer?.name.split(" ")[0]}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Your account keeps your delivery details and order history together for a smoother checkout.</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-cream p-5"><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><BadgeCheck className="h-4 w-4 text-gold" /> Name</dt><dd className="mt-2 text-sm font-semibold text-forest">{customer?.name}</dd></div>
          <div className="rounded-lg bg-cream p-5"><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><Phone className="h-4 w-4 text-gold" /> Mobile</dt><dd className="mt-2 text-sm font-semibold text-forest">{customer ? displayPhone(customer.phone, marketSlug) : ""}</dd></div>
          <div className="rounded-lg bg-cream p-5"><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><CalendarDays className="h-4 w-4 text-gold" /> Verified</dt><dd className="mt-2 text-sm font-semibold text-forest">{joined}</dd></div>
        </dl>
      </div>
      <div className="mt-8 rounded-xl border border-[#e8ddc8] bg-forest p-6 text-white sm:p-8">
        <Package className="h-6 w-6 text-gold" aria-hidden="true" />
        <p className="mt-3 font-heading text-2xl">{orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"} in your history` : "Your first order awaits"}</p>
        <p className="mt-2 text-sm text-[#d5e2dd]">{orders.length ? "Review details and delivery status from the Orders tab." : "Browse our collection and your completed checkout will appear here."}</p>
      </div>
      <AddressBook />
    </AccountShell>
  );
}

export default function ProfilePage() {
  return <><Header /><ProtectedCustomer><main className="bg-cream/50"><ProfileContent /></main></ProtectedCustomer><Footer /></>;
}
