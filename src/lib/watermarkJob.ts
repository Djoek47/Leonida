import "server-only";
import { createReadStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { put } from "@vercel/blob";
import { admin } from "@/lib/server";
import { BLOB_PREFIX, blobPath, isBlob, signedGet } from "@/lib/blob";
import { burn } from "@/lib/watermark";

/** Makes the watermarked copy of one clip and points clips.watermark_path at it.
 *  Playback (/api/media) already prefers watermark_path, so once this runs nobody streams the
 *  clean original again. The original stays untouched in storage. */
export async function watermarkClip(id: string): Promise<{ ok: true; path: string; seconds: number } | { ok: false; error: string }> {
  const db = admin();
  const { data: c } = await db.from("clips").select("id, owner_id, gamertag, title, status, storage_path, watermark_path").eq("id", id).maybeSingle();
  if (!c) return { ok: false, error: "Clip not found." };
  if (!c.storage_path) return { ok: false, error: "This clip has no uploaded file (link-only clip)." };

  let source: string;
  if (isBlob(c.storage_path)) source = await signedGet(c.storage_path, { seconds: 3600 });
  else {
    const { data, error } = await db.storage.from("clips").createSignedUrl(c.storage_path, 3600);
    if (error || !data) return { ok: false, error: "Couldn't open the original file." };
    source = data.signedUrl;
  }

  const base = path.basename(isBlob(c.storage_path) ? blobPath(c.storage_path) : c.storage_path).replace(/\.[a-z0-9]+$/i, "");
  const out = path.join(tmpdir(), `wm-${c.id}.mp4`);
  const t0 = Date.now();
  try {
    await burn(source, out, c.gamertag ?? "");
    const size = (await stat(out)).size;
    const pathname = `clips/${c.owner_id}/wm/${base}-wm.mp4`;
    await put(pathname, createReadStream(out), {
      access: "private", contentType: "video/mp4", addRandomSuffix: false, allowOverwrite: true,
      multipart: size > 20 * 1024 * 1024,
    });
    const stored = BLOB_PREFIX + pathname;
    const { error } = await db.from("clips").update({ watermark_path: stored }).eq("id", c.id);
    if (error) return { ok: false, error: `Saved the file but couldn't update the clip: ${error.message}` };
    return { ok: true, path: stored, seconds: Math.round((Date.now() - t0) / 1000) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 400) : "Watermarking failed." };
  } finally {
    await rm(out, { force: true });
  }
}

/** Live clips that still stream the clean original, oldest first. */
export async function clipsMissingWatermark(limit = 20): Promise<string[]> {
  const { data } = await admin().from("clips").select("id")
    .in("status", ["approved", "featured"]).is("watermark_path", null).not("storage_path", "is", null)
    .order("created_at", { ascending: true }).limit(limit);
  return (data ?? []).map((r) => r.id as string);
}

/** Works through the backlog until the time budget runs out (one function run). */
export async function watermarkBacklog(budgetMs: number) {
  const start = Date.now();
  const done: string[] = [], failed: { id: string; error: string }[] = [];
  const queue = await clipsMissingWatermark(25);
  for (const id of queue) {
    // Don't start a clip we likely can't finish; the next run picks it up.
    if (Date.now() - start > budgetMs * 0.45) break;
    const r = await watermarkClip(id);
    if (r.ok) done.push(id); else failed.push({ id, error: r.error });
  }
  return { done, failed, remaining: Math.max(0, queue.length - done.length - failed.length) };
}
