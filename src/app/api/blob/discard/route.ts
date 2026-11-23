import { del } from "@vercel/blob";
import { blobPath, isBlob } from "@/lib/blob";
import { admin, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Throw away a just-uploaded clip file whose database row was refused (weekly cap, closed
 *  round…), so it doesn't sit in storage forever. Only your own folder, and only if no clip
 *  points at it. */
export async function POST(req: Request) {
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { path } = (await req.json().catch(() => ({}))) as { path?: string };
  if (!isBlob(path) || !blobPath(path).startsWith(`clips/${me.id}/`) || path.includes("..")) return Response.json({ error: "No." }, { status: 400 });
  const { data } = await admin().from("clips").select("id").eq("storage_path", path).limit(1);
  if (data?.length) return Response.json({ error: "In use." }, { status: 409 });
  await del(blobPath(path)).catch(() => {});
  return Response.json({ ok: true });
}
