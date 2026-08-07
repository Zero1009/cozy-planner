import { NextResponse } from "next/server";
import { getVapidPublicKey, hasVapidConfig } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ publicKey, configured: hasVapidConfig() });
}
