"use client";
import { useEffect, useState } from "react";
import { LAUNCH } from "@/lib/content";

/** The Edge is behind a roadblock until the game is. Nothing to read here
 *  yet, deliberately: a closed road, a counter, and the one date that
 *  matters. The tools (Economist, Meta Brief, Performance Lab) move in the
 *  day Leonida opens.
 *
 *  Drop a file at public/media/video/edge-loop.mp4 and it becomes the
 *  backdrop; until then the painted road below stands in. Nothing else
 *  needs changing. */
const BACKDROP = "/media/video/edge-loop.mp4";
const POSTER = "/media/art/jason_lucia_motel_portrait.webp";

const BEHIND = [
  ["Leonida Economist", "What's actually making money this week, tracked live."],
  ["Weekly Meta Brief", "One page every Monday: what won, and why."],
  ["Clip Performance Lab", "Watch-through, drop-off and the download curve, clip by clip."],
] as const;

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, "0"));
}

export default function Edge() {
  const [now, setNow] = useState<number | null>(null);
  const [film, setFilm] = useState(false);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    // Only show the video if one has actually been put there.
    fetch(BACKDROP, { method: "HEAD" }).then((r) => setFilm(r.ok)).catch(() => {});
    return () => clearInterval(id);
  }, []);
  const open = now !== null && now >= new Date(LAUNCH).getTime();
  const [d, h, m, s] = parts(now === null ? 0 : new Date(LAUNCH).getTime() - now);

  return (
    <div className={`edge-road${film ? " has-film" : ""}`}>
      {film && (
        <video className="edge-film" src={BACKDROP} poster={POSTER}
          autoPlay muted loop playsInline preload="metadata" aria-hidden />
      )}
      <div className="edge-horizon" aria-hidden />
      <div className="edge-lane" aria-hidden><i /><i /><i /><i /><i /><i /></div>
      <div className="edge-beam" aria-hidden />
      <div className="edge-vig" aria-hidden />

      <main className="edge-scene">
        <p className="edge-k"><i className="edge-dot" aria-hidden />State route 6 · Leonida</p>

        <div className="edge-barrier">
          <div className="edge-sign" role="img" aria-label="Road closed until the game launches">
            <span className="edge-stripe t" aria-hidden />
            <h1>ROAD<br />CLOSED</h1>
            <p>THE EDGE OPENS WITH THE GAME</p>
            <span className="edge-stripe b" aria-hidden />
          </div>
          <span className="edge-leg l" aria-hidden /><span className="edge-leg r" aria-hidden />
          <span className="edge-lamp a" aria-hidden /><span className="edge-lamp b" aria-hidden />
        </div>

        {open ? (
          <p className="edge-open">The barriers are coming down. First briefs land once the state&apos;s been played.</p>
        ) : (
          <>
            <div className="edge-timer" role="timer" aria-label={`${+d} days ${+h} hours ${+m} minutes ${+s} seconds until launch`}>
              {([["DAYS", d], ["HRS", h], ["MIN", m], ["SEC", s]] as const).map(([k, v]) => (
                <span key={k} className="edge-cell">
                  <b suppressHydrationWarning>{now === null ? "--" : v}</b>
                  <small>{k}</small>
                </span>
              ))}
            </div>
            <p className="edge-when">
              {new Date(LAUNCH).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · PS5 and Xbox Series X|S
            </p>
          </>
        )}

        <ul className="edge-behind">
          {BEHIND.map(([name, what]) => (
            <li key={name}><b>{name}</b><span>{what}</span></li>
          ))}
        </ul>
        <p className="edge-foot">Built from real play, not rumours. That&apos;s why it waits for the game.</p>
      </main>
    </div>
  );
}
