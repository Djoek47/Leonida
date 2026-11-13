import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { admin, configured, env, mockReady, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Getting a clip's file.
 *
 *  Already paid for it (a credit, a card, or test mode): you get a signed,
 *  one-hour download link. Not yet: test mode records the sale on the spot;
 *  live mode opens a $0.99 Stripe checkout and the webhook records it, so the
 *  player is only credited once money has actually landed. */
export async function POST(req: NextRequest) {
  if (!configured && !mockReady) return notConfigured();

  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });

  const { clipId } = (await req.json()) as { clipId: string };
  const db = admin();

  const { data: clip } = await db.from("clips")
    .select("id, title, owner_id, status, storage_path, watermark_path, source_url").eq("id", clipId).single();
  if (!clip || !["approved", "featured"].includes(clip.status)) {
    return Response.json({ error: "That clip is not available." }, { status: 404 });
  }

  // Once its week has closed a clip is archived. It stays available, but the
  // archive is a Kingpin room — including for people who bought it when it
  // was current.
  const { data: archived } = await db.rpc("clip_archived", { p_clip: clipId });
  if (archived) {
    const { data: p } = await db.from("profiles").select("tier, subscription_status").eq("id", me.id).single();
    const kingpin = p?.tier === "kingpin" && ["active", "trialing", "past_due"].includes(p.subscription_status ?? "");
    if (!kingpin) {
      return Response.json({
        error: "That clip is in the archive. Kingpin members can download clips after their week has closed.",
        archived: true,
      }, { status: 403 });
    }
  }

  const owned = async () => {
    const { data } = await db.from("downloads").select("id").eq("clip_id", clipId).eq("downloader_id", me.id).limit(1);
    return Boolean(data?.length);
  };

  if (!(await owned())) {
    const { data: prof } = await db.from("profiles").select("tier, subscription_status, stripe_customer_id").eq("id", me.id).single();
    const paying = prof && prof.tier !== "free" && ["active", "trialing", "past_due"].includes(prof.subscription_status ?? "");
    if (!paying) return Response.json({ error: "Downloads are for members. Free accounts can stream every clip." }, { status: 403 });

    if (env.mock) {
      const { error } = await db.rpc("record_paid_download", { p_clip: clipId, p_downloader: me.id, p_payment_intent: `mock_${randomUUID()}` });
      if (error) return Response.json({ error: error.message }, { status: 500 });
    } else {
      const { data: price } = await db.from("download_prices").select("price_cents, creator_cents").eq("id", true).single();
      const amount = price?.price_cents ?? 99;
      const toCreator = price?.creator_cents ?? 99;
      const session = await stripe().checkout.sessions.create({
        mode: "payment",
        customer: prof?.stripe_customer_id ?? undefined,
        customer_email: prof?.stripe_customer_id ? undefined : me.email,
        client_reference_id: me.id,
        line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: amount, product_data: {
          name: `Download: ${clip.title}`,
          description: `$${(toCreator / 100).toFixed(2)} of this goes to the player who made the clip.`,
        } } }],
        metadata: { kind: "download", clip_id: clipId, player_id: me.id },
        payment_intent_data: { metadata: { kind: "download", clip_id: clipId, player_id: me.id } },
        success_url: `${env.siteUrl}/clips?downloaded=${clipId}`,
        cancel_url: `${env.siteUrl}/clips`,
      });
      return Response.json({ checkout: session.url });
    }
  }

  // Paid for: hand over the original (the watermarked copy is for streaming).
  const path = clip.storage_path ?? clip.watermark_path;
  if (path) {
    const name = `${clip.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "clip"}${path.match(/\.\w+$/)?.[0] ?? ".mp4"}`;
    const { data, error } = await db.storage.from("clips").createSignedUrl(path, 3600, { download: name });
    if (error || !data) return Response.json({ error: "The file could not be prepared. Try again." }, { status: 500 });
    return Response.json({ file: data.signedUrl });
  }
  if (clip.source_url) return Response.json({ file: clip.source_url, external: true });
  return Response.json({ error: "This clip has no file attached." }, { status: 404 });
}
