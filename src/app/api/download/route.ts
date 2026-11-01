import { NextRequest } from "next/server";
import { admin, configured, env, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A paid download, once the member's monthly credits are gone.
 *  $0.99: $0.70 to the creator, $0.29 to the platform. The row is written by the
 *  webhook, so the creator is only credited after the money actually lands. */
export async function POST(req: NextRequest) {
  if (!configured) return notConfigured();

  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });

  const { clipId } = (await req.json()) as { clipId: string };
  const db = admin();

  const { data: clip } = await db.from("clips")
    .select("id, title, owner_id, status").eq("id", clipId).single();
  if (!clip || !["approved", "featured"].includes(clip.status)) {
    return Response.json({ error: "That clip is not available." }, { status: 404 });
  }

  const { data: price } = await db.from("download_prices")
    .select("price_cents, creator_cents").eq("id", true).single();
  const amount = price?.price_cents ?? 99;
  const toCreator = price?.creator_cents ?? 70;

  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", me.id).single();

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : me.email,
    client_reference_id: me.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: amount,
        product_data: {
          name: `Download: ${clip.title}`,
          description: `$${(toCreator / 100).toFixed(2)} of this goes to the player who made the clip.`,
        },
      },
    }],
    metadata: { kind: "download", clip_id: clipId, player_id: me.id },
    payment_intent_data: { metadata: { kind: "download", clip_id: clipId, player_id: me.id } },
    success_url: `${env.siteUrl}/clips?downloaded=${clipId}`,
    cancel_url: `${env.siteUrl}/clips`,
  });

  return Response.json({ url: session.url });
}
