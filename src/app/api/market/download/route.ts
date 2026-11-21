import { NextRequest } from "next/server";
import { admin, configured, mockReady, notConfigured, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A one-hour download link for a Clip Market video: for its buyers, its seller and admins.
 *  Nobody else ever gets a URL to the file. */
export async function POST(req: NextRequest) {
  if (!configured && !mockReady) return notConfigured();
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { listingId } = (await req.json().catch(() => ({}))) as { listingId?: string };
  const db = admin();
  const { data: l } = await db.from("market_listings").select("id, title, seller_id, storage_path").eq("id", listingId ?? "").single();
  if (!l?.storage_path) return Response.json({ error: "No file for that clip." }, { status: 404 });

  let allowed = l.seller_id === me.id;
  if (!allowed) {
    const { data: p } = await db.from("market_purchases").select("id").eq("listing_id", l.id).eq("buyer_id", me.id).maybeSingle();
    allowed = Boolean(p);
  }
  if (!allowed) {
    const { data: prof } = await db.from("profiles").select("is_admin").eq("id", me.id).single();
    allowed = Boolean(prof?.is_admin);
  }
  if (!allowed) return Response.json({ error: "Buy the clip to download it." }, { status: 403 });

  const ext = l.storage_path.split(".").pop() || "mp4";
  const name = `${l.title.replace(/[^\w -]+/g, "").trim().slice(0, 60) || "clip"}.${ext}`;
  const { data, error } = await db.storage.from("market-files").createSignedUrl(l.storage_path, 3600, { download: name });
  if (error || !data) return Response.json({ error: "Couldn't make a download link. Try again." }, { status: 500 });
  return Response.json({ url: data.signedUrl });
}
