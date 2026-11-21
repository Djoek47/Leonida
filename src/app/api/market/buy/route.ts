import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { admin, configured, env, mockReady, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Buy a Clip Market listing. Already bought → { owned: true }. Otherwise a Stripe Checkout
 *  session at the seller's price; the webhook records the sale and pays the seller's wallet
 *  only once Stripe confirms the money. Test mode records the sale on the spot. */
export async function POST(req: NextRequest) {
  if (!configured && !mockReady) return notConfigured();
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in to buy clips." }, { status: 401 });
  const { listingId } = (await req.json().catch(() => ({}))) as { listingId?: string };
  if (!listingId) return Response.json({ error: "Which clip?" }, { status: 400 });

  const db = admin();
  const { data: l } = await db.from("market_listings").select("id, title, seller_id, price_cents, status, shots, storage_path").eq("id", listingId).single();
  if (!l || l.status !== "live" || !l.storage_path) return Response.json({ error: "That clip isn't for sale right now." }, { status: 404 });
  if (l.seller_id === me.id) return Response.json({ error: "That's your own clip." }, { status: 400 });

  const { data: had } = await db.from("market_purchases").select("id").eq("listing_id", l.id).eq("buyer_id", me.id).maybeSingle();
  if (had) return Response.json({ owned: true });

  if (env.mock) {
    const { error } = await db.rpc("record_market_sale", { p_listing: l.id, p_buyer: me.id, p_payment_intent: `mock_${randomUUID()}` });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ owned: true });
  }

  const [{ data: prof }, { data: fee }, { data: seller }] = await Promise.all([
    db.from("profiles").select("stripe_customer_id").eq("id", me.id).single(),
    db.rpc("market_fee", { p_price: l.price_cents }),
    db.from("profiles").select("gamertag, display_name").eq("id", l.seller_id).single(),
  ]);
  const sellerName = seller?.gamertag || seller?.display_name || "the player";
  const toSeller = l.price_cents - (typeof fee === "number" ? fee : 0);
  const shot = `${env.supabaseUrl}/storage/v1/object/public/market-shots/${l.shots[0]}`;
  const meta = { kind: "market", listing_id: l.id, buyer_id: me.id };
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: prof?.stripe_customer_id ?? undefined,
    customer_email: prof?.stripe_customer_id ? undefined : me.email,
    client_reference_id: me.id,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: l.price_cents, product_data: {
      name: `Clip Market: ${l.title}`,
      description: `Full video from ${sellerName}. $${(toSeller / 100).toFixed(2)} goes to them.`,
      images: [shot],
    } } }],
    metadata: meta,
    payment_intent_data: { metadata: meta, description: `Clip Market: ${l.title}` },
    success_url: `${env.siteUrl}/market/${l.id}?bought=1`,
    cancel_url: `${env.siteUrl}/market/${l.id}`,
  });
  return Response.json({ checkout: session.url });
}
