"use client";
import { useEffect, useState } from "react";

type Mode = "day" | "night";

/** Day = highway signs. Night = Vice City after dark. Remembers the choice per browser. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("day");
  useEffect(() => {
    const set = document.documentElement.dataset.theme as Mode | undefined;
    setMode(set ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day"));
  }, []);
  function flip() {
    const next: Mode = mode === "day" ? "night" : "day";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("ll-theme", next); } catch {}
    setMode(next);
  }
  return (
    <button onClick={flip} className="btn btn-ghost !p-2 !rounded-full" aria-label={mode === "day" ? "Switch to night mode" : "Switch to day mode"} title={mode === "day" ? "Night mode" : "Day mode"}>
      {mode === "day" ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5Z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4.5" fill="currentColor" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" /></svg>
      )}
    </button>
  );
}

/** Runs before paint so the saved theme never flashes. */
export const themeScript = `try{var t=localStorage.getItem("ll-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;
