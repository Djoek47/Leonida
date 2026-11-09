"use client";
import { useEffect, useRef, useState } from "react";

const LINKS: [string, string, string][] = [
  ["map", "Map", "MAP"], ["places", "Places", "PLC"], ["how-it-plays", "How it plays", "HIP"],
  ["people", "People", "PPL"], ["garage", "Cars and weapons", "CAR"],
  ["screenshots", "Screenshots", "SHT"], ["guides", "Guides", "GDE"],
];

/** Section nav for the guide.
 *
 *  It starts as a bar above the content, and once you scroll past it docks to
 *  the left edge as a vertical rail, out of the way of what you're reading.
 *  On a phone the rail is a column of markers — there is no room for seven
 *  labels down the side of a 360px screen — and the one you're in is named. */
export function GuideNav() {
  const [docked, setDocked] = useState(false);
  const [active, setActive] = useState(LINKS[0][0]);
  const mark = useRef<HTMLDivElement>(null);

  // Dock as soon as the nav's place in the page scrolls off the top.
  useEffect(() => {
    const el = mark.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting), { rootMargin: "-88px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        let best = "", top = 0;
        for (const [id, ratio] of seen) if (ratio > top) { top = ratio; best = id; }
        if (best) setActive(best);
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    for (const [id] of LINKS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const label = LINKS.find(([id]) => id === active)?.[1] ?? "";

  return (
    <>
      <div ref={mark} aria-hidden className="h-px" />

      {/* In flow, above the content. */}
      <nav aria-label="Guide sections"
        className={`mx-auto max-w-7xl px-4 transition-opacity duration-200 ${docked ? "opacity-0" : "opacity-100"}`}>
        <div className="flex gap-1 overflow-x-auto rounded-full border-2 border-line bg-ink/95 p-1 text-sm font-bold">
          {LINKS.map(([id, text]) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 transition-colors ${
                active === id ? "bg-gulf text-white" : "text-haze hover:bg-ink-2 hover:text-foam"}`}>
              {text}
            </a>
          ))}
        </div>
      </nav>

      {/* Docked to the left edge. */}
      <nav aria-label="Guide sections"
        className={`guide-rail ${docked ? "is-docked" : ""}`}>
        <p className="rail-now" aria-live="polite">{label}</p>
        <ul>
          {LINKS.map(([id, text, abbr]) => (
            <li key={id}>
              <a href={`#${id}`} title={text} aria-current={active === id ? "true" : undefined}
                 className={active === id ? "is-on" : ""}>
                <span className="rail-dot" aria-hidden />
                <span className="rail-text">{text}</span>
                <span className="rail-abbr" aria-hidden>{abbr}</span>
                <span className="sr-only">{text}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
