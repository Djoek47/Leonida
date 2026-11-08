"use client";
import { useCallback, useEffect, useState } from "react";

type Mode = "day" | "night";

/** Leonida runs on its own clock: day from 6am, night from 6pm. */
export const DAY_START = 6;
export const NIGHT_START = 18;

export const modeAt = (d: Date): Mode =>
  d.getHours() >= DAY_START && d.getHours() < NIGHT_START ? "day" : "night";

/** When the sky next changes over, so an override knows when to expire. */
export function nextSwitch(from: Date): Date {
  const n = new Date(from);
  n.setMinutes(0, 0, 0);
  const h = from.getHours();
  if (h < DAY_START) n.setHours(DAY_START);
  else if (h < NIGHT_START) n.setHours(NIGHT_START);
  else { n.setDate(n.getDate() + 1); n.setHours(DAY_START); }
  return n;
}

/** Day = highway signs at golden hour. Night = Vice City after dark.
 *  The clock decides. Tapping the button overrides it until the next
 *  changeover, so a manual choice never silently disables the schedule. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("day");
  const [pinned, setPinned] = useState(false);

  const apply = useCallback(() => {
    let m = modeAt(new Date());
    let held = false;
    try {
      const raw = localStorage.getItem("ll-theme");
      const [saved, until] = (raw ?? "").split(":");
      if (until && Date.now() < Number(until)) { m = saved as Mode; held = true; }
      else if (raw) localStorage.removeItem("ll-theme");   // expired, back on the clock
    } catch { /* private mode, just use the clock */ }
    document.documentElement.dataset.theme = m;
    setMode(m); setPinned(held);
  }, []);

  useEffect(() => {
    apply();
    const id = setInterval(apply, 60_000);                  // catch the changeover live
    const wake = () => !document.hidden && apply();         // and after the tab sleeps
    document.addEventListener("visibilitychange", wake);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", wake); };
  }, [apply]);

  function flip() {
    const next: Mode = mode === "day" ? "night" : "day";
    document.documentElement.dataset.theme = next;
    if (next === modeAt(new Date())) {
      try { localStorage.removeItem("ll-theme"); } catch {}  // back in step, drop the override
      setPinned(false);
    } else {
      try { localStorage.setItem("ll-theme", `${next}:${nextSwitch(new Date()).getTime()}`); } catch {}
      setPinned(true);
    }
    setMode(next);
  }

  const label = mode === "day" ? "Switch to night mode" : "Switch to day mode";
  const hint = pinned
    ? `${mode === "day" ? "Day" : "Night"} mode until ${nextSwitch(new Date()).getHours()}:00`
    : `Following the clock — ${mode === "day" ? "night" : "day"} from ${(mode === "day" ? NIGHT_START : DAY_START)}:00`;

  return (
    <button onClick={flip} className="btn btn-ghost !p-2 !rounded-full" aria-label={label} title={hint}>
      {mode === "day" ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5Z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4.5" fill="currentColor" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" /></svg>
      )}
    </button>
  );
}

/** Runs before paint, so the right theme is on the page from the first frame.
 *  Same rule as above: the clock decides unless an unexpired override says otherwise. */
export const themeScript = `try{
var h=new Date().getHours(),m=(h>=6&&h<18)?"day":"night",s=localStorage.getItem("ll-theme");
if(s){var p=s.split(":");if(p[1]&&Date.now()<+p[1])m=p[0];else localStorage.removeItem("ll-theme")}
document.documentElement.dataset.theme=m}catch(e){}`.replace(/\n/g, "");
