"use client";
import { useEffect, useRef, useState } from "react";

// Official Rockstar footage. The cover-art trailer plays first, then the character loops,
// then back to the start. Short loops are held for HOLD ms so each one reads.
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
const HOLD = 4500;

export function HeroReel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const slot = i % 2; // two stacked videos, cross-faded
  const src = (k: number) => REEL[k % REEL.length].src;
  const next = () => setI((n) => (n + 1) % REEL.length);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  useEffect(() => {
    const v = refs[slot].current, other = refs[1 - slot].current;
    if (!v) return;
    v.currentTime = 0;
    if (!paused) v.play().catch(() => {});
    // preload the following clip in the hidden player
    if (other) { other.src = src(i + 1); other.load(); }
    if (paused) return;
    if (i === 0) { const end = () => next(); v.addEventListener("ended", end); return () => v.removeEventListener("ended", end); }
    const t = setTimeout(next, HOLD);
    return () => clearTimeout(t);
  }, [i, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    setPaused((p) => {
      const v = refs[slot].current;
      if (v) { if (p) v.play().catch(() => {}); else v.pause(); }
      return !p;
    });
  }

  return (
    <div className="relative bg-asphalt">
      <div className="relative w-full aspect-video max-h-[72vh] overflow-hidden">
        {[0, 1].map((k) => (
          <video key={k} ref={refs[k]} muted playsInline aria-hidden
            loop={!(k === slot && i === 0)}
            src={k === 0 ? src(0) : src(1)}
            poster={k === 0 ? "/media/art/official_cover_art_landscape.webp" : undefined}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${k === slot ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      <div className="absolute right-3 top-3 md:right-6 md:top-6 flex items-center gap-2">
        <span className="hidden sm:inline-block rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold text-white">{REEL[i].label}</span>
        <button onClick={toggle} className="size-9 rounded-full bg-black/60 text-white grid place-items-center" aria-label={paused ? "Play videos" : "Pause videos"}>
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
