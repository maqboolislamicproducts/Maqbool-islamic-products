"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "@/components/providers/customer-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";
type Result = { error?: string; message?: string; customer?: { name?: string; phone?: string; email?: string } };

function safeReturnPath(value: string | null) { return value && /^\/(?!\/)/.test(value) ? value : "/profile"; }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

/** Email OTP customer access. OTP creation, delivery and verification are server-owned. */
export function LoginFlow() {
  const router = useRouter(); const params = useSearchParams(); const { login } = useCustomer(); const { toast } = useToast();
  const otpRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("login"); const [otpSent, setOtpSent] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [otp, setOtp] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [pending, setPending] = useState(false); const [resendIn, setResendIn] = useState(0);

  async function requestOtp(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!validEmail(normalizedEmail)) return setError("Enter a valid email address.");
    if (mode === "register" && name.trim().length < 2) return setError("Enter your full name.");
    if (mode === "register" && phone.replace(/\D/g, "").length < 7) return setError("Enter a valid mobile number.");
    if (resendIn > 0) return;
    setPending(true);
    try {
      const response = await fetch("/api/auth/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "send", purpose: mode, email: normalizedEmail, name: name.trim(), phone: phone.trim() }) });
      const result = (await response.json().catch(() => ({}))) as Result & { challengeId?: string };
      if (!response.ok) throw new Error(result.error || "Unable to send the verification email.");
      if (!result.challengeId) throw new Error(result.message || "No account was found for this email. Create an account first.");
      setEmail(normalizedEmail); setChallengeId(result.challengeId); setOtpSent(true); setResendIn(60); setNotice(`A 6-digit verification code was sent to ${normalizedEmail}.`); window.setTimeout(() => otpRef.current?.focus(), 0);
      const timer = window.setInterval(() => setResendIn((current) => { if (current <= 1) { window.clearInterval(timer); return 0; } return current - 1; }), 1000);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to send the verification email."); } finally { setPending(false); }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault(); setError(""); if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code from your email.");
    setPending(true);
    try {
      const response = await fetch("/api/auth/email-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "verify", purpose: mode, email, code: otp, challengeId, name: name.trim(), phone: phone.trim() }) });
      const result = (await response.json().catch(() => ({}))) as Result;
      if (!response.ok) throw new Error(result.error || "That verification code is not valid.");
      login(result.customer?.name || name.trim() || "Customer", result.customer?.phone || phone.trim(), result.customer?.email || email); toast(mode === "login" ? "Welcome back." : "Your account is ready."); router.replace(safeReturnPath(params.get("returnTo")));
    } catch (verifyError) { setError(verifyError instanceof Error ? verifyError.message : "Unable to verify the code."); } finally { setPending(false); }
  }

  function switchMode(next: Mode) { setMode(next); setOtpSent(false); setChallengeId(""); setOtp(""); setError(""); setNotice(""); }
  return <section className="overflow-hidden rounded-2xl border border-[#eadfca] bg-white shadow-[0_24px_70px_rgba(15,56,44,.12)]">
    <div className="bg-forest px-7 py-8 text-white sm:px-10"><p className="text-xs font-semibold uppercase tracking-[.22em] text-gold">Maqbool account</p><h1 className="mt-3 font-heading text-3xl">{mode === "login" ? "Welcome back." : "Create your account."}</h1><p className="mt-3 max-w-md text-sm leading-6 text-[#dce8e3]">Use your email to securely access your orders and saved details.</p></div>
    <div className="px-7 py-8 sm:px-10">
      <div className="mb-7 grid grid-cols-2 rounded-lg border border-[#eadfca] p-1" role="tablist" aria-label="Account access">{(["login", "register"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => switchMode(item)} className={`min-h-10 rounded-md text-sm font-semibold ${mode === item ? "bg-forest text-white" : "text-forest hover:bg-cream"}`}>{item === "login" ? "Sign in" : "Create account"}</button>)}</div>
      <ol className="mb-8 flex items-center gap-3 text-xs font-semibold" aria-label="Email verification progress"><li className="flex items-center gap-2 text-forest"><span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-white">1</span>Email details</li><li className="h-px flex-1 bg-[#ded5c3]" aria-hidden="true" /><li className={`flex items-center gap-2 ${otpSent ? "text-forest" : "text-muted"}`}><span className={`grid h-7 w-7 place-items-center rounded-full ${otpSent ? "bg-forest text-white" : "bg-cream"}`}>2</span>Verify email</li></ol>
      {!otpSent ? <form onSubmit={requestOtp} noValidate><div className="space-y-5">{mode === "register" && <div><label htmlFor="customer-name" className="mb-2 block text-sm font-semibold text-forest">Full name</label><Input id="customer-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ayesha Khan" /></div>}<div><label htmlFor="customer-email" className="mb-2 block text-sm font-semibold text-forest">Email address</label><Input id="customer-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><p className="mt-2 text-xs text-muted">We&apos;ll send a one-time verification code here.</p></div>{mode === "register" && <div><label htmlFor="customer-phone" className="mb-2 block text-sm font-semibold text-forest">Mobile number</label><Input id="customer-phone" inputMode="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="98765 43210" /><p className="mt-2 text-xs text-muted">Used for delivery contact, not for OTP.</p></div>}</div>{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}<button type="submit" disabled={pending} className="mt-6 min-h-11 w-full rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest-light disabled:opacity-60">{pending ? "Sending…" : mode === "login" ? "Send login OTP" : "Send registration OTP"}</button></form> : <form onSubmit={verifyOtp} noValidate><button type="button" onClick={() => { setOtpSent(false); setError(""); setNotice(""); }} className="mb-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-forest underline-offset-4 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Change email</button><label htmlFor="customer-otp" className="mb-2 block text-sm font-semibold text-forest">Six-digit email OTP</label><Input ref={otpRef} id="customer-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="h-14 text-center text-xl tracking-[.45em]" />{notice && <p className="mt-3 rounded-lg bg-cream px-4 py-3 text-sm text-forest" role="status"><Mail className="mr-2 inline h-4 w-4" aria-hidden="true" />{notice}</p>}{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}<button type="submit" disabled={pending} className="mt-6 min-h-11 w-full rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest-light disabled:opacity-60">{pending ? "Verifying…" : mode === "login" ? "Verify and sign in" : "Verify and create account"}</button><button type="button" onClick={(event) => void requestOtp(event as unknown as FormEvent)} disabled={pending || resendIn > 0} className="mt-4 block w-full text-center text-xs font-semibold text-forest underline-offset-4 hover:underline disabled:opacity-50 disabled:no-underline">{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend verification code"}</button></form>}
      <div className="mt-7 grid gap-3 border-t border-[#eee7d8] pt-6 text-xs text-muted sm:grid-cols-2"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" /> Email verification</span><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-gold" aria-hidden="true" /> No password stored</span></div>
    </div>
  </section>;
}
