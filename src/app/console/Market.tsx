"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { mmss, quality, shotUrl, size, tagLabel, usd } from "@/lib/market";

type Row = { id: string; title: string; description: string; highlights: string[]; tags: string[]; price_cents: number; duration_s: number | null; size_bytes: number | null;
  width: number | null; height: number | null; shots: string[]; seller: string; video: string | null; status: string; review_note: string | null; sales_count: number; updated_at: string };
type Sale = { id: string; buyer: string; price_cents: number; fee_cents: number; seller_cents: number; created_at: string; refunded_at: string | null; refund_note: string | null; paid_by_card: boolean };
type Overview = { counts: Record<string, number>; sales: number; gross: number; fees: number; refunds: number; settings: { fee_bps: number; min_fee_cents: number; min_price_cents: number; max_price_cents: number } | null };

async function call(method: "GET" | "POST", qs = "", body?: object) {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch(`/api/market/review${qs}`, { method, headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return r.json().catch(() => ({}));
}

const TABS: [string, string][] = [["pending", "Waiting for review"], ["live", "Live"], ["paused", "Paused"], ["rejected", "Rejected"], ["removed", "Removed"], ["all", "Everything"]];
const STATUS_LABEL: Record<string, string> = { pending: "Waiting for review", live: "Live", paused: "Paused", rejected: "Rejected", removed: "Removed", uploading: "Still uploading" };

/** Clip Market control room: review, go live, pause, reject, remove or restore any listing; edit its
 *  title, description and price; see who bought it and refund a sale; set the commission. */
export function Market() {
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ov, setOv] = useState<Overview | null>(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    setRows(null);
    const [r, o] = await Promise.all([call("GET", `?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`), call("GET", "?view=overview")]);
    setRows(r.rows ?? []); if (o.counts) setOv(o as Overview);
  }, [status, q]);
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);
  const done = (text: string) => { setMsg(text); load(); };

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="display text-3xl">Clip Market</h2>
        <p className="text-haze text-sm">Everything in the store: review new listings, take things down, fix a listing, refund a sale. Sellers and buyers with market problems pick &ldquo;Clip Market&rdquo; in Support, and it lands in the Support queue.</p>
      </div>

      {ov && (
        <dl className="mkc-stats">
          <div><dt>Waiting</dt><dd>{ov.counts.pending ?? 0}</dd></div>
          <div><dt>Live</dt><dd>{ov.counts.live ?? 0}</dd></div>
          <div><dt>Sales</dt><dd>{ov.sales}</dd></div>
          <div><dt>Sold for</dt><dd>{usd(ov.gross)}</dd></div>
          <div><dt>Our commission</dt><dd>{usd(ov.fees)}</dd></div>
          <div><dt>Refunds</dt><dd>{ov.refunds}</dd></div>
        </dl>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {TABS.map(([s, l]) => <button key={s} className={`btn text-xs ${status === s ? "btn-hot" : "btn-ghost"}`} onClick={() => setStatus(s)}>{l}{ov && s !== "all" ? ` (${ov.counts[s] ?? 0})` : ""}</button>)}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a title" className="field !w-56 ml-auto" />
      </div>
      {msg && <p className="text-sm font-semibold text-gulf" role="status">{msg}</p>}

      {rows === null ? <p className="text-haze">Loading…</p> : !rows.length ? <p className="text-haze">Nothing here.</p> : rows.map((l) => <Listing key={l.id} l={l} onDone={done} />)}

      {ov?.settings && <Settings s={ov.settings} onDone={done} />}
    </div>
  );
}

function Listing({ l, onDone }: { l: Row; onDone: (m: string) => void }) {
  const [note, setNote] = useState("");
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ title: l.title, description: l.description, price: (l.price_cents / 100).toFixed(2) });
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState<null | { kind: "remove" } | { kind: "refund"; s: Sale }>(null);
  const [why, setWhy] = useState("");
  const act = async (action: string, extra: object = {}) => {
    setErr("");
    const r = await call("POST", "", { id: l.id, action, note, ...extra });
    if (!r.ok) { setErr(r.error ?? "That didn't work."); return; }
    onDone(({ approve: `“${l.title}” is live.`, reject: `“${l.title}” rejected. The seller sees your note.`, remove: `“${l.title}” removed from the store.`, pause: `“${l.title}” paused.`, pending: `“${l.title}” sent back to review.`, edit: `“${f.title}” updated.` } as Record<string, string>)[action] ?? "Done.");
  };
  const loadSales = async () => { const r = await call("GET", `?sales=${l.id}`); setSales(r.rows ?? []); };
  const refund = async (s: Sale) => {
    setAsk(null);
    const r = await call("POST", "", { action: "refund", purchase: s.id, note: why });
    if (!r.ok) { setErr(r.error ?? "Refund failed."); return; }
    loadSales(); onDone(`Refunded ${s.buyer} for “${l.title}”.`);
  };

  return (
    <article className="rounded-xl border-2 border-line bg-ink p-4 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
      <div className="grid gap-2 content-start">
        {l.video ? <video src={l.video} controls preload="metadata" className="w-full rounded-lg bg-black aspect-video" /> : <p className="text-flamingo font-bold">No file uploaded yet.</p>}
        <div className="grid grid-cols-5 gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {l.shots.map((s, i) => <img key={i} src={shotUrl(s)} alt="" className="rounded aspect-video object-cover" />)}
        </div>
      </div>
      <div className="grid gap-2 content-start">
        <p className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest text-haze">
          <span className={`mkc-badge s-${l.status}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
          {l.seller} · {usd(l.price_cents)} · {mmss(l.duration_s)} · {quality(l.width, l.height)} · {size(l.size_bytes)} · {l.sales_count} sold
        </p>
        {edit ? (
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm font-bold">Title<input className="field font-normal" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
            <label className="grid gap-1 text-sm font-bold">Description<textarea rows={4} className="field font-normal" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
            <label className="grid gap-1 text-sm font-bold">Price (USD)<input type="number" step="0.01" min="1" className="field font-normal !w-32" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
            <div className="flex gap-2"><button className="btn btn-hot" onClick={async () => { await act("edit", { title: f.title, description: f.description, price_cents: Math.round(Number(f.price) * 100) }); setEdit(false); }}>Save</button><button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancel</button></div>
          </div>
        ) : (
          <>
            <b className="text-xl">{l.title}</b>
            <p className="text-sm whitespace-pre-line">{l.description}</p>
            {l.highlights.length > 0 && <ol className="text-sm list-decimal pl-5">{l.highlights.map((h, i) => <li key={i}>{h}</li>)}</ol>}
            <p className="text-xs text-haze">Tags: {l.tags.map(tagLabel).join(", ")}</p>
          </>
        )}
        {l.review_note && <p className="text-xs text-haze">Last note to the seller: {l.review_note}</p>}
        <textarea rows={2} className="field" placeholder="Note to the seller (needed to reject; shown with pause and remove too)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {l.status !== "live" && l.status !== "removed" && <button className="btn btn-hot" onClick={() => act("approve")} disabled={!l.video} title="Put it on sale">Go live</button>}
          {l.status === "live" && <button className="btn btn-ghost" onClick={() => act("pause")} title="Hide it from the store for now">Pause</button>}
          {l.status !== "rejected" && l.status !== "removed" && <button className="btn btn-ghost" onClick={() => act("reject")} title="Send it back to the seller with your note">Reject</button>}
          {l.status === "removed" && <button className="btn btn-ghost" onClick={() => act("pending")} title="Bring it back for review">Restore to review</button>}
          {!edit && <button className="btn btn-ghost" onClick={() => setEdit(true)}>Edit</button>}
          {l.status !== "removed" && <button className="btn btn-ghost" onClick={() => setAsk({ kind: "remove" })}>Remove</button>}
          <button className="btn btn-ghost" onClick={() => (sales ? setSales(null) : loadSales())}>{sales ? "Hide sales" : `Sales (${l.sales_count})`}</button>
          <a href={`/market/${l.id}`} className="btn btn-ghost" target="_blank" rel="noreferrer">Open listing</a>
        </div>
        {ask?.kind === "remove" && (
          <div className="mkc-ask" role="alertdialog" aria-label="Remove listing">
            <p><b>Remove &ldquo;{l.title}&rdquo; from the store?</b></p>
            <p className="text-sm text-haze">It comes off sale straight away. Anyone who bought it keeps their copy and the seller keeps what they earned. The seller can&apos;t relist it; you can bring it back with Restore to review.</p>
            <div className="flex gap-2 justify-end"><button className="btn btn-ghost" onClick={() => setAsk(null)}>Cancel</button><button className="btn btn-hot" onClick={() => { setAsk(null); act("remove"); }}>Remove it</button></div>
          </div>
        )}
        {ask?.kind === "refund" && (
          <div className="mkc-ask" role="alertdialog" aria-label="Refund sale">
            <p><b>Refund {ask.s.buyer} {usd(ask.s.price_cents)}?</b></p>
            <ul className="text-sm text-haze list-disc pl-5">
              <li>{ask.s.paid_by_card ? "Their card gets the full amount back (Stripe, usually 5–10 days)." : "Test sale: no card to refund."}</li>
              <li>They lose access to the file.</li>
              <li>{usd(ask.s.seller_cents)} comes back out of the seller&apos;s wallet.</li>
            </ul>
            <label className="grid gap-1 text-sm font-bold">Reason (kept on record)<input className="field font-normal" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="File doesn't play / not as described…" /></label>
            <div className="flex gap-2 justify-end"><button className="btn btn-ghost" onClick={() => setAsk(null)}>Cancel</button><button className="btn btn-hot" onClick={() => refund(ask.s)}>Refund</button></div>
          </div>
        )}
        {err && <p role="alert" className="text-sm font-semibold text-flamingo">{err}</p>}
        {sales && (
          <ul className="mkc-sales">
            {sales.length === 0 && <li className="text-haze">No sales yet.</li>}
            {sales.map((s) => (
              <li key={s.id} className={s.refunded_at ? "is-refunded" : ""}>
                <span><b>{s.buyer}</b><small>{new Date(s.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · paid {usd(s.price_cents)} · seller got {usd(s.seller_cents)}{s.paid_by_card ? "" : " · test sale"}</small></span>
                {s.refunded_at ? <em>Refunded{s.refund_note ? `: ${s.refund_note}` : ""}</em> : <button className="btn btn-ghost !py-1 text-xs" onClick={() => { setWhy(""); setAsk({ kind: "refund", s }); }}>Refund</button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function Settings({ s, onDone }: { s: NonNullable<Overview["settings"]>; onDone: (m: string) => void }) {
  const [v, setV] = useState({ fee: String(s.fee_bps / 100), floor: (s.min_fee_cents / 100).toFixed(2), lo: (s.min_price_cents / 100).toFixed(2), hi: (s.max_price_cents / 100).toFixed(2) });
  const [err, setErr] = useState("");
  const save = async () => {
    const r = await call("POST", "", { action: "settings", fee_bps: Math.round(Number(v.fee) * 100), min_fee_cents: Math.round(Number(v.floor) * 100), min_price_cents: Math.round(Number(v.lo) * 100), max_price_cents: Math.round(Number(v.hi) * 100) });
    if (!r.ok) { setErr(r.error ?? "Couldn't save."); return; }
    setErr(""); onDone("Store settings saved. New sales use them right away.");
  };
  return (
    <section className="rounded-xl border-2 border-line bg-ink p-4 grid gap-3">
      <h3 className="font-extrabold text-lg">Store settings</h3>
      <p className="text-sm text-haze">Our commission is a percentage of each sale, with a minimum per sale. The seller gets the rest straight into their wallet. Changes apply to new sales only.</p>
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm font-bold">Commission (%)<input type="number" step="0.5" className="field font-normal !w-28" value={v.fee} onChange={(e) => setV({ ...v, fee: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-bold">Minimum commission ($)<input type="number" step="0.05" className="field font-normal !w-28" value={v.floor} onChange={(e) => setV({ ...v, floor: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-bold">Lowest price ($)<input type="number" step="0.5" className="field font-normal !w-28" value={v.lo} onChange={(e) => setV({ ...v, lo: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-bold">Highest price ($)<input type="number" step="0.5" className="field font-normal !w-28" value={v.hi} onChange={(e) => setV({ ...v, hi: e.target.value })} /></label>
      </div>
      <p className="text-xs text-haze">Example: at {v.fee}% with a {usd(Math.round(Number(v.floor) * 100))} minimum, a $5 clip pays the seller {usd(500 - Math.min(500, Math.max(Math.round(Number(v.floor) * 100), Math.round(500 * Number(v.fee) / 100))))}.</p>
      <div><button className="btn btn-hot" onClick={save}>Save settings</button></div>
      {err && <p role="alert" className="text-sm font-semibold text-flamingo">{err}</p>}
    </section>
  );
}
