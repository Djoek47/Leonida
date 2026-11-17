"use client";
import { useEffect, useId, useRef, useState } from "react";
import { PERK_TIPS } from "@/lib/tiers";

/** A plan perk with its explanation tucked away: shown on hover or keyboard focus on desktop,
 *  and on tap on touch screens. Perks without an explanation render as plain text. */
export function Perk({ text }: { text: string }) {
  const tip = PERK_TIPS[text];
  const id = useId();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  if (!tip) return <>{text}</>;
  return (
    <span ref={box} className={`perk-tip${open ? " is-open" : ""}`}>
      <button type="button" className="perk-tip-btn" aria-describedby={id} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {text}<i aria-hidden>i</i>
      </button>
      <span role="tooltip" id={id} className="perk-tip-pop">{tip}</span>
    </span>
  );
}
