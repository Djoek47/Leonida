import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { watermarkBacklog } from "@/lib/watermarkJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;
function same(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

/** Daily safety net (Vercel cron): watermarks any live clip that slipped through without one. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !same(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) return new Response("forbidden", { status: 403 });
  const r = await watermarkBacklog((maxDuration - 30) * 1000);
  return Response.json(r);
}
