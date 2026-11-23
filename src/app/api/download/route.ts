import { NextRequest } from "next/server";
import { isBlob, signedGet } from "@/lib/blob";
import { admin, configured, mockReady, notConfigured, userFromRequest } from "@/lib/server";
import { clipDownloadName, extOf } from "@/lib/clipName";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Getting a contest clip's file. Members spend one monthly download credit per new clip
 *  (re-downloads are free); the creator is credited and paid at month-end. No card payment here:
 *  Clip Market clips are a separate store with their own instant-pay checkout. */
export async function POST(req: NextRequest) {
  if (!configured && !mockReady) return notConfigured();

  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });

  const { clipId } = (await req.json()) as { clipId: string };
  const db = admin();

  const owned = async () => {
    const { data } = await db.from("downloads").select("id").eq("clip_id", clipId).eq("downloader_id", me.id).limit(1);
    return Boolean(data?.length);
  };

  const { data: clip } = await db.from("clips")
    .select("id, title, gamertag, owner_id, status, storage_path, watermark_path, source_url").eq("id", clipId).single();
  // A creator can withdraw a clip. It then leaves the site for everyone, except the people who already
  // downloaded it: they keep it and can fetch it again, free, from their library.
  const keptByBuyer = clip?.status === "withdrawn" && (await owned());
  if (!clip || !(["approved", "featured"].includes(clip.status) || keptByBuyer)) {
    return Response.json({ error: "That clip is not available." }, { status: 404 });
  }

  // Once its week has closed a clip is archived. It stays available, but the
  // archive is a Kingpin room — including for people who bought it when it
  // was current.
  const { data: archived } = keptByBuyer ? { data: false } : await db.rpc("clip_archived", { p_clip: clipId });
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

  if (!(await owned())) {
    // Contest clips are part of the membership: each download spends one of the member's monthly
    // credits (no card payment). The creator is credited and paid at month-end from subscriptions.
    // Clip Market clips are separate: bought one by one at /api/market/buy, seller paid instantly.
    const { error } = await db.rpc("download_with_credit_for", { p_clip: clipId, p_user: me.id });
    if (error) {
      if (error.message.includes("NOT_MEMBER")) return Response.json({ error: "Downloads come with a membership. Free accounts can stream every clip." }, { status: 403 });
      if (error.message.includes("NO_CREDITS")) {
        const { data: p } = await db.from("profiles").select("credits_reset_at").eq("id", me.id).single();
        const when = p?.credits_reset_at ? new Date(p.credits_reset_at).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "your next billing date";
        return Response.json({ error: `You've used this month's downloads. They renew on ${when}. A bigger plan gives you more.`, noCredits: true }, { status: 403 });
      }
      if (error.message.includes("NOT_AVAILABLE")) return Response.json({ error: "That clip is not available." }, { status: 404 });
      return Response.json({ error: "The download couldn't start. Try again." }, { status: 500 });
    }
  }

  // Paid for: hand over the original (the watermarked copy is for streaming).
  const path = clip.storage_path ?? clip.watermark_path;
  if (path) {
    // A real name: "GAMERTAG - Clip title - Live From Leonida.mp4", not the storage key.
    const name = clipDownloadName(clip.gamertag, clip.title, extOf(path));
    if (isBlob(path)) return Response.json({ file: await signedGet(path, { download: true }), name });
    const { data, error } = await db.storage.from("clips").createSignedUrl(path, 3600, { download: name });
    if (error || !data) return Response.json({ error: "The file could not be prepared. Try again." }, { status: 500 });
    return Response.json({ file: data.signedUrl, name });
  }
  if (clip.source_url) return Response.json({ file: clip.source_url, external: true });
  return Response.json({ error: "This clip has no file attached." }, { status: 404 });
}
