"use client";
import { useCallback, useEffect, useState, type RefObject } from "react";

/** Fullscreen for a clip *frame* (video + watermark), never the bare <video>.
 *
 *  - Uses the Fullscreen API on the frame when the browser supports it, so the
 *    watermark overlay goes fullscreen with the picture.
 *  - If something fullscreens the <video> element itself (double-click, a
 *    browser control), we bounce out and fullscreen the frame instead.
 *  - Where element fullscreen isn't available (iPhone Safari), we fall back to a
 *    CSS "fill the screen" mode on the frame, which also keeps the watermark.
 *
 *  Note: this keeps the watermark on screen so it shows up in screen
 *  recordings. It cannot stop a determined person editing the page; only a
 *  watermark burned into the file (clips.watermark_path) does that. */
export function useFrameFullscreen(frame: RefObject<HTMLElement | null>) {
  const [pseudo, setPseudo] = useState(false);

  const toggle = useCallback(() => {
    const el = frame.current; if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (pseudo) { setPseudo(false); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => setPseudo(true));
    else setPseudo(true);
  }, [frame, pseudo]);

  useEffect(() => {
    function onChange() {
      const fs = document.fullscreenElement;
      const el = frame.current;
      if (fs && el && fs.tagName === "VIDEO" && el.contains(fs)) {
        document.exitFullscreen().then(() => el.requestFullscreen?.()).catch(() => setPseudo(true));
      }
    }
    // iPhone Safari: native video fullscreen drops overlays — leave it and use pseudo mode.
    function onWebkitBegin(e: Event) {
      const v = e.target as HTMLVideoElement & { webkitExitFullscreen?: () => void };
      if (frame.current?.contains(v)) { v.webkitExitFullscreen?.(); setPseudo(true); }
    }
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitbeginfullscreen", onWebkitBegin, true);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitbeginfullscreen", onWebkitBegin, true);
    };
  }, [frame]);

  useEffect(() => {
    if (!pseudo) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setPseudo(false); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [pseudo]);

  /** Stops a double-click on the video from triggering the browser's own fullscreen. */
  const onVideoDoubleClick = useCallback((e: React.MouseEvent) => { e.preventDefault(); toggle(); }, [toggle]);

  return { toggle, pseudo, frameClass: pseudo ? " is-pseudo-full" : "", onVideoDoubleClick };
}

/** Attributes every clip <video> should carry so the browser offers no fullscreen of its own. */
export const lockedVideoProps = {
  controlsList: "nofullscreen nodownload noremoteplayback",
  disablePictureInPicture: true,
  playsInline: true,
} as const;
