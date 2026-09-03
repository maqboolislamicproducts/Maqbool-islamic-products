"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePercent, Check, CreditCard, LoaderCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useCustomer } from "@/components/providers/customer-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Input } from "@/components/ui/input";
import { calculateMarketCheckout, formatPrice } from "@/lib/commerce";
import type { Address, MockOrder, PaymentMethod } from "@/lib/models";
import { useMarket } from "@/components/providers/market-provider";
import { marketHref } from "@/lib/markets";
import { confirmRazorpayPayment, placeOrder as persistOrder, startRazorpayPayment, validateCoupon } from "@/app/checkout/actions";

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccess) => void | Promise<void>;
  prefill: { name: string; contact: string };
  notes: { order_number: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.head.appendChild(script);
  });
  return razorpayScriptPromise;
}

function blankAddress(name: string, phone: string, countryCode: string): Address {
  return { id: "", label: "Home", name, phone, line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false, countryCode };
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { customer, addresses, saveAddress, addOrder } = useCustomer();
  const { toast } = useToast();
  const { marketSlug, market, checkoutSettings } = useMarket();
  const [address, setAddress] = useState<Address>(() => blankAddress(customer?.name ?? "", customer?.phone ?? "", market.countryCode));
  const [selectedAddress, setSelectedAddress] = useState("new");
  const [saveForLater, setSaveForLater] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDefinition, setCouponDefinition] = useState<{ type: "percentage" | "flat"; value: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const totals = useMemo(() => calculateMarketCheckout(items, appliedCoupon, paymentMethod, checkoutSettings, couponDefinition), [appliedCoupon, checkoutSettings, couponDefinition, items, paymentMethod]);
  const marketAddresses = addresses.filter((item) => !item.countryCode || item.countryCode === market.countryCode);
  useEffect(() => {
    if (checkoutSettings && !checkoutSettings.codEnabled && checkoutSettings.onlineEnabled) setPaymentMethod("online");
  }, [checkoutSettings]);

  function chooseAddress(id: string) {
    setSelectedAddress(id);
    if (id === "new") {
      setAddress(blankAddress(customer?.name ?? "", customer?.phone ?? "", market.countryCode));
      return;
    }
    const saved = marketAddresses.find((item) => item.id === id);
    if (saved) setAddress({ ...saved });
  }

  async function applyCoupon() {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const result = await validateCoupon({ marketSlug, code: couponInput, subtotal });
    if (!result.ok) {
      setAppliedCoupon("");
      setCouponDefinition(null);
      setCouponMessage(result.error);
      return;
    }
    setAppliedCoupon(result.coupon.code);
    setCouponDefinition({ type: result.coupon.type, value: result.coupon.value });
    setCouponInput(result.coupon.code);
    setCouponMessage("Coupon applied.");
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!items.length) {
      setError("Your bag is empty.");
      return;
    }
    if (!address.name.trim() || !address.line1.trim() || !address.city.trim() || !address.state.trim()) {
      setError("Complete all required delivery fields.");
      return;
    }
    const phoneDigits = address.phone.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError("Enter a valid mobile number.");
      return;
    }
    if (!customer) {
      router.replace(`${marketHref(marketSlug, "/login")}?returnTo=${encodeURIComponent(marketHref(marketSlug, "/checkout"))}`);
      return;
    }
    if (!checkoutSettings) {
      setError("Checkout settings are unavailable for this market.");
      return;
    }

    setProcessing(true);
    const finalAddress = { ...address, countryCode: market.countryCode, id: address.id || `addr-${Date.now()}` };
    const checkoutInput = {
      marketSlug,
      items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      customer,
      address: finalAddress,
      paymentMethod,
      coupon: appliedCoupon,
    };
    const result = paymentMethod === "online"
      ? await startRazorpayPayment(checkoutInput)
      : await persistOrder(checkoutInput);
    if (!result.ok) {
      setError(result.error);
      setProcessing(false);
      return;
    }

    const finishOrder = (paymentStatus: MockOrder["paymentStatus"]) => {
      if (saveForLater && selectedAddress === "new") saveAddress(finalAddress);
      const order: MockOrder = {
      id: result.order.orderNumber,
      createdAt: result.order.createdAt,
      customer,
      address: finalAddress,
      items: items.map((item) => ({ ...item })),
      subtotal: result.order.subtotal,
      shipping: result.order.shipping,
      discount: result.order.discount,
      codCharge: result.order.codFee,
      tax: result.order.tax,
      taxLabel: result.order.taxLabel,
      total: result.order.total,
      marketSlug,
      currencyCode: result.order.currencyCode,
      paymentStatus,
      paymentMethod,
      status: "confirmed",
      };
      addOrder(order);
      clear();
      toast(paymentStatus === "paid" ? "Payment received and order placed." : "Order placed successfully.");
      router.replace(marketHref(marketSlug, `/order-success/${order.id}`));
    };

    if (paymentMethod === "cod") {
      finishOrder(result.order.paymentStatus);
      return;
    }

    try {
      await loadRazorpayCheckout();
      if (!("razorpay" in result) || !result.razorpay || typeof result.razorpay !== "object" || !window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable.");
      }
      const gateway = result.razorpay as { keyId: string; orderId: string; amount: number; currency: string };
      const checkout = new window.Razorpay({
        key: gateway.keyId,
        amount: gateway.amount,
        currency: gateway.currency,
        name: "Maqbool Islamic Products",
        description: `Order ${result.order.orderNumber}`,
        order_id: gateway.orderId,
        prefill: { name: customer.name, contact: customer.phone },
        notes: { order_number: result.order.orderNumber },
        theme: { color: "#0f382c" },
        modal: { ondismiss: () => setProcessing(false) },
        handler: async (response) => {
          const confirmation = await confirmRazorpayPayment({
            orderNumber: result.order.orderNumber,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          if (!confirmation.ok) {
            setError(confirmation.error);
            setProcessing(false);
            return;
          }
          finishOrder(confirmation.paymentStatus);
        },
      });
      checkout.on("payment.failed", (response) => {
        setError(response.error?.description ?? "Payment failed. Please try again.");
        setProcessing(false);
      });
      checkout.open();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to open Razorpay Checkout.");
      setProcessing(false);
    }
  }

  if (!items.length) {
    return (
      <div className="site-container py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#e8ddc8] bg-white px-7 py-12 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-gold" aria-hidden="true" />
          <h1 className="mt-5 font-heading text-3xl text-forest">Your bag is empty</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Add something meaningful before beginning checkout.</p>
          <Link href={marketHref(marketSlug, "/shop")} className="mt-7 inline-flex min-h-11 items-center rounded-md bg-forest px-6 text-sm font-semibold text-white">Browse products</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="site-container grid gap-8 py-12 lg:grid-cols-[1fr_390px]" noValidate>
      <div className="space-y-7">
        <section className="rounded-xl border border-[#e8ddc8] bg-white p-6 sm:p-8" aria-labelledby="delivery-heading">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold text-white">1</span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-gold">Where should it go?</p><h1 id="delivery-heading" className="font-heading text-2xl text-forest">Delivery address</h1></div></div>
          <p className="mt-3 text-sm text-muted">Delivering within <strong className="text-forest">{market.name}</strong>. The address country must match this market.</p>
          {marketAddresses.length > 0 && (
            <fieldset className="mt-7">
              <legend className="text-sm font-semibold text-forest">Choose a saved address</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {marketAddresses.map((saved) => (
                  <label key={saved.id} className={`cursor-pointer rounded-lg border p-4 text-sm ${selectedAddress === saved.id ? "border-forest bg-cream" : "border-[#e8ddc8]"}`}>
                    <input type="radio" name="saved-address" value={saved.id} checked={selectedAddress === saved.id} onChange={() => chooseAddress(saved.id)} className="mr-2 accent-forest" />
                    <strong className="text-forest">{saved.label}</strong>
                    <span className="mt-2 block text-xs leading-5 text-muted">{saved.line1}, {saved.city} {saved.pincode}</span>
                  </label>
                ))}
                <label className={`cursor-pointer rounded-lg border p-4 text-sm ${selectedAddress === "new" ? "border-forest bg-cream" : "border-[#e8ddc8]"}`}>
                  <input type="radio" name="saved-address" value="new" checked={selectedAddress === "new"} onChange={() => chooseAddress("new")} className="mr-2 accent-forest" />
                  <strong className="text-forest">Use a new address</strong>
                </label>
              </div>
            </fieldset>
          )}
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              ["name", "Recipient name", "Full name"],
              ["phone", "Mobile number", "Include country/area code"],
              ["line1", "Address line 1", "House number and street"],
              ["line2", "Address line 2 (optional)", "Area or landmark"],
              ["city", "City", "City"],
              ["state", "State", "State"],
              ["pincode", "Pincode", "6 digits"],
            ].map(([field, label, placeholder]) => (
              <label key={field} className={`text-sm font-semibold text-forest ${field === "line1" || field === "line2" ? "sm:col-span-2" : ""}`}>
                {label}
                <Input className="mt-2 font-normal text-[#2b2b2b]" value={String(address[field as keyof Address] ?? "")} onChange={(event) => setAddress({ ...address, [field]: field === "phone" ? event.target.value.replace(/[^\d+]/g, "") : event.target.value })} maxLength={field === "phone" ? 16 : field === "pincode" ? 12 : undefined} inputMode={field === "phone" ? "tel" : undefined} autoComplete={field === "name" ? "name" : field === "phone" ? "tel" : field === "pincode" ? "postal-code" : field === "city" ? "address-level2" : field === "state" ? "address-level1" : "street-address"} placeholder={field === "pincode" && (marketSlug === "dubai" || marketSlug === "qa") ? "Optional postal code" : placeholder} />
              </label>
            ))}
          </div>
          {selectedAddress === "new" && <label className="mt-5 flex min-h-11 items-center gap-3 text-sm font-medium text-forest"><input type="checkbox" checked={saveForLater} onChange={(event) => setSaveForLater(event.target.checked)} className="h-4 w-4 accent-forest" /> Save this address to my account</label>}
        </section>

        <section className="rounded-xl border border-[#e8ddc8] bg-white p-6 sm:p-8" aria-labelledby="payment-heading">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold text-white">2</span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-gold">Complete your order</p><h2 id="payment-heading" className="font-heading text-2xl text-forest">Payment method</h2></div></div>
          <fieldset className="mt-7 grid gap-3">
            <legend className="sr-only">Choose payment method</legend>
            <label className={`flex cursor-pointer items-start gap-4 rounded-lg border p-5 ${paymentMethod === "cod" ? "border-forest bg-cream" : "border-[#e8ddc8]"}`}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} disabled={!checkoutSettings?.codEnabled} onChange={() => setPaymentMethod("cod")} className="mt-1 accent-forest" />
              <Truck className="h-5 w-5 text-gold" aria-hidden="true" />
              <span><strong className="block text-sm text-forest">Cash on delivery</strong><small className="mt-1 block text-xs leading-5 text-muted">Pay when your parcel arrives. A small handling charge applies.</small></span>
            </label>
            <label className={`flex cursor-pointer items-start gap-4 rounded-lg border p-5 ${paymentMethod === "online" ? "border-forest bg-cream" : "border-[#e8ddc8]"}`}>
              <input type="radio" name="payment" value="online" checked={paymentMethod === "online"} disabled={!checkoutSettings?.onlineEnabled} onChange={() => setPaymentMethod("online")} className="mt-1 accent-forest" />
              <CreditCard className="h-5 w-5 text-gold" aria-hidden="true" />
              <span><strong className="block text-sm text-forest">Pay online securely</strong><small className="mt-1 block text-xs leading-5 text-muted">Pay with UPI, cards or netbanking through Razorpay.</small></span>
            </label>
          </fieldset>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-[#e8ddc8] bg-white p-6 shadow-[0_15px_45px_rgba(15,56,44,.08)] lg:sticky lg:top-28" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="font-heading text-2xl text-forest">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {items.map((item) => <li key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-muted"><strong className="font-semibold text-[#2b2b2b]">{item.name}</strong><small className="mt-0.5 block">{item.variantName} · Qty {item.quantity}</small></span><strong className="min-w-fit text-forest">{formatPrice(item.price * item.quantity, marketSlug)}</strong></li>)}
        </ul>
        <div className="mt-6 border-y border-[#e8ddc8] py-5">
          <label htmlFor="coupon" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest"><BadgePercent className="h-4 w-4 text-gold" /> Coupon code</label>
          <div className="mt-2 flex gap-2"><Input id="coupon" value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="Enter code" /><button type="button" onClick={applyCoupon} className="min-h-11 rounded-md border border-forest px-4 text-xs font-bold text-forest">Apply</button></div>
          {couponMessage && <p className={`mt-2 text-xs ${appliedCoupon ? "text-emerald-800" : "text-red-800"}`} role="status">{appliedCoupon && <Check className="mr-1 inline h-3 w-3" />}{couponMessage}</p>}
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(totals.subtotal, marketSlug)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{totals.shipping ? formatPrice(totals.shipping, marketSlug) : "Free"}</dd></div>
          {totals.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Coupon discount</dt><dd>−{formatPrice(totals.discount, marketSlug)}</dd></div>}
          {totals.tax > 0 && <div className="flex justify-between"><dt className="text-muted">{checkoutSettings?.taxLabel ?? "Tax"} ({checkoutSettings?.taxRate ?? 0}%)</dt><dd>{formatPrice(totals.tax, marketSlug)}</dd></div>}
          {totals.codCharge > 0 && <div className="flex justify-between"><dt className="text-muted">COD handling</dt><dd>{formatPrice(totals.codCharge, marketSlug)}</dd></div>}
          <div className="flex justify-between border-t border-[#e8ddc8] pt-4 font-heading text-xl text-forest"><dt>Total</dt><dd>{formatPrice(totals.total, marketSlug)}</dd></div>
        </dl>
        {checkoutSettings?.freeShippingThreshold && totals.subtotal < checkoutSettings.freeShippingThreshold && <p className="mt-4 rounded-md bg-cream px-3 py-2 text-xs text-muted">Add {formatPrice(checkoutSettings.freeShippingThreshold - totals.subtotal, marketSlug)} more for free shipping.</p>}
        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>}
        <button type="submit" disabled={processing || !checkoutSettings} aria-busy={processing} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-forest px-5 text-sm font-bold text-white hover:bg-forest-light disabled:opacity-60">
          {!checkoutSettings ? "Loading checkout settings…" : processing ? <><LoaderCircle className="h-4 w-4 animate-spin" /> {paymentMethod === "online" ? "Opening secure payment…" : "Placing order…"}</> : paymentMethod === "online" ? "Pay securely with Razorpay" : "Place COD order"}
        </button>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Payments are processed securely by Razorpay. By placing your order, you agree to our <Link href="/policies/terms" className="font-semibold text-forest underline">terms</Link>.</p>
      </aside>
    </form>
  );
}
