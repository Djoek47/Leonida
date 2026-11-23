"use client";
import { sb } from "@/lib/supabase";

/** Playback link for a clip file, wherever it's stored. "blob:" paths live in the private Vercel
 *  Blob store and get a one-hour link from /api/media; everything else is the old Supabase
 *  "clips" bucket and gets a Supabase signed URL, exactly as before. */
export async function playUrl(clip: { id: string; storage_path?: string | null; watermark_path?: string | null }): Promise<string | null> {
  const path = clip.watermark_path ?? clip.storage_path;
  const c = sb();
  if (!c || !path) return null;
  if (path.startsWith("blob:")) {
    const token = (await c.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/media?clip=${clip.id}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return null;
    return ((await res.json()) as { url?: string }).url ?? null;
  }
  const { data } = await c.storage.from("clips").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
