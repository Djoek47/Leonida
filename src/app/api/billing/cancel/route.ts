import { NextRequest } from "next/server";
import { admin, configured, env, notConfigured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cancel (or undo a cancel). The plan runs to the end of the paid period, then
 *  Stripe ends it and the webhook drops the member to Free. */
export async function POST(req: NextRequest) {
  if (env.mock) return Response.json({ mock: true });
  if (!configured) return notConfigured();
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { resume } = (await req.json().catch(() => ({}))) as { resume?: boolean };

  const { data: p } = await admin().from("profiles").select("stripe_subscription_id").eq("id", me.id).single();
  if (!p?.stripe_subscription_id) return Response.json({ error: "No active subscription." }, { status: 400 });
  const sub = await stripe().subscriptions.update(p.stripe_subscription_id, { cancel_at_period_end: !resume });
  const item = sub.items.data[0] as { current_period_end?: number } | undefined;
  return Response.json({ ok: true, endsAt: sub.cancel_at_period_end && item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null });
}
