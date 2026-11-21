"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { mmss, quality, shotUrl, size, tagLabel, usd } from "@/lib/market";

type Row = { id: string; title: string; description: string; highlights: string[]; tags: string[]; price_cents: number; duration_s: number | null; size_bytes: number | null; width: number | null; height: number | null; shots: string[]; seller: string; video: string | null; status: string; review_note: string | null };

async function call(method: "GET" | "POST", qs = "", body?: object) {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch(`/api/market/review${qs}`, { method, headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({}));
}

/** Clip Market review: watch the video against its card, then approve or reject with a note. */
export function Market() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => { setRows(null); const r = await call("GET", `?status=${status}`); setRows(r.rows ?? []); }, [status]);
  useEffect(() => { load(); }, [load]);
  const act = async (id: string, action: string) => {
    const r = await call("POST", "", { id, action, note: notes[id] });
    setMsg(r.ok ? (action === "approve" ? "Approved. It's live." : action === "reject" ? "Rejected. The seller sees your note." : "Removed.") : r.error ?? "Failed.");
    if (r.ok) load();
  };
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="display text-3xl">Clip Market review</h2><p className="text-haze text-sm">Check the video matches the screenshots and description, it&apos;s GTA VI gameplay, and nothing breaks the rules.</p></div>
        <div className="flex gap-2">{["pending", "live", "rejected", "paused"].map((s) => <button key={s} className={`btn text-xs ${status === s ? "btn-hot" : "btn-ghost"}`} onClick={() => setStatus(s)}>{s}</button>)}</div>
      </div>
      {msg && <p className="text-sm font-semibold text-gulf" role="status">{msg}</p>}
      {rows === null ? <p className="text-haze">Loading…</p> : !rows.length ? <p className="text-haze">Nothing {status}.</p> : rows.map((l) => (
        <article key={l.id} className="rounded-xl border-2 border-line bg-ink p-4 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          <div className="grid gap-2">
            {l.video ? <video src={l.video} controls preload="metadata" className="w-full rounded-lg bg-black aspect-video" /> : <p className="text-flamingo font-bold">No file uploaded yet.</p>}
            <div className="grid grid-cols-5 gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.shots.map((s, i) => <img key={i} src={shotUrl(s)} alt="" className="rounded aspect-video object-cover" />)}
            </div>
          </div>
          <div className="grid gap-2 content-start">
            <p className="text-xs font-black uppercase tracking-widest text-haze">{l.seller} · {usd(l.price_cents)} · {mmss(l.duration_s)} · {quality(l.width, l.height)} · {size(l.size_bytes)}</p>
            <b className="text-xl">{l.title}</b>
            <p className="text-sm whitespace-pre-line">{l.description}</p>
            {l.highlights.length > 0 && <ol className="text-sm list-decimal pl-5">{l.highlights.map((h, i) => <li key={i}>{h}</li>)}</ol>}
            <p className="text-xs text-haze">Tags: {l.tags.map(tagLabel).join(", ")}</p>
            {l.review_note && <p className="text-xs text-haze">Last note: {l.review_note}</p>}
            <textarea rows={2} className="field" placeholder="Note to the seller (required to reject)" value={notes[l.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))} />
            <div className="flex flex-wrap gap-2">
              {l.status !== "live" && <button className="btn btn-hot" onClick={() => act(l.id, "approve")} disabled={!l.video}>Approve</button>}
              {l.status !== "rejected" && <button className="btn btn-ghost" onClick={() => act(l.id, "reject")}>Reject</button>}
              <button className="btn btn-ghost" onClick={() => act(l.id, "remove")}>Remove</button>
              <a href={`/market/${l.id}`} className="btn btn-ghost" target="_blank" rel="noreferrer">Open listing</a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
