"use client";
import { useEffect, useId, useRef, useState } from "react";

/** Wraps anything with a short description: shown on hover or keyboard focus on desktop, and on tap on touch screens. */
export function HoverTip({ tip, children, className = "" }: { tip: string; children: React.ReactNode; className?: string }) {
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
  return (
    <span ref={box} className={`hov-tip${open ? " is-open" : ""} ${className}`} tabIndex={0} aria-describedby={id} onClick={() => setOpen((v) => !v)}>
      {children}
      <span role="tooltip" id={id} className="hov-tip-pop">{tip}</span>
    </span>
  );
}
