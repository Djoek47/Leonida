import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { admin, configured, env, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Card management, through Stripe's own hosted page.
 *
 *  { action: "card" } returns the card on file (brand, last four, expiry) so the
 *  wallet can show it. Anything else opens Stripe's billing portal, where the member
 *  adds a card, makes another the default, edits the billing name and address, removes
 *  a card, and reads their invoices. We never see card numbers.
 *
 *  The portal is deliberately narrow: no cancel and no plan switch in there. Both have
 *  their own flow on the site (cancel runs to the end of the paid period; plan changes
 *  prorate), and two doors into the same subscription would drift apart. */

// The Stripe account is shared with another app that has its own default portal. Ours is
// found by metadata and always passed by id, so we never touch or depend on that one.
// If it doesn't exist yet in this Stripe mode (test or live) it is created here.
let portalConfig: string | null = null;
async function config(): Promise<string> {
  if (portalConfig) return portalConfig;
  const s = stripe();
  const list = await s.billingPortal.configurations.list({ active: true, limit: 100 });
  const mine = list.data.find((c) => c.metadata?.app === "lfl");
  if (mine) return (portalConfig = mine.id);
  const made = await s.billingPortal.configurations.create({
    name: "Live From Leonida",
    default_return_url: `${env.siteUrl}/wallet`,
    metadata: { app: "lfl" },
    business_profile: {
      headline: "Live From Leonida: manage your card and receipts",
      privacy_policy_url: `${env.siteUrl}/privacy`,
      terms_of_service_url: `${env.siteUrl}/terms`,
    },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["name", "address"] },
      subscription_cancel: { enabled: false },
      subscription_update: { enabled: false },
    },
  });
  return (portalConfig = made.id);
}

/** The card the next renewal will use: the subscription's own, else the customer's default, else any card. */
async function cardOf(customer: string, subscription?: string | null) {
  const s = stripe();
  let pm: Stripe.PaymentMethod | null = null;
  if (subscription) {
    const sub = await s.subscriptions.retrieve(subscription, { expand: ["default_payment_method"] });
    if (sub.default_payment_method && typeof sub.default_payment_method !== "string") pm = sub.default_payment_method;
  }
  if (!pm) {
    const c = await s.customers.retrieve(customer, { expand: ["invoice_settings.default_payment_method"] });
    if (!c.deleted) {
      const d = c.invoice_settings.default_payment_method;
      if (d && typeof d !== "string") pm = d;
    }
  }
  if (!pm) pm = (await s.paymentMethods.list({ customer, type: "card", limit: 1 })).data[0] ?? null;
  const k = pm?.card;
  return k ? { brand: k.brand, last4: k.last4, exp_month: k.exp_month, exp_year: k.exp_year } : null;
}

export async function POST(req: NextRequest) {
  if (env.mock) return Response.json({ mock: true });
  if (!configured) return notConfigured();
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };

  const { data: p } = await admin().from("profiles").select("stripe_customer_id, stripe_subscription_id").eq("id", me.id).single();
  if (!p?.stripe_customer_id) return Response.json({ error: "No card on file yet. It appears here after your first payment." }, { status: 400 });

  try {
    if (action === "card") return Response.json({ card: await cardOf(p.stripe_customer_id, p.stripe_subscription_id) });
    const session = await stripe().billingPortal.sessions.create({
      customer: p.stripe_customer_id,
      configuration: await config(),
      return_url: `${env.siteUrl}/wallet#card`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    console.error("[billing/portal] failed:", (e as Error).message);
    return Response.json({ error: "Couldn't open your card settings. Try again in a minute." }, { status: 502 });
  }
}
