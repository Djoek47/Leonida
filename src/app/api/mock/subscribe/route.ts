import { NextRequest } from "next/server";
import { admin, env, mockReady, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { tier: "street" | "hustler" | "kingpin"; period: "monthly" | "annual"; cancel?: boolean };

/** Test-mode subscriptions.
 *
 *  Applies exactly what the Stripe webhook would apply — tier, status, period
 *  end, the cycle's download credits — so everything downstream of
 *  paying (vote allowance, daily cap, download credits, the six-star tracker,
 *  the prize pool's member count) can be exercised without a card.
 *
 *  Only runs when MOCK_PAYMENTS=1, and never against a live Stripe key. */
export async function POST(req: NextRequest) {
  if (!mockReady) {
    return Response.json({ error: "Test payments are off for this deployment." }, { status: 503 });
  }

  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });

  const { tier, period, cancel } = (await req.json()) as Body;
  const db = admin();

  if (cancel) {
    await db.from("profiles").update({
      tier: "free", subscription_status: "canceled",
      billing_period: null, credits_remaining: 0,
    }).eq("id", me.id);
    await db.from("money_events").insert({
      kind: "subscription_ended", player_id: me.id, amount_cents: 0, note: "test mode",
    });
    return Response.json({ ok: true, tier: "free" });
  }

  if (!["street", "hustler", "kingpin"].includes(tier)) {
    return Response.json({ error: "Unknown plan." }, { status: 400 });
  }

  const { data: row } = await db.from("tiers")
    .select("label, monthly_cents, annual_cents").eq("id", tier).single();
  if (!row) return Response.json({ error: "Unknown plan." }, { status: 400 });

  const annual = period === "annual";
  const periodEnd = new Date(Date.now() + (annual ? 365 : 30) * 86400_000).toISOString();

  const { error } = await db.from("profiles").update({
    tier,
    billing_period: annual ? "annual" : "monthly",
    subscription_status: "active",
    current_period_end: periodEnd,
  }).eq("id", me.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Same call the webhook makes: credits for the new cycle, and
  // subscribed_since set the first time so the star tracker starts counting.
  await db.rpc("grant_cycle_credits", { p_user: me.id, p_period_end: periodEnd });

  await db.from("money_events").insert({
    kind: "subscription_active", player_id: me.id,
    amount_cents: annual ? row.annual_cents : row.monthly_cents,
    note: `${tier} (test mode)`,
  });

  return Response.json({ ok: true, tier, periodEnd, siteUrl: env.siteUrl });
}
