import { NextRequest } from "next/server";
import { admin, configured, env, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cash out of the wallet.
 *
 *  Stripe members are paid on the spot: the wallet is debited, a transfer goes
 *  to their Stripe account, and Stripe pays it to their card or bank. If the
 *  transfer fails the cash-out is queued for staff to pay by hand. Everyone else is queued for staff to
 *  send by PayPal, Venmo, Cash App, Interac. */
export async function POST(req: NextRequest) {
  if (!env.serviceKey) return Response.json({ error: "Not available yet." }, { status: 503 });
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { cents } = (await req.json()) as { cents: number };
  if (!Number.isInteger(cents) || cents < 500) return Response.json({ error: "The smallest cash-out is $5." }, { status: 400 });

  const db = admin();
  const { data: p } = await db.from("profiles").select("payout_method, payout_handle, stripe_connect_id, stripe_connect_ready").eq("id", me.id).single();
  if (!p?.payout_method) return Response.json({ error: "Add where to send your money first." }, { status: 400 });

  const viaStripe = p.payout_method === "stripe" && p.stripe_connect_ready && p.stripe_connect_id && configured;
  const { data: entry, error } = await db.rpc("withdraw_for", {
    p_user: me.id, p_cents: cents, p_note: viaStripe ? "Stripe transfer" : `to ${p.payout_method}`,
  });
  if (error) {
    const m = error.message.includes("BELOW_MINIMUM") ? "The smallest cash-out is $5." : error.message.includes("INSUFFICIENT_FUNDS") ? "That's more than you can cash out right now. Download earnings from this month unlock on the 1st, after the month ends." : "Couldn't start that. Try again.";
    return Response.json({ error: m }, { status: 400 });
  }
  if (!viaStripe) return Response.json({ ok: true, queued: true });

  try {
    const t = await stripe().transfers.create(
      { amount: cents, currency: "usd", destination: p.stripe_connect_id!, metadata: { player_id: me.id, wallet_entry: String(entry) } },
      { idempotencyKey: `withdraw-${entry}` },
    );
    await db.from("wallet_entries").update({ ref: t.id }).eq("id", entry);
    await db.rpc("enqueue_email", { p_user: me.id, p_kind: "payout_sent",
      p_data: { amount: cents, method: "Stripe", handle: "your card or bank", reference: t.id }, p_dedupe: `transfer:${t.id}` });
    return Response.json({ ok: true, sent: true });
  } catch (e) {
    // Stripe couldn't send it. Don't bounce the member: keep the debit and queue the
    // cash-out for staff to pay by hand (PayPal, Venmo, Cash App, Interac).
    console.error("transfer failed, queued for staff", e);
    const handle = p.payout_handle || `Stripe account ${p.stripe_connect_id}`;
    await db.from("wallet_entries").update({ note: "Stripe transfer failed, queued for staff" }).eq("id", entry);
    await db.from("payouts").insert({ creator_id: me.id, period_start: new Date().toISOString().slice(0, 10), period_end: new Date().toISOString().slice(0, 10),
      amount_cents: cents, download_count: 0, method: "stripe", handle, status: "requested",
      note: `wallet cash-out #${entry}: Stripe transfer failed, pay by hand` });
    await db.rpc("enqueue_email", { p_user: me.id, p_kind: "withdrawal_requested",
      p_data: { amount: cents, method: "Stripe", handle: "your account" }, p_dedupe: `cashout:${entry}` });
    return Response.json({ ok: true, queued: true });
  }
}
