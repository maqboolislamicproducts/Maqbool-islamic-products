"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { useCustomer } from "@/components/providers/customer-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/components/providers/market-provider";
import { isValidMarketPhone, MARKET_PHONE_RULES, nationalPhoneDigits, toInternationalPhone } from "@/lib/phone";

function safeReturnPath(value: string | null) {
  return value && /^\/(?!\/)/.test(value) ? value : "/profile";
}

export function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useCustomer();
  const { marketSlug, market } = useMarket();
  const { toast } = useToast();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const otpRef = useRef<HTMLInputElement>(null);

  function requestOtp(event: FormEvent) {
    event.preventDefault();
    const cleanPhone = nationalPhoneDigits(phone, marketSlug);
    if (name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!isValidMarketPhone(cleanPhone, marketSlug)) {
      setError(`Enter a valid ${market.name} mobile number.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address for order updates.");
      return;
    }
    setPhone(cleanPhone);
    setError("");
    setStep("otp");
    window.setTimeout(() => otpRef.current?.focus(), 0);
  }

  function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (otp !== "123456") {
      setError("That code is incorrect. For this demo, use 123456.");
      return;
    }
    login(name.trim(), toInternationalPhone(phone, marketSlug), email.trim().toLowerCase());
    toast(`Welcome, ${name.trim().split(" ")[0]}.`);
    router.replace(safeReturnPath(params.get("returnTo")));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#eadfca] bg-white shadow-[0_24px_70px_rgba(15,56,44,.12)]">
      <div className="bg-forest px-7 py-8 text-white sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-gold">Maqbool account</p>
        <h1 className="mt-3 font-heading text-3xl">A quieter way to keep track.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#dce8e3]">
          Save addresses, revisit orders, and move through checkout without entering the same details twice.
        </p>
      </div>

      <div className="px-7 py-8 sm:px-10">
        <ol className="mb-8 flex items-center gap-3 text-xs font-semibold" aria-label="Login progress">
          <li className="flex items-center gap-2 text-forest" aria-current={step === "details" ? "step" : undefined}>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-white">1</span>
            Your details
          </li>
          <li className="h-px flex-1 bg-[#ded5c3]" aria-hidden="true" />
          <li className={`flex items-center gap-2 ${step === "otp" ? "text-forest" : "text-muted"}`} aria-current={step === "otp" ? "step" : undefined}>
            <span className={`grid h-7 w-7 place-items-center rounded-full ${step === "otp" ? "bg-forest text-white" : "bg-cream"}`}>2</span>
            Verify
          </li>
        </ol>

        {step === "details" ? (
          <form onSubmit={requestOtp} noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="customer-name" className="mb-2 block text-sm font-semibold text-forest">Full name</label>
                <Input id="customer-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(error && name.trim().length < 2)} placeholder="e.g. Ayesha Khan" />
              </div>
              <div>
                <label htmlFor="customer-email" className="mb-2 block text-sm font-semibold text-forest">Email address</label>
                <Input id="customer-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                <p className="mt-2 text-xs text-muted">We’ll send your order and delivery updates here.</p>
              </div>
              <div>
                <label htmlFor="customer-phone" className="mb-2 block text-sm font-semibold text-forest">Mobile number</label>
                <div className="flex">
                  <span className="grid h-10 place-items-center rounded-l-md border border-r-0 border-input bg-cream px-3 text-sm text-muted" aria-hidden="true">{MARKET_PHONE_RULES[marketSlug].callingCode}</span>
                  <Input id="customer-phone" className="rounded-l-none" inputMode="numeric" autoComplete="tel-national" maxLength={MARKET_PHONE_RULES[marketSlug].maxLength} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} aria-describedby="phone-hint login-error" placeholder={MARKET_PHONE_RULES[marketSlug].example} />
                </div>
                <p id="phone-hint" className="mt-2 text-xs text-muted">We use this only to identify your local demo account.</p>
              </div>
            </div>
            {error && <p id="login-error" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
            <button type="submit" className="mt-6 min-h-11 w-full rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
              Send demo OTP
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} noValidate>
            <button type="button" onClick={() => { setStep("details"); setError(""); }} className="mb-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-forest underline-offset-4 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Change number
            </button>
            <label htmlFor="customer-otp" className="mb-2 block text-sm font-semibold text-forest">Six-digit OTP</label>
            <Input ref={otpRef} id="customer-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} aria-invalid={Boolean(error)} aria-describedby="otp-note login-error" className="h-14 text-center text-xl tracking-[.45em]" />
            <p id="otp-note" className="mt-3 rounded-lg bg-cream px-4 py-3 text-sm text-forest">
              Demo mode: use <strong className="font-bold">123456</strong>. No SMS is sent.
            </p>
            {error && <p id="login-error" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
            <button type="submit" className="mt-6 min-h-11 w-full rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
              Verify and continue
            </button>
          </form>
        )}

        <div className="mt-7 grid gap-3 border-t border-[#eee7d8] pt-6 text-xs text-muted sm:grid-cols-2">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" /> Local demo session</span>
          <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-gold" aria-hidden="true" /> No payment data stored</span>
        </div>
      </div>
    </section>
  );
}
