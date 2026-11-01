import { NextRequest } from "next/server";
import { admin, configured, env, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { tier: "hustler" | "kingpin" | "cartel"; period: "monthly" | "annual" };

export async function POST(req: NextRequest) {
  if (!configured) return notConfigured();

  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });

  const { tier, period } = (await req.json()) as Body;
  if (!["hustler", "kingpin", "cartel"].includes(tier)) {
    return Response.json({ error: "Unknown plan." }, { status: 400 });
  }

  const db = admin();
  const { data: row } = await db.from("tiers").select("label, monthly_cents, annual_cents").eq("id", tier).single();
  if (!row) return Response.json({ error: "Unknown plan." }, { status: 400 });

  const cents = period === "annual" ? row.annual_cents : row.monthly_cents;

  // Reuse the Stripe customer so a member's history stays on one record.
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", me.id).single();
  let customer = profile?.stripe_customer_id as string | undefined;
  if (!customer) {
    const c = await stripe().customers.create({ email: me.email, metadata: { player_id: me.id } });
    customer = c.id;
    await db.from("profiles").update({ stripe_customer_id: customer }).eq("id", me.id);
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: me.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: cents,
        recurring: { interval: period === "annual" ? "year" : "month" },
        product_data: { name: `Live From Leonida — ${row.label}` },
      },
    }],
    subscription_data: { metadata: { player_id: me.id, tier, period } },
    allow_promotion_codes: true,
    success_url: `${env.siteUrl}/dashboard?welcome=${tier}`,
    cancel_url: `${env.siteUrl}/pricing`,
  });

  return Response.json({ url: session.url });
}
