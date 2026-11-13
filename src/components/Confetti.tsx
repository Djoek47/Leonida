"use client";
import { useMemo } from "react";

const COLORS = ["#f0c24b", "#ff3d8b", "#00d2c8", "#ffffff", "#c8102e", "#8a2be2"];

/** Pure CSS confetti. Deterministic per mount, hidden for reduced motion. */
export function Confetti({ count = 50 }: { count?: number }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n: number) => { const x = Math.sin(i * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
    return { left: r(1) * 100, delay: r(2) * 2.4, dur: 3.2 + r(3) * 2.6, size: 6 + r(4) * 8, rot: r(5) * 360, c: COLORS[i % COLORS.length], drift: (r(6) - 0.5) * 160 };
  }), [count]);
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, width: b.size, height: b.size * 0.45, background: b.c, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, ["--dx" as string]: `${b.drift}px`, ["--rot" as string]: `${b.rot}deg` }} />
      ))}
    </div>
  );
}
