import { NextRequest } from "next/server";
import { admin, configured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Did my payment go through?" answered by Stripe itself, not by waiting for
 *  the webhook. Reads the member's live subscription and applies it the same
 *  way the webhook does, so the confirmation on screen is the truth. */
export async function POST(req: NextRequest) {
  if (!configured) return Response.json({ tier: null });
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const db = admin();
  const { data: p } = await db.from("profiles").select("stripe_customer_id, tier, subscription_status").eq("id", me.id).single();
  if (!p?.stripe_customer_id) return Response.json({ tier: p?.tier ?? "free", status: p?.subscription_status ?? "none" });

  const subs = await stripe().subscriptions.list({ customer: p.stripe_customer_id, status: "all", limit: 5 });
  const live = subs.data.find((s) => ["active", "trialing"].includes(s.status));
  if (!live) return Response.json({ tier: p.tier, status: p.subscription_status, paid: false });

  const { data: tiers } = await db.from("tiers").select("id, monthly_cents, annual_cents");
  const named = live.metadata?.tier;
  const paid = live.items.data[0]?.price.unit_amount ?? 0;
  const tier = (named && tiers?.some((t) => t.id === named) ? named
    : tiers?.find((t) => t.id !== "free" && (t.monthly_cents === paid || t.annual_cents === paid))?.id) ?? "street";
  const item = live.items.data[0] as { current_period_end?: number };
  const end = new Date((item?.current_period_end ?? Date.now() / 1000 + 30 * 86400) * 1000).toISOString();

  if (p.tier !== tier || p.subscription_status !== live.status) {
    await db.from("profiles").update({ tier, subscription_status: live.status, stripe_subscription_id: live.id,
      billing_period: live.metadata?.period ?? "monthly", current_period_end: end }).eq("id", me.id);
    await db.rpc("grant_cycle_credits", { p_user: me.id, p_period_end: end });
  }
  return Response.json({ tier, status: live.status, paid: true });
}
