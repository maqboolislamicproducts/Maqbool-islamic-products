import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCustomerSession();
  return NextResponse.json({ customer: session ? { name: session.name, phone: session.phone, email: session.email } : null }, { headers: { "cache-control": "private, no-store" } });
}
