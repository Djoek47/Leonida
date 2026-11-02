"use client";
import { useMemo, useState } from "react";
import data from "@/lib/arsenal.json";

type Item = { id: string; kind: "vehicle" | "weapon"; name: string; category: string; maker: string; inspiration: string; note: string; img: string | null };
const ALL = data as Item[];

/** Vehicles and weapons, filled by scripts/import-arsenal.mjs. Search, filter by class, tap for details. */
export function Arsenal() {
  const [kind, setKind] = useState<Item["kind"]>("vehicle");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Item | null>(null);

  const ofKind = ALL.filter((x) => x.kind === kind);
  const cats = useMemo(() => ["All", ...Array.from(new Set(ofKind.map((x) => x.category).filter(Boolean))).sort()], [ofKind]);
  const shown = ofKind.filter((x) => (cat === "All" || x.category === cat)
    && `${x.name} ${x.maker} ${x.inspiration}`.toLowerCase().includes(q.toLowerCase()));
  const count = (k: Item["kind"]) => ALL.filter((x) => x.kind === k).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex rounded-full border-2 border-line p-1 text-sm font-bold">
          {(["vehicle", "weapon"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setCat("All"); }}
              className={`rounded-full px-4 py-1.5 ${kind === k ? "bg-foam text-dusk" : "text-haze"}`}>
              {k === "vehicle" ? "Vehicles" : "Weapons"} <span className="opacity-70">{count(k)}</span>
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${kind === "vehicle" ? "cars, makers, real-life models" : "guns, real-life models"}`}
          className="field !w-auto flex-1 min-w-[12rem]" aria-label="Search" />
      </div>
      {cats.length > 2 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
              className={`shrink-0 rounded-full border-2 px-3 py-1 text-sm font-bold ${cat === c ? "border-gulf bg-gulf text-white" : "border-line text-haze"}`}>{c}</button>
          ))}
        </div>
      )}

      {shown.length === 0 ? <p className="mt-10 text-haze">Nothing matches that.</p> : (
        <ul className="mt-8 grid gap-x-6 gap-y-8 grid-cols-2 lg:grid-cols-4">
          {shown.map((x) => (
            <li key={x.id}>
              <button onClick={() => setOpen(x)} className="group block w-full text-left">
                <div className="aspect-video rounded-md overflow-hidden bg-ink-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {x.img ? <img src={x.img} alt={x.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <span className="grid h-full place-items-center text-sm text-haze">Picture coming</span>}
                </div>
                <p className="mt-2 font-extrabold leading-snug">{x.name}</p>
                <p className="text-sm text-haze">{[x.category, x.maker].filter(Boolean).join(" · ")}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-xl bg-ink border-2 border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {open.img && <img src={open.img} alt={open.name} className="aspect-video w-full object-cover" />}
            <div className="p-5">
              <h3 className="display text-4xl">{open.name}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {([["Class", open.category], ["Maker", open.maker], ["Based on", open.inspiration], ["Where", open.note]] as const)
                  .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-haze">{k}</dt><dd className="font-bold">{v}</dd></div>)}
              </dl>
              <button onClick={() => setOpen(null)} className="btn btn-ghost mt-5 !py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
