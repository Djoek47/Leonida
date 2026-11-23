import { NextRequest } from "next/server";
import { isBlob, signedGet } from "@/lib/blob";
import { admin, userFromRequest } from "@/lib/server";
import { sendEmail } from "@/lib/email/send";
import { marketSellerEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function staff(req: NextRequest) {
  const me = await userFromRequest(req);
  if (!me) return null;
  const { data } = await admin().from("profiles").select("is_admin").eq("id", me.id).single();
  return data?.is_admin ? me : null;
}

/** Admin: listings waiting for review (or any status), each with a one-hour link to watch the video. */
export async function GET(req: NextRequest) {
  if (!(await staff(req))) return Response.json({ error: "Admins only." }, { status: 403 });
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const db = admin();
  const { data } = await db.from("market_listings").select("*").eq("status", status).order("updated_at", { ascending: true }).limit(50);
  const rows = await Promise.all((data ?? []).map(async (l) => {
    const { data: p } = await db.from("profiles").select("gamertag, display_name").eq("id", l.seller_id).single();
    let video: string | null = null;
    if (isBlob(l.storage_path)) video = await signedGet(l.storage_path, { seconds: 3600 });
    else if (l.storage_path) video = (await db.storage.from("market-files").createSignedUrl(l.storage_path, 3600)).data?.signedUrl ?? null;
    return { ...l, storage_path: undefined, seller: p?.gamertag || p?.display_name || "Player", video };
  }));
  return Response.json({ rows });
}

/** Admin: approve, reject (with a note the seller sees) or remove a listing. */
export async function POST(req: NextRequest) {
  if (!(await staff(req))) return Response.json({ error: "Admins only." }, { status: 403 });
  const { id, action, note } = (await req.json().catch(() => ({}))) as { id?: string; action?: string; note?: string };
  const status = action === "approve" ? "live" : action === "reject" ? "rejected" : action === "remove" ? "removed" : null;
  if (!id || !status) return Response.json({ error: "Bad request." }, { status: 400 });
  if (status === "rejected" && !note?.trim()) return Response.json({ error: "Tell the seller why." }, { status: 400 });
  const { error } = await admin().from("market_listings").update({ status, review_note: status === "live" ? null : (note ?? "").trim().slice(0, 300) || null }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (status !== "removed") {
    const db = admin();
    const { data: l } = await db.from("market_listings").select("title, seller_id").eq("id", id).single();
    const { data: u } = l ? await db.auth.admin.getUserById(l.seller_id) : { data: null };
    if (l && u?.user?.email) await sendEmail(u.user.email, marketSellerEmail(status === "live" ? "live" : "rejected", { title: l.title, id, note }), `market-${status}-${id}-${Date.now()}`, `market_${status}`).catch(() => null);
  }
  return Response.json({ ok: true });
}
