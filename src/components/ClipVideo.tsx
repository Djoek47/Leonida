"use client";
import { useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import type { Clip } from "@/lib/api";

/** Plays an uploaded clip in place.
 *
 *  The clips bucket is private — an approved clip is readable, but only
 *  through a signed URL, so the file can't be hot-linked or scraped in bulk.
 *  We mint one on the first play and keep it for the hour it lasts.
 *
 *  A clip that came in as a link rather than a file just opens the link. */
export function ClipVideo({ clip, poster }: { clip: Clip; poster?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const frame = useRef<HTMLDivElement>(null);

  const path = clip.watermark_path ?? clip.storage_path;

  async function play() {
    if (url) return;
    const c = sb();
    if (!c || !path) { setErr("This clip has no file to play."); return; }
    setBusy(true); setErr("");
    const { data, error } = await c.storage.from("clips").createSignedUrl(path, 3600);
    setBusy(false);
    if (error || !data) setErr("That clip wouldn't load. Try again in a moment.");
    else setUrl(data.signedUrl);
  }

  // Our fullscreen, not the browser's: the whole frame goes fullscreen, so the
  // watermark stays on top of the picture instead of being left behind.
  function full() {
    const el = frame.current; if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.();
  }

  if (url) {
    return (
      <div ref={frame} className="clip-frame absolute inset-0 bg-black">
        <video src={url} poster={poster} controls autoPlay playsInline
          controlsList="nofullscreen nodownload noremoteplayback" disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="h-full w-full object-contain" />
        <div className="clip-mark" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/live-from-leonida-avatar-180.png" alt="" />
          <span><b>@{clip.gamertag}</b><i>livefromleonida.com</i></span>
        </div>
        <button type="button" onClick={full} className="clip-full" aria-label="Fullscreen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
        </button>
      </div>
    );
  }

  if (!path) return null;

  return (
    <>
      <button onClick={play} disabled={busy}
        className="absolute inset-0 grid place-items-center group"
        aria-label={`Play ${clip.title}`}>
        <span className="grid size-14 place-items-center rounded-full bg-black/60 text-white
                         transition group-hover:bg-flamingo group-hover:scale-105">
          {busy ? (
            <span className="block size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-7 translate-x-0.5" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
      </button>
      {err && <p role="alert" className="absolute inset-x-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs text-white">{err}</p>}
    </>
  );
}
