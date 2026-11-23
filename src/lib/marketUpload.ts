"use client";
import { uploadPresigned } from "@vercel/blob/client";
import { sb } from "@/lib/supabase";

/** Upload a video straight from the browser into the private Vercel Blob store ("lfl-videos").
 *  `pathname` must sit in the user's own folder: clips/<uid>/… for contest clips (< 600 MB) or
 *  market/<uid>/… for Clip Market files (up to 5 GB); /api/blob/upload checks both and signs the
 *  upload. Big files go up in parallel parts and a failed part is retried on its own.
 *  Resolves with the value to store in the database: "blob:<pathname>". */
export function uploadVideo(file: File, pathname: string, onProgress: (sent: number, total: number) => void) {
  const ctl = new AbortController();
  const done = (async () => {
    const token = (await sb()?.auth.getSession())?.data.session?.access_token;
    if (!token) throw new Error("Sign in again, then retry the upload.");
    await uploadPresigned(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/blob/upload",
      headers: { authorization: `Bearer ${token}` },
      multipart: file.size > 50 * 1024 * 1024,
      contentType: file.type || undefined,
      abortSignal: ctl.signal,
      onUploadProgress: (e) => onProgress(e.loaded, e.total || file.size),
    });
    return `blob:${pathname}`;
  })();
  return { done, cancel: () => ctl.abort() };
}

/** Grab the frame at `time` (seconds) from a video element as a JPEG. */
export function grabFrame(v: HTMLVideoElement): Promise<Blob | null> {
  const w = Math.min(1600, v.videoWidth || 1280), h = Math.round((w / (v.videoWidth || 16)) * (v.videoHeight || 9));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(v, 0, 0, w, h);
  return new Promise((r) => c.toBlob((b) => r(b), "image/jpeg", 0.86));
}

export function seek(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((r) => { const on = () => { v.removeEventListener("seeked", on); r(); }; v.addEventListener("seeked", on); v.currentTime = Math.max(0, Math.min(t, (v.duration || 1) - 0.05)); });
}
