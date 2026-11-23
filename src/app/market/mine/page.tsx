"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { MarketCard } from "@/components/market/MarketCard";
import { Thread } from "@/components/market/Thread";
import { LISTING_COLS, shotUrl, usd, type Listing } from "@/lib/market";

/** My Clip Market: what I'm selling, what I've bought, and every conversation. */
type Tab = "selling" | "bought" | "messages";
type Purchase = { listing_id: string; price_cents: number; seller_cents: number; created_at: string; buyer_id: string; seller_id: string };
type T = { id: string; listing_id: string; buyer_id: string; seller_id: string; last_at: string; buyer_seen_at: string; seller_seen_at: string };
const STATUS: Record<string, [string, string]> = {
  uploading: ["Upload unfinished", "is-warn"], pending: ["In review", "is-wait"], live: ["Live", "is-live"],
  rejected: ["Not approved", "is-bad"], paused: ["Paused", "is-wait"], removed: ["Removed", "is-off"],
};

async function post(url: string, body: object) {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

export default function Mine() {
  const { user, loading } = useUser();
  const [tab, setTab] = useState<Tab>("selling");
  const [mine, setMine] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [bought, setBought] = useState<(Listing & { paid: number })[]>([]);
  const [threads, setThreads] = useState<T[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const c = sb(); if (!c || !user) return;
    const [{ data: l }, { data: p }, { data: th }] = await Promise.all([
      c.from("market_listings").select(LISTING_COLS).eq("seller_id", user.id).neq("status", "removed").order("created_at", { ascending: false }),
      c.from("market_purchases").select("listing_id, price_cents, seller_cents, created_at, buyer_id, seller_id").is("refunded_at", null).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false }),
      c.from("market_threads").select("*").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("last_at", { ascending: false }),
    ]);
    setMine((l ?? []) as Listing[]);
    const ps = (p ?? []) as Purchase[];
    setSales(ps.filter((x) => x.seller_id === user.id));
    const mineBought = ps.filter((x) => x.buyer_id === user.id);
    if (mineBought.length) {
      const { data: bl } = await c.from("market_listings").select(LISTING_COLS).in("id", mineBought.map((x) => x.listing_id));
      setBought(((bl ?? []) as Listing[]).map((x) => ({ ...x, paid: mineBought.find((y) => y.listing_id === x.id)?.price_cents ?? x.price_cents })));
    } else setBought([]);
    const ts = (th ?? []) as T[];
    setThreads(ts);
    const people = [...new Set(ts.flatMap((t) => [t.buyer_id, t.seller_id]))];
    if (people.length) {
      const { data: pr } = await c.from("profiles").select("id, gamertag, display_name").in("id", people);
      setNames(Object.fromEntries((pr ?? []).map((x) => [x.id, x.gamertag || x.display_name || "Player"])));
    }
    const lids = [...new Set(ts.map((t) => t.listing_id))];
    if (lids.length) {
      const { data: tl } = await c.from("market_listings").select("id, title").in("id", lids);
      setTitles(Object.fromEntries((tl ?? []).map((x) => [x.id, x.title])));
    }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const [removeAsk, setRemoveAsk] = useState<Listing | null>(null);
  const setStatus = async (l: Listing, status: string) => {
    setRemoveAsk(null);
    const { error } = await sb()!.from("market_listings").update({ status }).eq("id", l.id);
    setNote(error ? "Couldn't change that. Try again." : status === "paused" ? "Paused. It's hidden from the market until you relist it." : status === "live" ? "Back on the market." : status === "pending" ? "Sent back for review." : "Removed.");
    load();
  };
  const dl = async (id: string) => { const r = await post("/api/market/download", { listingId: id }); if (r.url) location.href = r.url; else setNote(r.error ?? "Couldn't get the file."); };

  if (loading) return <div className="mk-page"><p className="mk-wrap py-20 font-bold" role="status">Loading…</p></div>;
  if (!user) return <div className="mk-page"><div className="mk-wrap py-20 text-center"><p className="display text-4xl">Sign in to see your clips</p><Link href="/login?next=/market/mine" className="btn btn-hot mt-5">Sign in</Link></div></div>;

  const earned = sales.reduce((s, x) => s + x.seller_cents, 0);
  const unread = threads.filter((t) => new Date(t.last_at) > new Date(t.buyer_id === user.id ? t.buyer_seen_at : t.seller_seen_at)).length;

  return (
    <div className="mk-page">
      {removeAsk && (
        <div className="mk-rm-bg" onClick={() => setRemoveAsk(null)}>
          <div className="mk-rm" role="alertdialog" aria-modal="true" aria-labelledby="mk-rm-t" onClick={(e) => e.stopPropagation()}>
            <p className="mk-rm-k">Remove from the Clip Market</p>
            <h2 id="mk-rm-t">Remove &ldquo;{removeAsk.title}&rdquo; for good?</h2>
            <ul className="mk-rm-list">
              <li><b>🛑 It comes off the market right away.</b> Nobody can find it, open it or buy it any more.</li>
              <li><b>✅ Buyers keep their copy.</b> {removeAsk.sales_count > 0 ? `The ${removeAsk.sales_count} ${removeAsk.sales_count === 1 ? "person who" : "people who"} bought it` : "Anyone who bought it"} can still download it from their Bought tab.</li>
              <li><b>💵 Your earnings stay.</b> Money from past sales is already in your wallet and isn&apos;t taken back.</li>
              <li><b>⚠ This can&apos;t be undone.</b> To sell it again you&apos;d list it as a new clip, and it goes through review again.</li>
            </ul>
            {removeAsk.status === "live" && <p className="mk-rm-tip">Just need a break? <b>Pause</b> hides it from the market and you can relist it any time.</p>}
            <div className="mk-rm-btns">
              <button className="btn btn-ghost" onClick={() => setRemoveAsk(null)} autoFocus>Keep it listed</button>
              {removeAsk.status === "live" && <button className="btn btn-ghost" onClick={() => setStatus(removeAsk, "paused")}>Pause instead</button>}
              <button className="btn mk-rm-go" onClick={() => setStatus(removeAsk, "removed")}>Remove for good</button>
            </div>
          </div>
        </div>
      )}
      <div className="mk-wrap">
        <nav className="mk-crumbs"><Link href="/market">Clip Market</Link><span>›</span><span>My clips</span></nav>
        <div className="mk-mine-head">
          <h1 className="mk-title mk-title-sm">My <span>clips</span></h1>
          <Link href="/market/sell" className="btn btn-hot">Sell a clip</Link>
        </div>
        <div className="mk-stats">
          <div><span className="mk-k">Earned on the market</span><b>{usd(earned)}</b><small>Paid into your <Link href="/wallet" className="underline">wallet</Link></small></div>
          <div><span className="mk-k">Clips sold</span><b>{sales.length}</b></div>
          <div><span className="mk-k">Live listings</span><b>{mine.filter((l) => l.status === "live").length}</b></div>
          <div><span className="mk-k">Unread</span><b>{unread}</b></div>
        </div>

        <div className="mk-tabs" role="tablist">
          {([["selling", `Selling ${mine.length}`], ["bought", `Bought ${bought.length}`], ["messages", `Messages${unread ? ` · ${unread} new` : ""}`]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "is-on" : ""} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>
        {note && <p className="mk-note" role="status">{note}</p>}

        {tab === "selling" && (mine.length ? (
          <ul className="mk-rows">
            {mine.map((l) => {
              const [label, cls] = STATUS[l.status] ?? [l.status, ""];
              const sold = sales.filter((s) => s.listing_id === l.id);
              return (
                <li key={l.id} className="mk-row">
                  <div className="mk-row-card"><MarketCard href={`/market/${l.id}`} c={{ ...l, shots: l.shots.map(shotUrl), sales: l.sales_count }} /></div>
                  <div className="mk-row-body">
                    <span className={`mk-badge ${cls}`}>{label}</span>
                    <b className="mk-row-title">{l.title}</b>
                    {l.review_note && <p className="mk-review">Note from our team: {l.review_note}</p>}
                    <dl className="mk-row-stats">
                      <div><dt>Price</dt><dd>{usd(l.price_cents)}</dd></div>
                      <div><dt>Sold</dt><dd>{l.sales_count}</dd></div>
                      <div><dt>Earned</dt><dd>{usd(sold.reduce((s, x) => s + x.seller_cents, 0))}</dd></div>
                    </dl>
                    <div className="mk-row-act">
                      {l.status === "uploading" && <Link href={`/market/sell?resume=${l.id}`} className="btn btn-hot">Finish the upload</Link>}
                      {l.status !== "uploading" && <Link href={`/market/sell?edit=${l.id}`} className="btn btn-ghost">Edit</Link>}
                      {l.status === "live" && <button className="btn btn-ghost" onClick={() => setStatus(l, "paused")}>Pause</button>}
                      {l.status === "paused" && <button className="btn btn-hot" onClick={() => setStatus(l, "live")}>Relist</button>}
                      {l.status === "rejected" && <button className="btn btn-hot" onClick={() => setStatus(l, "pending")}>Send for review again</button>}
                      <button className="btn btn-ghost" onClick={() => setRemoveAsk(l)}>Remove</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <div className="mk-empty"><p className="font-extrabold text-lg">You&apos;re not selling anything yet.</p><Link href="/market/sell" className="btn btn-hot mt-3">Sell your first clip</Link></div>)}

        {tab === "bought" && (bought.length ? (
          <ul className="mk-grid">
            {bought.map((l) => (
              <li key={l.id} className="mk-bought">
                <MarketCard href={`/market/${l.id}`} owned c={{ ...l, shots: l.shots.map(shotUrl) }} />
                <button className="btn btn-hot w-full mt-2" onClick={() => dl(l.id)}>⬇ Download</button>
              </li>
            ))}
          </ul>
        ) : <div className="mk-empty"><p className="font-extrabold text-lg">Nothing bought yet.</p><Link href="/market" className="btn btn-hot mt-3">Browse the market</Link></div>)}

        {tab === "messages" && (threads.length ? (
          <ul className="mk-convos">
            {threads.map((t) => {
              const iAmBuyer = t.buyer_id === user.id, other = names[iAmBuyer ? t.seller_id : t.buyer_id] ?? "Player";
              const isNew = new Date(t.last_at) > new Date(iAmBuyer ? t.buyer_seen_at : t.seller_seen_at);
              return (
                <li key={t.id} className={`mk-convo${isNew ? " is-new" : ""}`}>
                  <button onClick={() => setOpen(open === t.id ? null : t.id)}>
                    <span className="mk-seller-av" aria-hidden>{other.slice(0, 1).toUpperCase()}</span>
                    <span><b>{other}</b><small>{iAmBuyer ? "You asked about" : "Asking about"} <i>{titles[t.listing_id] ?? "a clip"}</i></small></span>
                    <time>{new Date(t.last_at).toLocaleDateString("en-US")}</time>
                  </button>
                  {open === t.id && (
                    <div className="mk-convo-body">
                      <Link href={`/market/${t.listing_id}`} className="text-sm font-bold underline">Open the listing</Link>
                      <Thread threadId={t.id} me={user.id} otherName={other} role={iAmBuyer ? "buyer" : "seller"} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <div className="mk-empty"><p className="font-extrabold text-lg">No conversations yet.</p><p className="text-haze">Questions you ask sellers, and questions buyers ask you, show up here.</p></div>)}
      </div>
    </div>
  );
}
