"use client";
import * as tus from "tus-js-client";
import { sb } from "@/lib/supabase";

/** Resumable upload to the private market-files bucket (Supabase's TUS endpoint), so a 5 GB
 *  file survives a dropped connection. The session token is re-read on every chunk, so a long
 *  upload doesn't fail when the token refreshes. */
export function uploadVideo(file: File, objectName: string, onProgress: (sent: number, total: number) => void) {
  let up: tus.Upload | null = null;
  const done = new Promise<void>((resolve, reject) => {
    up = new tus.Upload(file, {
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 2000, 5000, 10000, 20000, 30000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: { "x-upsert": "true" },
      metadata: { bucketName: "market-files", objectName, contentType: file.type || "video/mp4", cacheControl: "3600" },
      onBeforeRequest: async (req) => {
        const t = (await sb()?.auth.getSession())?.data.session?.access_token;
        if (t) req.setHeader("authorization", `Bearer ${t}`);
        req.setHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
      },
      onProgress,
      onError: (e) => reject(e),
      onSuccess: () => resolve(),
    });
    up.findPreviousUploads().then((prev) => { if (prev.length) up!.resumeFromPreviousUpload(prev[0]); up!.start(); });
  });
  return { done, pause: () => up?.abort(), resume: () => up?.start() };
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
