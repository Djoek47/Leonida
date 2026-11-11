import { NextRequest } from "next/server";
import { admin, env } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Weekly round clock. Seeds upcoming Thursday-noon rounds and finalizes any
 *  that have closed. Idempotent: running it twice changes nothing. Votes and
 *  entries enforce their own time boundaries, so a late run is never unsafe. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("forbidden", { status: 403 });
  if (!env.serviceKey) return Response.json({ ok: false, reason: "no service key" });
  const { data, error } = await admin().rpc("round_tick");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, result: data });
}
