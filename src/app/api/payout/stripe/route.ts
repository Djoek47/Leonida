import { NextRequest } from "next/server";
import { admin, configured, env, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Get paid through Stripe.
 *
 *  { action: "connect" } — makes (or reuses) the member's Stripe Express
 *  account and returns Stripe's hosted sign-up, where they add the debit card
 *  or bank account the money should land on. We never see those details.
 *  { action: "status" } — asks Stripe whether the account can receive money
 *  yet, and if so makes Stripe the member's payout method. */
export async function POST(req: NextRequest) {
  if (!configured) return notConfigured();
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  const db = admin();
  const { data: p } = await db.from("profiles").select("stripe_connect_id").eq("id", me.id).single();

  if (action === "status") {
    if (!p?.stripe_connect_id) return Response.json({ ready: false });
    const acct = await stripe().accounts.retrieve(p.stripe_connect_id);
    const ready = acct.capabilities?.transfers === "active" && Boolean(acct.details_submitted);
    await db.from("profiles").update({ stripe_connect_ready: ready, ...(ready ? { payout_method: "stripe", payout_handle: "Stripe account" } : {}) }).eq("id", me.id);
    return Response.json({ ready });
  }

  // Manage: Stripe's own dashboard for this member's account, where they change the card or bank.
  if (action === "manage") {
    if (!p?.stripe_connect_id) return Response.json({ error: "Connect Stripe first." }, { status: 400 });
    try {
      const link = await stripe().accounts.createLoginLink(p.stripe_connect_id);
      return Response.json({ url: link.url });
    } catch (e) {
      console.error("[payout/stripe] login link failed:", (e as Error).message);
      return Response.json({ error: "Couldn't open your Stripe account. If sign-up isn't finished, press Reconnect with Stripe." }, { status: 502 });
    }
  }

  // Disconnect: the site stops paying to Stripe. The Stripe account itself is left alone, so
  // reconnecting later picks the same one back up. Wallet money is untouched.
  if (action === "disconnect") {
    await db.from("profiles").update({ stripe_connect_ready: false, payout_method: null, payout_handle: null }).eq("id", me.id);
    return Response.json({ ok: true });
  }

  try {
    let id = p?.stripe_connect_id as string | undefined;
    if (id) {
      // Reconnecting an account that is already set up: no need to send them through sign-up again.
      const acct = await stripe().accounts.retrieve(id);
      if (acct.capabilities?.transfers === "active" && acct.details_submitted) {
        await db.from("profiles").update({ stripe_connect_ready: true, payout_method: "stripe", payout_handle: "Stripe account" }).eq("id", me.id);
        return Response.json({ ready: true });
      }
    }
    if (!id) {
      const acct = await stripe().accounts.create({
        type: "express", email: me.email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
        metadata: { player_id: me.id },
      });
      id = acct.id;
      await db.from("profiles").update({ stripe_connect_id: id }).eq("id", me.id);
    }
    const link = await stripe().accountLinks.create({
      account: id, type: "account_onboarding",
      refresh_url: `${env.siteUrl}/wallet?stripe=retry#payout`,
      return_url: `${env.siteUrl}/wallet?stripe=done#payout`,
    });
    return Response.json({ url: link.url });
  } catch (e) {
    // Stripe's own wording is the only thing that says which setting is
    // missing, and the member must never see it. It goes to the runtime log,
    // where staff can read it; they get a sentence they can act on.
    const m = (e as Error).message ?? "";
    console.error("[payout/stripe] connect failed:", m);
    const platformOff = /Connect|client_id|platform/i.test(m);
    return Response.json({
      error: platformOff
        ? "Stripe payouts aren't switched on for this site yet."
        : "Stripe couldn't start the sign-up. Try again.",
    }, { status: 502 });
  }
}
