"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

type Item = { id: string; title: string; source: string; snippet: string; link: string; published: string | null; status: string; fetched_at: string };
type Line = { id: string; text: string; kind: string; source: string; link: string | null; active: boolean; created_at: string };

/** News inbox (filled daily by /api/cron/news) and the LED ticker's lines. */
export function News() {
  const [items, setItems] = useState<Item[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [show, setShow] = useState<"new" | "all">("new");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const c = sb(); if (!c) return;
    let q = c.from("news_inbox").select("*").order("fetched_at", { ascending: false }).limit(80);
    if (show === "new") q = q.eq("status", "new");
    const [{ data: n }, { data: t }] = await Promise.all([q, c.from("ticker_items").select("*").order("created_at", { ascending: false })]);
    setItems((n ?? []) as Item[]); setLines((t ?? []) as Line[]);
  }, [show]);
  useEffect(() => { load(); }, [load]);

  const c = sb();
  const status = async (id: string, s: string) => { await c?.from("news_inbox").update({ status: s }).eq("id", id); load(); };
  const addLine = async (text: string, from?: Item) => {
    const t = text.trim();
    if (t.length < 3 || t.length > 140) { setNote("A ticker line is 3 to 140 characters."); return; }
    const { error } = await c!.from("ticker_items").insert({ text: t, kind: "manual", source: from?.source ?? "", link: from?.link ?? null });
    if (error) { setNote(error.message); return; }
    if (from) await c!.from("news_inbox").update({ status: "used" }).eq("id", from.id);
    setDraft(""); setNote("Added to the ticker. It shows on the site within a minute."); load();
  };
  const toGuide = async (it: Item) => {
    const { error } = await c!.from("guide_entries").insert({ topic: "News", title: it.title.slice(0, 140), body: `Research notes.\n${it.snippet}\n\nRewrite this in our own words before publishing.`, sources: [it.link], published: false });
    if (error) { setNote(error.message); return; }
    await status(it.id, "used"); setNote("Saved as a draft in Research → guide entries. Rewrite it before publishing.");
  };

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="display text-3xl">LED ticker</h2>
        <p className="text-haze text-sm mt-1">The daily run swaps the &quot;auto&quot; lines for that day&apos;s headlines. Your own lines stay until you hide them.</p>
        <div className="mt-3 flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={140} placeholder="Write a ticker line (140 max)" className="field flex-1" />
          <button className="btn btn-hot" onClick={() => addLine(draft)}>Add</button>
        </div>
        <ul className="mt-3 grid gap-2">
          {lines.map((l) => (
            <li key={l.id} className={`rounded-xl border-2 border-line px-3 py-2 flex flex-wrap items-center gap-2 ${l.active ? "bg-ink" : "opacity-50"}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-haze">{l.kind}</span>
              <span className="flex-1 font-semibold">{l.text}</span>
              <button className="btn btn-ghost text-xs" onClick={async () => { await c?.from("ticker_items").update({ active: !l.active }).eq("id", l.id); load(); }}>{l.active ? "Hide" : "Show"}</button>
              <button className="btn btn-ghost text-xs" onClick={async () => { await c?.from("ticker_items").delete().eq("id", l.id); load(); }}>Delete</button>
            </li>
          ))}
          {!lines.length && <li className="text-haze text-sm">No lines yet. The site shows its built-in lines until you add some.</li>}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="display text-3xl">News inbox</h2>
          <div className="flex gap-2">{(["new", "all"] as const).map((k) => <button key={k} className={`btn text-xs ${show === k ? "btn-hot" : "btn-ghost"}`} onClick={() => setShow(k)}>{k === "new" ? "Waiting" : "All"}</button>)}</div>
        </div>
        {note && <p className="mt-2 text-sm font-semibold text-gulf" role="status">{note}</p>}
        <ul className="mt-3 grid gap-3">
          {items.map((it) => (
            <li key={it.id} className="rounded-xl border-2 border-line bg-ink p-3">
              <a href={it.link} target="_blank" rel="noopener noreferrer" className="font-black hover:underline">{it.title}</a>
              <p className="text-xs text-haze mt-0.5">{it.source}{it.published ? ` · ${it.published}` : ""} · {it.status}</p>
              {it.snippet && <p className="text-sm mt-1">{it.snippet}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn btn-hot text-xs" onClick={() => addLine(`${it.title.slice(0, 120)}`, it)}>To ticker</button>
                <button className="btn btn-ghost text-xs" onClick={() => setDraft(it.title.slice(0, 140))}>Edit as ticker line</button>
                <button className="btn btn-ghost text-xs" onClick={() => toGuide(it)}>Draft guide entry</button>
                <button className="btn btn-ghost text-xs" onClick={() => status(it.id, "dismissed")}>Dismiss</button>
              </div>
            </li>
          ))}
          {!items.length && <li className="text-haze text-sm">Nothing waiting. The next run is at 6:00 Toronto time.</li>}
        </ul>
      </section>
    </div>
  );
}
