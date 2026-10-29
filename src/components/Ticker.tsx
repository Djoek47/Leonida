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
    "Season 1 prize pool: $100 a week, split 50 / 30 / 20",
    "Clip submissions open on launch day",
    "Versus sign-ups are open: one task, two consoles, live on Twitch",
    "Traffic on I-95 into Vice City: heavy. Police activity reported on Ocean Drive",
  ];
  return (
    <div className="ticker bg-mango text-[#1c1710] text-xs font-bold h-7 flex items-center" aria-label="News ticker">
      <span className="shrink-0 h-full flex items-center px-3 bg-[#1c1710] text-[#ffc12b] z-10">Live From Leonida</span>
      <div className="ticker overflow-hidden flex-1">
        <div className="ticker-track">
          {items.map((i, k) => <span key={k}>{i}</span>)}
        </div>
      </div>
    </div>
  );
}
