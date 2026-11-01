"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Official Rockstar footage. The cover-art trailer plays first, then each character
// clip, then back to the start. Every clip plays through exactly once — the character
// clips only run about a second, so holding them longer replayed them several times.
const REEL = [
  { src: "/media/video/gtavi_official_cover_art_landscape.mp4", label: "Grand Theft Auto VI" },
  { src: "/media/video/jason_duval_video_clip.mp4", label: "Jason Duval" },
  { src: "/media/video/lucia_caminos_video_clip.mp4", label: "Lucia Caminos" },
  { src: "/media/video/cal_hampton_video_clip.mp4", label: "Cal Hampton" },
  { src: "/media/video/boobie_ike_video_clip.mp4", label: "Boobie Ike" },
  { src: "/media/video/drequan_priest_video_clip.mp4", label: "DreQuan Priest" },
  { src: "/media/video/real_dimez_video_clip.mp4", label: "Real Dimez" },
  { src: "/media/video/raul_bautista_video_clip.mp4", label: "Raul Bautista" },
  { src: "/media/video/brian_heder_video_clip.mp4", label: "Brian Heder" },
];
// Only a safety net: if "ended" never arrives — a stalled network, a codec the browser
// gives up on — move the reel on rather than freezing on one frame.
const STALL_GRACE = 2000;
const STALL_MAX = 40000;

export function HeroReel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);

  const slot = i % 2;                       // two stacked players, cross-faded
  const next = useCallback(() => setI((n) => (n + 1) % REEL.length), []);

  // The index this slot was last rewound for, so unpausing resumes rather than restarts.
  const lastIndex = useRef(-1);

  // Each slot's source comes straight from the index — React owns it, nothing is
  // assigned to .src by hand. The hidden slot holds the next clip, so it is already
  // buffered when it becomes the visible one and never reloads mid-play.
  const srcFor = (k: number) => (k === slot ? REEL[i].src : REEL[(i + 1) % REEL.length].src);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  useEffect(() => {
    const v = (slot === 0 ? a : b).current;
    const other = (slot === 0 ? b : a).current;

    // The outgoing player keeps running otherwise, so two clips play at once and the
    // one underneath is still going when the reel comes back round to it.
    if (other && !other.paused) other.pause();
    if (!v) return;

    const fresh = lastIndex.current !== i;
    lastIndex.current = i;
    if (fresh) v.currentTime = 0;

    if (paused) { v.pause(); return; }
    if (v.paused) void v.play().catch(() => {});

    // Every clip runs to its own end, once, and then the reel moves on.
    v.addEventListener("ended", next, { once: true });
    const remaining = Number.isFinite(v.duration) ? (v.duration - v.currentTime) * 1000 : null;
    const watchdog = setTimeout(next, Math.min(STALL_MAX, (remaining ?? 8000) + STALL_GRACE));
    return () => { v.removeEventListener("ended", next); clearTimeout(watchdog); };
  }, [i, slot, paused, next]);

  return (
    <div className="relative bg-asphalt">
      <div className="relative w-full aspect-video max-h-[72vh] overflow-hidden">
        {[0, 1].map((k) => (
          <video
            key={k}
            ref={k === 0 ? a : b}
            muted
            playsInline
            aria-hidden
            preload="auto"
            // Nothing loops: a clip that repeats is the reel stuttering, not a feature.
            loop={false}
            src={srcFor(k)}
            poster={k === 0 ? "/media/art/official_cover_art_landscape.webp" : undefined}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${k === slot ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <div className="absolute right-3 top-3 md:right-6 md:top-6 flex items-center gap-2">
        <span className="hidden sm:inline-block rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold text-white">{REEL[i].label}</span>
        <button onClick={() => setPaused((p) => !p)} className="size-9 rounded-full bg-black/60 text-white grid place-items-center"
          aria-label={paused ? "Play videos" : "Pause videos"}>
          {paused
            ? <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            : <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>}
        </button>
      </div>
      <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden>
        {REEL.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />)}
      </div>
    </div>
  );
}
