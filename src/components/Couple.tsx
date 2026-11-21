"use client";
import { useState } from "react";
import Link from "@/components/A";

/** Jason & Lucia: the two of them, the relationship meter, and what moves it.
 *  The slider shows what playing at each level is like (intent, not outcomes); the ending
 *  link only shows with spoilers on. Levels and actions from GTABase, Game8 and G2A guides. */
const LEVELS = [
  { name: "Running on Empty", beat: 1.6, feel: "Cold. Short answers, unanswered calls, and they drift apart between jobs.", fix: "Answer their calls, spend an afternoon together, rob a store side by side." },
  { name: "Partners in Crime", beat: 1.1, feel: "Work first. They're sharp together on a job, but they don't hang out after.", fix: "Turn a job into a night out: a drink at the bar, a dance, a drive." },
  { name: "Crazy in Love", beat: 0.8, feel: "Banter, hand-holding, plans. They look for reasons to be in the same room.", fix: "Keep it going: dates, the gym, golf, little gifts, and don't ditch each other." },
  { name: "Hot Together", beat: 0.55, feel: "The best version of them. They move as one, on a job and off it.", fix: "Stay close through the big choices. Long stretches apart slowly cool it off." },
];
const UP = ["Greet each other, hold hands, buy a drink", "Answer calls and texts", "Rob together, as a couple, from Chapter 2", "Dates, sports, dancing, the gym", "Fix up Jason's house in Chapter 1", "Small gifts, like the necklace before Lucia's release"];
const DOWN = ["Ignoring calls and texts", "Long stretches apart", "Ditching your partner mid-trip", "Playing only one of them for hours", "Choices that hurt the other on The Road"];

export function Couple() {
  const [lv, setLv] = useState(2);
  const [spoil, setSpoil] = useState(false);
  const L = LEVELS[lv];
  return (
    <div className="cp">
      <div className="cp-duo" style={{ "--beat": `${L.beat}s` } as React.CSSProperties}>
        <figure className="cp-face is-j">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/people/jason_duval_1.webp" alt="Jason Duval" />
          <figcaption><b>Jason Duval</b><span>Army, then the Keys. Wants out.</span></figcaption>
        </figure>
        <div className="cp-mid">
          <svg viewBox="0 0 200 60" className="cp-ecg" aria-hidden><path d="M0 30 H60 L72 10 L84 50 L96 30 H112 L120 22 L128 30 H200" /></svg>
          <span className="cp-heart" aria-hidden>♥</span>
          <b className="cp-level">{L.name}</b>
          <span className="cp-step">Level {lv + 1} of 4</span>
        </div>
        <figure className="cp-face is-l">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/people/lucia_caminos_1.webp" alt="Lucia Caminos" />
          <figcaption><b>Lucia Caminos</b><span>Fresh out. Never going back.</span></figcaption>
        </figure>
      </div>

      <div className="cp-meter">
        <input type="range" min={0} max={3} step={1} value={lv} onChange={(e) => setLv(Number(e.target.value))} aria-label="Relationship level" aria-valuetext={L.name} />
        <div className="cp-marks">{LEVELS.map((x, i) => <button key={x.name} className={i === lv ? "is-on" : ""} onClick={() => setLv(i)}>{x.name}</button>)}</div>
        <div className="cp-read">
          <p><span>How it feels</span>{L.feel}</p>
          <p><span>{lv === 3 ? "Keep it there" : "Move it up"}</span>{L.fix}</p>
        </div>
      </div>

      <div className="cp-cols">
        <div className="cp-col is-up"><b>♥ Raises it</b><ul>{UP.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div className="cp-col is-down"><b>💔 Drops it</b><ul>{DOWN.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div className="cp-col is-how">
          <b>⇄ Playing both</b>
          <ul>
            <li>Press down on the D-pad to switch, outside missions that lock you to one.</li>
            <li>Check the meter in the Jason &amp; Lucia menu (touchpad or View), or hold right on the D-pad.</li>
            <li>A bad patch can be fixed, and it never blocks the story jobs.</li>
          </ul>
        </div>
      </div>

      <div className="cp-end">
        <button className={`cast-switch${spoil ? " is-on" : ""}`} onClick={() => setSpoil((v) => !v)} aria-pressed={spoil}>
          <span className="cast-switch-track"><i /></span>
          <span><b>Does it change the ending?</b><small>{spoil ? "Spoiler shown" : "Tap to show (light spoiler)"}</small></span>
        </button>
        {spoil && <p className="cp-spoil">Yes, in part. The ending depends on your story choices, how close Jason and Lucia are, your Criminal Profile and your Family Savings. The exact thresholds aren&apos;t published.</p>}
      </div>

      <Link href="/edge/briefing/choices" className="cp-road">
        <span className="cp-road-heart" aria-hidden>♥</span>
        <span><b>Every romance choice, mapped</b><small>Drive Jason and Lucia&apos;s road on The Road, fork by fork, with save points.</small></span>
        <span className="cp-road-go" aria-hidden>→</span>
      </Link>
    </div>
  );
}
