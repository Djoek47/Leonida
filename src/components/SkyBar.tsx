"use client";
import { useEffect } from "react";

/** The top bar follows the Leonida sky. Through the day it runs white and gold,
 *  softens to champagne mid-afternoon, burns rose-and-gold towards 5pm, then
 *  hands over to the purple of night mode at 6pm (see ThemeToggle.NIGHT_START).
 *  The stops past 18h only show if a reader forces day mode after dark. */
type Stop = { h: number; a: string; b: string; c: string };

const SKY: Stop[] = [
  { h: 0,    a: "#1a0b30", b: "#2a1246", c: "#4a2b6b" }, // deep night
  { h: 5,    a: "#3a2248", b: "#8a5570", c: "#d4845e" }, // first light
  { h: 6.75, a: "#ffe3c4", b: "#ffc988", c: "#f6b55c" }, // sunrise
  { h: 9,    a: "#ffffff", b: "#fff6df", c: "#f0c469" }, // morning: white and gold
  { h: 13,   a: "#ffffff", b: "#fffaec", c: "#e9c877" }, // midday
  { h: 15,   a: "#fdf0d6", b: "#f3dcae", c: "#dfb75e" }, // champagne
  { h: 16.5, a: "#fbdcb4", b: "#f0ae78", c: "#d98f3a" }, // golden hour
  { h: 17.4, a: "#f0a9a2", b: "#d86a7e", c: "#c98a3c" }, // rose with gold
  { h: 18,   a: "#8a5578", b: "#553066", c: "#96663f" }, // dusk — night mode takes over here
  { h: 20,   a: "#2a1246", b: "#1a0b30", c: "#4a2b6b" }, // night
  { h: 24,   a: "#1a0b30", b: "#2a1246", c: "#4a2b6b" },
];

const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const lum = (c: string) => {
  const f = (v: number) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const [r, g, b] = hex(c).map(f);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mix = (x: string, y: string, t: number) =>
  "#" + hex(x).map((v, i) => Math.round(v + (hex(y)[i] - v) * t).toString(16).padStart(2, "0")).join("");

const DARK = "#140d03", LIGHT = "#fff3e9";
const blend = (c: string, over: number[], t: number) =>
  "#" + hex(c).map((v, i) => Math.round(v * (1 - t) + over[i] * t).toString(16).padStart(2, "0")).join("");

const contrast = (x: string, y: string) => {
  const [hi, lo] = [lum(x), lum(y)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};

export function skyAt(hour: number) {
  let i = 0;
  while (i < SKY.length - 2 && hour >= SKY[i + 1].h) i++;
  const from = SKY[i], to = SKY[i + 1];
  const t = Math.min(1, Math.max(0, (hour - from.h) / (to.h - from.h)));
  const a = mix(from.a, to.a, t), b = mix(from.b, to.b, t), c = mix(from.c, to.c, t);
  // Ink flips, never fades: a half-faded ink lands on the same tone as a mid sky
  // and the nav vanishes. Pick the ink by its *worst* stop, not the average —
  // the bar is a gradient, so the text has to hold up across all of it.
  const worst = (ink: string) => Math.min(...[a, b, c].map((bg) => contrast(ink, bg)));
  const ink = worst(DARK) >= worst(LIGHT) ? DARK : LIGHT;

  // Twice a day the sky crosses from dark to light and no single ink clears 4.5:1
  // against the whole gradient. For those few minutes lay the thinnest veil that
  // fixes it — zero the rest of the time, so the colour is never muddied.
  const veil = ink === DARK ? [255, 255, 255] : [0, 0, 0];
  let alpha = 0;
  while (alpha < 0.85) {
    const ok = [a, b, c].every((bg) => contrast(ink, blend(bg, veil, alpha)) >= 4.6);
    if (ok) break;
    alpha += 0.05;
  }
  return { a, b, c, ink, scrim: `rgba(${veil.join(",")},${alpha.toFixed(2)})` };
}

export function SkyBar() {
  useEffect(() => {
    let lastInk = "";
    const paint = () => {
      const now = new Date();
      const { a, b, c, ink, scrim } = skyAt(now.getHours() + now.getMinutes() / 60);
      const el = document.documentElement;
      const r = el.style;
      // The ink flips in one step while the sky eases over eight seconds. If we
      // let them run apart, there's a window where pale ink sits on a sky that
      // hasn't darkened yet and the nav disappears. So on a flip the sky jumps
      // with it: the two are never out of step, whatever the hour or theme.
      const flipped = lastInk !== "" && ink !== lastInk;
      if (flipped) { el.classList.remove("sky-ready"); void el.offsetHeight; }
      r.setProperty("--sky-a", a); r.setProperty("--sky-b", b);
      r.setProperty("--sky-c", c); r.setProperty("--sky-ink", ink);
      r.setProperty("--sky-scrim", scrim);
      if (flipped) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("sky-ready")));
      lastInk = ink;
    };
    paint();
    // The first values must land before easing is switched on, or the bar
    // animates up from the stylesheet's daylight default while the ink is
    // already set for night. Two frames guarantees they're committed.
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("sky-ready")));
    const id = setInterval(paint, 60_000);          // keep up with the clock
    const wake = () => !document.hidden && paint();  // and catch up after a sleep
    document.addEventListener("visibilitychange", wake);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", wake); };
  }, []);
  return null;
}
