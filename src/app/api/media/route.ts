import { NextRequest } from "next/server";
import { isBlob, signedGet } from "@/lib/blob";
import { admin, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A one-hour playback link for a clip stored in Vercel Blob. Same rules as the old storage
 *  policies: approved and featured clips play for anyone; the owner and admins can also play
 *  clips still waiting for review. Downloads go through /api/download (paid), not here. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("clip");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Missing clip." }, { status: 400 });
  const db = admin();
  const { data: c } = await db.from("clips").select("owner_id, status, storage_path, watermark_path").eq("id", id).maybeSingle();
  const path = c ? (c.watermark_path ?? c.storage_path) : null;
  if (!c || !isBlob(path)) return Response.json({ error: "Not found." }, { status: 404 });

  if (!["approved", "featured"].includes(c.status)) {
    const me = await userFromRequest(req);
    let ok = Boolean(me && me.id === c.owner_id);
    if (me && !ok) {
      const { data: p } = await db.from("profiles").select("is_admin").eq("id", me.id).maybeSingle();
      ok = Boolean(p?.is_admin);
    }
    if (!ok) return Response.json({ error: "Not found." }, { status: 404 });
  }
  return Response.json({ url: await signedGet(path, { seconds: 3600 }) }, { headers: { "cache-control": "private, max-age=600" } });
}
