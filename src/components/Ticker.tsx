"use client";
import { useEffect, useState } from "react";
import { LAUNCH } from "@/lib/content";

function untilLaunch() {
  const ms = new Date(LAUNCH).getTime() - Date.now();
  if (ms <= 0) return "GTA VI is out now in Leonida";
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return `${d} days ${h} hours until GTA VI lands on PS5 and Xbox Series X|S`;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** The launch clock: a fixed segment of the board that ticks every second. */
function Clock() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(new Date(LAUNCH).getTime() - Date.now());
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);
  if (left === null) return <span className="led-clock" aria-hidden />;
  if (left <= 0) return <span className="led-clock led-text">OUT NOW</span>;
  const d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), m = Math.floor((left % 36e5) / 6e4), sec = Math.floor((left % 6e4) / 1e3);
  return (
    <span className="led-clock" role="timer" aria-label={`${d} days ${h} hours ${m} minutes until GTA VI launches`}>
      <span className="led-tag-sm">GTA VI IN</span>
      <span className="led-text led-short">{d}D {pad(h)}:{pad(m)}:{pad(sec)}</span>
      <span className="led-text led-long">{d} DAYS {pad(h)} HRS {pad(m)} MIN {pad(sec)} SEC</span>
    </span>
  );
}

export function Ticker() {
  const [t, setT] = useState("");
  useEffect(() => { setT(untilLaunch()); const i = setInterval(() => setT(untilLaunch()), 60000); return () => clearInterval(i); }, []);
  const items = [
    t || "Counting down to launch",
    "Weekly prize pool grows with every member: gold 60, silver 25, bronze 15",
    "Reported install size: over 200 GB. Clear your drive",
    "Out November 19 on PS5 and Xbox Series X|S",
    "39 new launch screenshots just dropped — see them in the guide",
    "Reviews land November 18, one day before launch",
    "New: Justice ft. Gesaffelstein, \"Pusher\" — the full score drops December 11",
    "South Park just aired fresh GTA VI gameplay. Yes, the dog poop one",
    "Clip submissions open on launch day",
    "Every download pays the creator who made the clip",
    "Traffic on I-95 into Vice City: heavy. Police activity reported on Ocean Drive",
  ];
  return (
    <div className="ticker led-board h-8 flex items-center" aria-label="News ticker">
      <span className="led-tag shrink-0 h-full flex items-center px-3 z-10">LIVE FROM LEONIDA</span>
      <Clock />
      <div className="ticker overflow-hidden flex-1 min-w-0">
        {/* Two copies back to back: the loop never shows an empty board. */}
        <div className="ticker-track">
          {[...items, ...items].map((i, k) => <span key={k} className="led-text" aria-hidden={k >= items.length}>{i.toUpperCase()}</span>)}
        </div>
      </div>
    </div>
  );
}
