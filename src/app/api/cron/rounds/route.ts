import { NextRequest } from "next/server";
import { admin, env } from "@/lib/server";
import { timingSafeEqual } from "node:crypto";
/** Constant-time string compare, so a secret can't be guessed byte by byte. */
function same(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Weekly round clock. Seeds upcoming Thursday-noon rounds and finalizes any
 *  that have closed. Idempotent: running it twice changes nothing. Votes and
 *  entries enforce their own time boundaries, so a late run is never unsafe. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !same(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) return new Response("forbidden", { status: 403 });
  if (!env.serviceKey) return Response.json({ ok: false, reason: "no service key" });
  const { data, error } = await admin().rpc("round_tick");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, result: data });
}
