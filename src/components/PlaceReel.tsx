"use client";
import { useEffect, useRef, useState } from "react";

/** A place, playing.
 *
 *  Every shot of the place crossfades in turn with a slow drift across it, so
 *  the city is never quite still. It only runs while the reel is actually on
 *  screen — a page with six of these looping off-screen is just heat — and it
 *  stops dead for anyone who has asked for less motion.
 *
 *  Clicking steps to the next shot, so it can be driven by hand as well. */
export function PlaceReel({ slug, name, shots }: { slug: string; name: string; shots: number }) {
  const n = Math.min(shots, 6);
  const [at, setAt] = useState(0);
  const [live, setLive] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Only animate what somebody can see.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAt((i) => (i + 1) % n), 4200);
    return () => clearInterval(id);
  }, [live, n]);

  return (
    <div ref={box} className="place-reel">
      <button type="button" className="place-stage" onClick={() => setAt((i) => (i + 1) % n)}
        aria-label={`${name} — next picture`}>
        {Array.from({ length: n }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={`/media/places/${slug}_${i + 1}.webp`}
            alt={i === 0 ? `${name}, official screenshot` : ""}
            loading={i === 0 ? "eager" : "lazy"} decoding="async"
            className={i === at ? "is-on" : ""} aria-hidden={i !== at} />
        ))}
        <span className="place-dots" aria-hidden>
          {Array.from({ length: n }, (_, i) => <i key={i} className={i === at ? "on" : ""} />)}
        </span>
      </button>
      {n > 1 && (
        <div className="place-thumbs">
          {Array.from({ length: Math.min(n, 4) }, (_, i) => (i + at + 1) % n).slice(0, Math.min(3, n - 1)).map((i) => (
            <button key={i} type="button" onClick={() => setAt(i)} aria-label={`${name}, picture ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/places/${slug}_${i + 1}.webp`} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
