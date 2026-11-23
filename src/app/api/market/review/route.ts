import { NextRequest } from "next/server";
import { isBlob, signedGet } from "@/lib/blob";
import { admin, stripe, userFromRequest } from "@/lib/server";
import { sendEmail } from "@/lib/email/send";
import { marketSellerEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff control of the Clip Market: review, status changes, edits, sales and refunds, settings. */
async function staff(req: NextRequest) {
  const me = await userFromRequest(req);
  if (!me) return null;
  const { data } = await admin().from("profiles").select("is_admin").eq("id", me.id).single();
  return data?.is_admin ? me : null;
}
const STATUSES = ["pending", "live", "paused", "rejected", "removed", "uploading"];

export async function GET(req: NextRequest) {
  if (!(await staff(req))) return Response.json({ error: "Admins only." }, { status: 403 });
  const db = admin();
  const sp = req.nextUrl.searchParams;

  if (sp.get("view") === "overview") {
    const [{ data: rows }, { data: buys }, { data: settings }] = await Promise.all([
      db.from("market_listings").select("status"),
      db.from("market_purchases").select("price_cents, fee_cents, refunded_at"),
      db.from("market_settings").select("fee_bps, min_fee_cents, min_price_cents, max_price_cents").maybeSingle(),
    ]);
    const counts: Record<string, number> = {};
    for (const r of rows ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
    const ok = (buys ?? []).filter((b) => !b.refunded_at);
    return Response.json({ counts, sales: ok.length, gross: ok.reduce((s, b) => s + b.price_cents, 0), fees: ok.reduce((s, b) => s + b.fee_cents, 0), refunds: (buys ?? []).length - ok.length, settings });
  }

  const sales = sp.get("sales");
  if (sales) {
    const { data } = await db.from("market_purchases").select("id, buyer_id, price_cents, fee_cents, seller_cents, created_at, refunded_at, refund_note, stripe_payment_intent").eq("listing_id", sales).order("created_at", { ascending: false });
    const ids = [...new Set((data ?? []).map((p) => p.buyer_id))];
    const { data: ps } = ids.length ? await db.from("profiles").select("id, gamertag, display_name").in("id", ids) : { data: [] };
    const name = Object.fromEntries((ps ?? []).map((p) => [p.id, p.gamertag || p.display_name || "Player"]));
    return Response.json({ rows: (data ?? []).map((p) => ({ ...p, buyer: name[p.buyer_id] ?? "Player", paid_by_card: Boolean(p.stripe_payment_intent), stripe_payment_intent: undefined })) });
  }

  const status = sp.get("status") ?? "pending";
  const q = (sp.get("q") ?? "").trim().replace(/[%,()]/g, "");
  let query = db.from("market_listings").select("*").order("updated_at", { ascending: false }).limit(50);
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data } = await query;
  const rows = await Promise.all((data ?? []).map(async (l) => {
    const { data: p } = await db.from("profiles").select("gamertag, display_name").eq("id", l.seller_id).single();
    let video: string | null = null;
    if (isBlob(l.storage_path)) video = await signedGet(l.storage_path, { seconds: 3600 });
    else if (l.storage_path) video = (await db.storage.from("market-files").createSignedUrl(l.storage_path, 3600)).data?.signedUrl ?? null;
    return { ...l, storage_path: undefined, seller: p?.gamertag || p?.display_name || "Player", video };
  }));
  return Response.json({ rows });
}

type Body = { id?: string; action?: string; note?: string; title?: string; description?: string; price_cents?: number; purchase?: string;
  fee_bps?: number; min_fee_cents?: number; min_price_cents?: number; max_price_cents?: number };

export async function POST(req: NextRequest) {
  const me = await staff(req);
  if (!me) return Response.json({ error: "Admins only." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Body;
  const db = admin();

  if (b.action === "settings") {
    const fee = Math.round(Number(b.fee_bps)), floor = Math.round(Number(b.min_fee_cents)), lo = Math.round(Number(b.min_price_cents)), hi = Math.round(Number(b.max_price_cents));
    if (![fee, floor, lo, hi].every(Number.isFinite) || fee < 0 || fee > 5000 || floor < 0 || floor > 500 || lo < 100 || hi < lo || hi > 100000)
      return Response.json({ error: "Commission 0–50%, floor up to $5, minimum price at least $1, maximum above the minimum." }, { status: 400 });
    const { error } = await db.from("market_settings").update({ fee_bps: fee, min_fee_cents: floor, min_price_cents: lo, max_price_cents: hi }).eq("id", true);
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
  }

  if (b.action === "refund") {
    const { data: p } = await db.from("market_purchases").select("id, refunded_at, stripe_payment_intent").eq("id", b.purchase ?? "").maybeSingle();
    if (!p) return Response.json({ error: "Purchase not found." }, { status: 404 });
    if (p.refunded_at) return Response.json({ error: "Already refunded." }, { status: 400 });
    // Card first: if Stripe refuses, nothing changes on our side.
    if (p.stripe_payment_intent && !p.stripe_payment_intent.startsWith("mock_")) {
      try { await stripe().refunds.create({ payment_intent: p.stripe_payment_intent, reason: "requested_by_customer", metadata: { purchase: p.id, by: me.id } }); }
      catch (e) { return Response.json({ error: `Stripe refused the refund: ${(e as Error).message}` }, { status: 502 }); }
    }
    const { error } = await db.rpc("refund_market_purchase", { p_purchase: p.id, p_note: b.note ?? "", p_actor: me.id });
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
  }

  if (!b.id) return Response.json({ error: "Bad request." }, { status: 400 });

  if (b.action === "edit") {
    const { data: s } = await db.from("market_settings").select("min_price_cents, max_price_cents").maybeSingle();
    const patch: Record<string, unknown> = {};
    if (typeof b.title === "string") { const t = b.title.trim(); if (t.length < 3 || t.length > 80) return Response.json({ error: "Title: 3 to 80 characters." }, { status: 400 }); patch.title = t; }
    if (typeof b.description === "string") patch.description = b.description.trim().slice(0, 2000);
    if (b.price_cents != null) {
      const c = Math.round(Number(b.price_cents));
      if (!Number.isFinite(c) || c < (s?.min_price_cents ?? 100) || c > (s?.max_price_cents ?? 2000)) return Response.json({ error: "Price is outside the allowed range." }, { status: 400 });
      patch.price_cents = c;
    }
    const { error } = await db.from("market_listings").update(patch).eq("id", b.id);
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
  }

  const status = ({ approve: "live", reject: "rejected", remove: "removed", pause: "paused", pending: "pending" } as Record<string, string>)[b.action ?? ""];
  if (!status || !STATUSES.includes(status)) return Response.json({ error: "Bad request." }, { status: 400 });
  if (status === "rejected" && !b.note?.trim()) return Response.json({ error: "Tell the seller why." }, { status: 400 });
  const { error } = await db.from("market_listings").update({ status, review_note: status === "live" ? null : (b.note ?? "").trim().slice(0, 300) || null }).eq("id", b.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (status === "live" || status === "rejected") {
    const { data: l } = await db.from("market_listings").select("title, seller_id").eq("id", b.id).single();
    const { data: u } = l ? await db.auth.admin.getUserById(l.seller_id) : { data: null };
    if (l && u?.user?.email) await sendEmail(u.user.email, marketSellerEmail(status === "live" ? "live" : "rejected", { title: l.title, id: b.id, note: b.note }), `market-${status}-${b.id}-${Date.now()}`, `market_${status}`).catch(() => null);
  }
  return Response.json({ ok: true });
}
