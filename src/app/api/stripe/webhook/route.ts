import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { admin, configured, env, notConfigured, stripe } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe calls this. Everything that moves money or changes a plan happens here,
 *  never in the browser. Writes are idempotent so Stripe's retries are harmless. */
export async function POST(req: NextRequest) {
  if (!configured || !env.webhookSecret) return notConfigured();

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, env.webhookSecret);
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }

  const db = admin();

  // Seen this event already? Stop. The unique index does the work.
  const { error: dupe } = await db.from("subscription_events")
    .insert({ stripe_event_id: event.id, kind: event.type, payload: event.data.object as object });
  if (dupe?.code === "23505") return Response.json({ received: true, duplicate: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;

      if (s.metadata?.kind === "download") {
        const { clip_id, player_id } = s.metadata;
        const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
        if (clip_id && player_id && pi) {
          await db.rpc("record_paid_download", {
            p_clip: clip_id, p_downloader: player_id, p_payment_intent: pi,
          });
        }
        break;
      }

      // A subscription checkout: the subscription.* events below carry the detail.
      if (s.client_reference_id && typeof s.customer === "string") {
        await db.from("profiles")
          .update({ stripe_customer_id: s.customer })
          .eq("id", s.client_reference_id);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const playerId = sub.metadata?.player_id ?? (await playerByCustomer(sub.customer));
      if (!playerId) break;

      const gone = event.type === "customer.subscription.deleted"
        || ["canceled", "incomplete_expired", "unpaid"].includes(sub.status);

      const tier = gone ? "street" : (sub.metadata?.tier ?? "hustler");
      const status = gone ? "canceled"
        : sub.status === "trialing" ? "trialing"
        : sub.status === "past_due" ? "past_due"
        : sub.status === "active" ? "active" : "none";

      const periodEnd = currentPeriodEnd(sub);

      await db.from("profiles").update({
        tier,
        billing_period: gone ? null : (sub.metadata?.period ?? "monthly"),
        subscription_status: status,
        stripe_subscription_id: sub.id,
        current_period_end: periodEnd,
        ...(gone ? { credits_remaining: 0 } : {}),
      }).eq("id", playerId);

      // A live subscription starts each cycle with a fresh allowance.
      if (!gone && (status === "active" || status === "trialing")) {
        await db.rpc("grant_cycle_credits", { p_user: playerId, p_period_end: periodEnd });
      }

      await db.from("money_events").insert({
        kind: gone ? "subscription_ended" : "subscription_active",
        player_id: playerId,
        amount_cents: sub.items.data[0]?.price.unit_amount ?? 0,
        note: `${tier} (${sub.status})`,
      });
      break;
    }

    // A renewal paid: top the credits back up for the new cycle.
    case "invoice.payment_succeeded": {
      const inv = event.data.object as Stripe.Invoice;
      const playerId = await playerByCustomer(inv.customer);
      if (!playerId) break;
      const end = inv.lines.data[0]?.period?.end;
      if (end) {
        await db.rpc("grant_cycle_credits", {
          p_user: playerId, p_period_end: new Date(end * 1000).toISOString(),
        });
      }
      await db.from("money_events").insert({
        kind: "invoice_paid", player_id: playerId,
        amount_cents: inv.amount_paid ?? 0, note: inv.number ?? undefined,
      });
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const playerId = await playerByCustomer(inv.customer);
      if (playerId) await db.from("profiles").update({ subscription_status: "past_due" }).eq("id", playerId);
      break;
    }
  }

  return Response.json({ received: true });

  async function playerByCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
    const id = typeof customer === "string" ? customer : customer?.id;
    if (!id) return null;
    const { data } = await db.from("profiles").select("id").eq("stripe_customer_id", id).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  }
}

/** Stripe moved current_period_end onto the subscription item; read either shape. */
function currentPeriodEnd(sub: Stripe.Subscription): string {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const secs = item?.current_period_end ?? legacy;
  return new Date((secs ?? Math.floor(Date.now() / 1000) + 30 * 86400) * 1000).toISOString();
}
