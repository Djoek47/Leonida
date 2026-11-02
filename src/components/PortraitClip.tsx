"use client";
import { useEffect, useRef, useState } from "react";

/** Second into each clip where the character's face reads best. The poster is that
 *  frame, and the clip settles back on it after playing. */
export const FACE_AT: Record<string, number> = {
  jason_duval: 0.6, lucia_caminos: 1.2, cal_hampton: 0.2, boobie_ike: 0.96,
  drequan_priest: 0.8, real_dimez: 0.6, raul_bautista: 1.2, brian_heder: 0.8,
};

/** Where to centre the square crop so the face stays in frame. */
const FACE_POS: Record<string, string> = { jason_duval: "85% 40%", cal_hampton: "70% 40%" };

/** A character still that plays its clip once — the first time it scrolls into view,
 *  and again whenever someone taps, clicks or hovers it. Never loops. */
export function PortraitClip({ clip, name }: { clip: string; name: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const slug = clip.replace(/_video_clip$/, "");
  const face = FACE_AT[slug] ?? 0;

  const play = () => {
    const el = v.current; if (!el || playing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.currentTime = 0;
    setPlaying(true);
    void el.play().catch(() => setPlaying(false));
  };

  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { play(); io.disconnect(); }   // once on arrival
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button type="button" onClick={play} onMouseEnter={play} aria-label={`Play ${name}'s clip`}
      className="group relative block h-full w-full">
      <video ref={v} src={`/media/video/${clip}.mp4`} poster={`/media/video/${clip}-face.jpg`}
        muted playsInline preload="metadata" aria-hidden
        onEnded={(e) => { const el = e.currentTarget; el.pause(); el.currentTime = face; setPlaying(false); }}
        style={{ objectPosition: FACE_POS[slug] ?? "50% 40%" }}
        className="h-full w-full object-cover" />
      {!playing && (
        <span aria-hidden className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-black/55 text-white opacity-80 transition group-hover:opacity-100">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
      )}
    </button>
  );
}
