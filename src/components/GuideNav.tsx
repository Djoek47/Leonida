"use client";
import { useEffect, useRef, useState } from "react";

const LINKS: [string, string][] = [
  ["how-it-plays", "How it plays"], ["map", "Map"], ["places", "Places"], ["people", "People"],
  ["garage", "Cars and weapons"], ["screenshots", "Screenshots"], ["guides", "Guides"],
];

/** Section nav for the guide. It gets out of the way when you scroll down into the
 *  content and comes back the moment you scroll up, so it never sits on top of
 *  what you're reading. The current section is marked as you pass it. */
export function GuideNav() {
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState(LINKS[0][0]);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = scrollY;
    const onScroll = () => {
      const y = scrollY;
      const down = y > lastY.current;
      // a small threshold, or it flickers on trackpad jitter
      if (Math.abs(y - lastY.current) > 6) {
        setHidden(down && y > 320);
        lastY.current = y;
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
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

  return (
    <nav aria-label="Guide sections"
      className={`sticky top-[5.75rem] z-30 transition-[opacity,transform] duration-300 ${
        hidden ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-1 overflow-x-auto rounded-full border-2 border-line bg-ink/95 p-1 text-sm font-bold shadow-[0_10px_30px_-12px_rgba(0,0,0,.45)] backdrop-blur">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 transition-colors ${
                active === id ? "bg-gulf text-white" : "text-haze hover:bg-ink-2 hover:text-foam"}`}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
