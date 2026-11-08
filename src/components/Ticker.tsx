"use client";
import { useEffect, useState } from "react";
import { LAUNCH } from "@/lib/content";

function untilLaunch() {
  const ms = new Date(LAUNCH).getTime() - Date.now();
  if (ms <= 0) return "GTA VI is out now in Leonida";
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return `${d} days ${h} hours until GTA VI lands on PS5 and Xbox Series X|S`;
}

export function Ticker() {
  const [t, setT] = useState("");
  useEffect(() => { setT(untilLaunch()); const i = setInterval(() => setT(untilLaunch()), 60000); return () => clearInterval(i); }, []);
  const items = [
    t || "Counting down to launch",
    "Weekly prize pool grows with every member, split 50 / 30 / 20",
    "Preload opens November 12 on PS5 and Xbox Series X|S",
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
      <div className="ticker overflow-hidden flex-1 min-w-0">
        <div className="ticker-track">
          {items.map((i, k) => <span key={k} className="led-text">{i.toUpperCase()}</span>)}
        </div>
      </div>
    </div>
  );
}
