import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const ADMIN_COOKIE = "maqbool_admin_session";
export const ADMIN_SESSION_HOURS = 8;

function secretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(adminId: string) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_HOURS}h`)
    .sign(secretKey());
}

export async function verifyAdminSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.role === "admin" && payload.sub ? payload : null;
  } catch {
    return null;
  }
}

