"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import shots from "@/lib/gallery.json";

type Shot = { src: string; group: string; label: string; title: string; subject: string };
const ALL = shots as Shot[];
const LABELS = Array.from(new Set(ALL.map((s) => s.label)));

/** Every official Rockstar image we hold, browsable. Filter by set, then by subject;
 *  tap one to open it full size and walk through with the arrow keys. */
export function Gallery() {
  const [label, setLabel] = useState("All");
  const [subject, setSubject] = useState("All");
  const [at, setAt] = useState<number | null>(null);

  const byLabel = useMemo(() => label === "All" ? ALL : ALL.filter((s) => s.label === label), [label]);
  const subjects = useMemo(() => ["All", ...Array.from(new Set(byLabel.map((s) => s.subject)))], [byLabel]);
  const shown = useMemo(() => subject === "All" ? byLabel : byLabel.filter((s) => s.subject === subject), [byLabel, subject]);

  const step = useCallback((d: number) => setAt((i) => i == null ? i : (i + d + shown.length) % shown.length), [shown.length]);

  useEffect(() => {
    if (at == null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAt(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [at, step]);

  const open = at == null ? null : shown[at];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["All", ...LABELS].map((l) => (
          <button key={l} onClick={() => { setLabel(l); setSubject("All"); }} aria-pressed={label === l}
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold ${label === l ? "border-gulf bg-gulf text-white" : "border-line text-haze"}`}>
            {l} <span className="opacity-70">{l === "All" ? ALL.length : ALL.filter((s) => s.label === l).length}</span>
          </button>
        ))}
      </div>
      {subjects.length > 2 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {subjects.map((s) => (
            <button key={s} onClick={() => setSubject(s)} aria-pressed={subject === s}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${subject === s ? "bg-foam text-dusk" : "bg-ink-2 text-haze"}`}>{s}</button>
          ))}
        </div>
      )}

      <ul className="mt-6 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((s, i) => (
          <li key={s.src}>
            <button onClick={() => setAt(i)} className="group block w-full overflow-hidden rounded-md bg-ink-2 aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.title} loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-haze">
        {shown.length} of {ALL.length} official images from Rockstar&apos;s media kit. Click one to open it full size.
      </p>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.title} onClick={() => setAt(null)}
          className="fixed inset-0 z-[60] flex flex-col bg-black/92">
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
            <p className="font-bold truncate">{open.title} <span className="text-white/60 font-normal">· {open.label}</span></p>
            <p className="shrink-0 text-sm text-white/60">{(at ?? 0) + 1} / {shown.length}</p>
            <button onClick={() => setAt(null)} aria-label="Close" className="shrink-0 rounded-full bg-white/15 size-9 grid place-items-center text-xl leading-none">×</button>
          </div>
          <div className="relative flex-1 min-h-0 grid place-items-center px-2 pb-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.src} alt={open.title} className="max-h-full max-w-full object-contain" />
            {shown.length > 1 && (
              <>
                <button onClick={() => step(-1)} aria-label="Previous"
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/55 text-white text-3xl leading-none grid place-items-center hover:bg-black/75">‹</button>
                <button onClick={() => step(1)} aria-label="Next"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/55 text-white text-3xl leading-none grid place-items-center hover:bg-black/75">›</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
