import "server-only";
import { issueSignedToken, presignUrl } from "@vercel/blob";

/** Clip originals and Clip Market files live in a private Vercel Blob store (lfl-videos).
 *  The database keeps them as "blob:<pathname>" so older Supabase-stored files keep working
 *  next to them: no prefix = Supabase storage, "blob:" = Vercel Blob. */
export const BLOB_PREFIX = "blob:";
export const isBlob = (p: string | null | undefined): p is string => Boolean(p && p.startsWith(BLOB_PREFIX));
export const blobPath = (p: string) => p.slice(BLOB_PREFIX.length);

export const CLIP_MAX = 600 * 1024 * 1024 - 1;
export const MARKET_MAX = 5 * 1024 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MARKET_TYPES = [...VIDEO_TYPES, "video/x-matroska"];

/** A short-lived link straight to the file, so bytes never pass through our functions.
 *  `download` asks the browser to save it rather than play it. */
export async function signedGet(stored: string, opts: { seconds?: number; download?: boolean } = {}) {
  const pathname = blobPath(stored);
  const until = Date.now() + (opts.seconds ?? 3600) * 1000;
  const token = await issueSignedToken({ pathname, operations: ["get"], validUntil: until });
  const { presignedUrl } = await presignUrl(token, { operation: "get", pathname, access: "private", validUntil: until });
  if (!opts.download) return presignedUrl;
  const u = new URL(presignedUrl); u.searchParams.set("download", "1");
  return u.toString();
}
