import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";

type Purpose = "login" | "register";
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function validEmail(email: string) { return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function hashCode(code: string) {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not configured.");
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}
function sameHash(left: string, right: string) {
  const a = Buffer.from(left, "hex"); const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function error(message: string, status = 400) { return NextResponse.json({ ok: false, error: message }, { status }); }

async function sendBrevo(email: string, code: string, purpose: Purpose) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Maqbool Islamic Products";
  if (!apiKey || !senderEmail) throw new Error("Brevo email environment variables are not configured.");
  const action = purpose === "register" ? "confirm your account" : "sign in";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email }], subject: `Your Maqbool verification code`, textContent: `Use ${code} to ${action}. This code expires in 10 minutes. If you did not request this, you can ignore this email.`, htmlContent: `<p>Use <strong style="font-size:24px;letter-spacing:6px">${code}</strong> to ${action}.</p><p>This code expires in 10 minutes.</p>` }),
    cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.text();
    console.error("Brevo OTP delivery failed", response.status, details.slice(0, 1000));
    throw new Error(`Brevo returned ${response.status}: ${details.slice(0, 500)}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; email?: unknown; purpose?: Purpose; code?: unknown; name?: unknown; phone?: unknown; challengeId?: unknown };
    const email = normalizeEmail(body.email);
    const purpose = body.purpose;
    if (!validEmail(email) || (purpose !== "login" && purpose !== "register")) return error("A valid email and authentication purpose are required.");
    const supabase = createAdminClient();

    if (body.action === "send") {
      const { data: recent } = await supabase.from("email_otp_challenges").select("id,last_sent_at").eq("email", email).eq("purpose", purpose).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (recent && Date.now() - new Date(recent.last_sent_at).getTime() < RESEND_WAIT_MS) return error("Please wait before requesting another code.", 429);
      if (purpose === "login") {
        const { data: profile } = await supabase.from("customer_profiles").select("id").eq("email", email).limit(1).maybeSingle();
        if (!profile) return NextResponse.json({ ok: true, message: "If an account exists, a verification code has been sent." });
      }
      const code = randomInt(100000, 1000000).toString();
      await supabase.from("email_otp_challenges").delete().eq("email", email).eq("purpose", purpose);
      const { data: challenge, error: insertError } = await supabase.from("email_otp_challenges").insert({ email, purpose, code_hash: hashCode(code), name: typeof body.name === "string" ? body.name.trim().slice(0, 120) : null, phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null, expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString() }).select("id").single();
      if (insertError || !challenge) throw new Error("Unable to create verification challenge.");
      try { await sendBrevo(email, code, purpose); } catch (sendError) { await supabase.from("email_otp_challenges").delete().eq("id", challenge.id); throw sendError; }
      return NextResponse.json({ ok: true, challengeId: challenge.id, message: "Verification code sent." });
    }

    if (body.action !== "verify" || typeof body.code !== "string" || !/^\d{6}$/.test(body.code) || typeof body.challengeId !== "string") return error("A verification code is required.");
    const { data: challenge } = await supabase.from("email_otp_challenges").select("*").eq("id", body.challengeId).eq("email", email).eq("purpose", purpose).is("consumed_at", null).maybeSingle();
    if (!challenge) return error("That code is invalid or expired.", 401);
    if (new Date(challenge.expires_at).getTime() <= Date.now()) return error("That code has expired. Request a new one.", 401);
    if (challenge.attempts >= MAX_ATTEMPTS) return error("Too many attempts. Request a new code.", 429);
    await supabase.from("email_otp_challenges").update({ attempts: challenge.attempts + 1 }).eq("id", challenge.id);
    if (!sameHash(challenge.code_hash, hashCode(body.code))) return error("That code is incorrect.", 401);
    await supabase.from("email_otp_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", challenge.id);
    let profile;
    if (purpose === "register") {
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : challenge.name?.trim();
      const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : challenge.phone?.trim();
      if (!name || name.length < 2 || !phone) return error("Name and mobile number are required to create an account.");
      const normalizedPhone = phone.replace(/\D/g, "");
      const { data: existingEmail } = await supabase.from("customer_profiles").select("id").eq("email", email).limit(1).maybeSingle();
      if (existingEmail) return error("An account with this email already exists. Sign in instead.", 409);
      const { data: existingPhone } = await supabase.from("customer_profiles").select("id,email").eq("normalized_phone", normalizedPhone).limit(1).maybeSingle();
      if (existingPhone) return error("This mobile number is already linked to an account.", 409);
      const result = await supabase.from("customer_profiles").insert({ name, phone, normalized_phone: normalizedPhone, email, is_active: true }).select("id,name,phone,email,is_active").single();
      if (result.error || !result.data) throw new Error("Unable to create customer account.");
      profile = result.data;
    } else {
      const result = await supabase.from("customer_profiles").select("id,name,phone,email,is_active").eq("email", email).limit(1).maybeSingle();
      if (result.error || !result.data || !result.data.is_active) return error("Unable to sign in to this account.", 401);
      profile = result.data;
    }
    await createCustomerSession({ id: profile.id, email: profile.email || email, name: profile.name, phone: profile.phone });
    return NextResponse.json({ ok: true, customer: { name: profile.name, phone: profile.phone, email: profile.email || email, verifiedAt: new Date().toISOString() } });
  } catch (caught) {
    console.error("Email OTP authentication failed", caught);
    return error("Unable to process email verification right now.", 500);
  }
}
