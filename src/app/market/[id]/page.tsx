"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { lockScroll } from "@/lib/scrollLock";
import { ClipEmblem } from "@/components/ClipEmblem";
import { Thread } from "@/components/market/Thread";
import { LISTING_COLS, feeFor, mmss, quality, shotUrl, size, tagLabel, themeOf, usd, type Listing, type Seller } from "@/lib/market";

async function post(url: string, body: object) {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ error: "Something went wrong." }));
}

type ThreadRow = { id: string; buyer_id: string; last_at: string; seller_seen_at: string };

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useUser();
  const [l, setL] = useState<Listing | null | undefined>(undefined);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [owned, setOwned] = useState(false);
  const [shot, setShot] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState<string | null>(null);
  const [inbox, setInbox] = useState<(ThreadRow & { name: string })[]>([]);
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [bought, setBought] = useState(false);

  useEffect(() => { if (typeof window !== "undefined") setBought(new URLSearchParams(location.search).has("bought")); }, []);
  const load = useCallback(async () => {
    const c = sb(); if (!c) { setL(null); return; }
    const { data } = await c.from("market_listings").select(LISTING_COLS).eq("id", id).maybeSingle();
    setL((data as Listing) ?? null);
    if (data) {
      const { data: s } = await c.from("market_sellers").select("*").eq("id", data.seller_id).maybeSingle();
      if (s) setSeller(s as Seller);
      else { const { data: p } = await c.from("profiles").select("gamertag, display_name").eq("id", data.seller_id).maybeSingle(); setSeller({ id: data.seller_id, name: p?.gamertag || p?.display_name || "Player", verified: null, avatar_path: null, sales: 0 }); }
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const mine = Boolean(user && l && user.id === l.seller_id);
  useEffect(() => {
    if (!user || !l) return;
    const c = sb()!;
    c.from("market_purchases").select("id").eq("listing_id", l.id).eq("buyer_id", user.id).maybeSingle().then(({ data }) => setOwned(Boolean(data)));
    if (mine) {
      c.from("market_threads").select("id, buyer_id, last_at, seller_seen_at").eq("listing_id", l.id).order("last_at", { ascending: false }).then(async ({ data }) => {
        const rows = (data ?? []) as ThreadRow[];
        const ids = rows.map((r) => r.buyer_id);
        const { data: names } = ids.length ? await c.from("profiles").select("id, gamertag, display_name").in("id", ids) : { data: [] };
        setInbox(rows.map((r) => ({ ...r, name: names?.find((n) => n.id === r.buyer_id)?.gamertag || names?.find((n) => n.id === r.buyer_id)?.display_name || "Buyer" })));
      });
    } else {
      c.from("market_threads").select("id").eq("listing_id", l.id).eq("buyer_id", user.id).maybeSingle().then(({ data }) => setThread(data?.id ?? null));
    }
  }, [user, l, mine]);
  // After Stripe sends the buyer back, the webhook may take a moment: check again.
  useEffect(() => {
    if (!bought || owned || !user || !l) return;
    const i = setInterval(() => sb()?.from("market_purchases").select("id").eq("listing_id", l.id).eq("buyer_id", user.id).maybeSingle().then(({ data }) => data && setOwned(true)), 2500);
    return () => clearInterval(i);
  }, [bought, owned, user, l]);
  useEffect(() => { if (!zoom) return; const undo = lockScroll(); const k = (e: KeyboardEvent) => { if (e.key === "Escape") setZoom(false); if (e.key === "ArrowRight") setShot((s) => (s + 1) % 5); if (e.key === "ArrowLeft") setShot((s) => (s + 4) % 5); }; addEventListener("keydown", k); return () => { removeEventListener("keydown", k); undo(); }; }, [zoom]);

  const buy = async () => {
    if (!user) { location.href = `/login?next=/market/${id}`; return; }
    setBusy(true); setMsg("");
    const r = await post("/api/market/buy", { listingId: id });
    if (r.checkout) { location.href = r.checkout; return; }
    if (r.owned) { setOwned(true); setMsg("It's yours. Download it below."); }
    else setMsg(r.error ?? "Couldn't start the checkout.");
    setBusy(false);
  };
  const download = async () => {
    setBusy(true); setMsg("");
    const r = await post("/api/market/download", { listingId: id });
    setBusy(false);
    if (r.url) location.href = r.url; else setMsg(r.error ?? "Couldn't get the file.");
  };
  const ask = async () => {
    if (!user) { location.href = `/login?next=/market/${id}`; return; }
    const { data, error } = await sb()!.from("market_threads").insert({ listing_id: id, buyer_id: user.id, seller_id: l!.seller_id }).select("id").single();
    if (error) { setMsg(error.message.includes("duplicate") ? "" : "Couldn't open the chat."); const { data: t } = await sb()!.from("market_threads").select("id").eq("listing_id", id).eq("buyer_id", user.id).maybeSingle(); setThread(t?.id ?? null); return; }
    setThread(data.id);
  };

  if (l === undefined || loading) return <div className="mk-page"><p className="mk-wrap py-20 font-bold" role="status">Loading the clip…</p></div>;
  if (!l) return (
    <div className="mk-page"><div className="mk-wrap py-20 text-center">
      <p className="display text-4xl">That clip isn&apos;t on the market.</p>
      <p className="text-haze mt-2">It may have sold out, been taken down or still be in review.</p>
      <Link href="/market" className="btn btn-hot mt-5">Back to the market</Link>
    </div></div>
  );

  const t = themeOf(l.theme), shots = l.shots.map(shotUrl), fee = feeFor(l.price_cents);
  const live = l.status === "live";
  return (
    <div className="mk-page" style={{ "--tone": t.tone } as React.CSSProperties}>
      <div className="mk-wrap mk-detail">
        <nav className="mk-crumbs"><Link href="/market">Clip Market</Link><span>›</span><span>{tagLabel(l.tags[0])}</span></nav>
        {!live && <p className="mk-status">This listing is <b>{l.status === "pending" ? "waiting for review" : l.status === "uploading" ? "still uploading" : l.status}</b>{l.review_note ? `: ${l.review_note}` : ""}. Only you{mine ? "" : " and admins"} can see it.</p>}

        <div className="mk-detail-grid">
          <section className="mk-gallery" aria-label="Screenshots">
            <button className="mk-stage" onClick={() => setZoom(true)} aria-label="Open screenshots full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shots[shot]} alt={`Screenshot ${shot + 1} of 5 from ${l.title}`} />
              <ClipEmblem id={l.emblem} className="mk-stage-mark" />
              <span className="mk-stage-lock">{owned || mine ? "✓ You have the full video" : "🔒 The video unlocks when you buy it"}</span>
              <span className="mk-stage-n">{shot + 1} / 5 · tap to enlarge</span>
            </button>
            <div className="mk-thumbs">
              {shots.map((s, i) => (
                <button key={i} onClick={() => setShot(i)} className={i === shot ? "is-on" : ""} aria-label={`Screenshot ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s} alt="" loading="lazy" />
                </button>
              ))}
            </div>

            <div className="mk-about">
              <div className="mk-about-tags">{l.tags.map((x) => <span key={x} className="mk-pill"><ClipEmblem id={x} className="mk-pill-ico" />{tagLabel(x)}</span>)}</div>
              <h1 className="mk-d-title">{l.title}</h1>
              <p className="mk-d-desc">{l.description}</p>
              {l.highlights.length > 0 && (
                <>
                  <h2 className="mk-h">What happens</h2>
                  <ol className="mk-beats">{l.highlights.map((h, i) => <li key={i}><span>{i + 1}</span>{h}</li>)}</ol>
                </>
              )}
            </div>
          </section>

          <aside className="mk-side">
            <div className="mk-buy">
              <div className="mk-buy-price"><span className="mk-k">Full video</span><b>{usd(l.price_cents)}</b><small>one-time · yours to keep</small></div>
              <dl className="mk-specs">
                <div><dt>Length</dt><dd>{mmss(l.duration_s)}</dd></div>
                <div><dt>Quality</dt><dd>{quality(l.width, l.height)}</dd></div>
                <div><dt>File</dt><dd>{size(l.size_bytes)}</dd></div>
                <div><dt>Sold</dt><dd>{l.sales_count}</dd></div>
              </dl>
              {mine ? (
                <>
                  <button className="btn btn-hot w-full" onClick={download} disabled={busy}>Download your file</button>
                  <Link href={`/market/sell?edit=${l.id}`} className="btn btn-ghost w-full mt-2">Edit the listing</Link>
                </>
              ) : owned ? (
                <button className="btn btn-hot w-full mk-dl" onClick={download} disabled={busy}>⬇ Download the full video</button>
              ) : live ? (
                <>
                  <button className="btn btn-hot w-full mk-buy-btn" onClick={buy} disabled={busy}>{busy ? "Opening checkout…" : `Buy for ${usd(l.price_cents)}`}</button>
                  <p className="mk-split">{usd(l.price_cents - fee)} goes to {seller?.name ?? "the seller"}. Card payment by Stripe.</p>
                </>
              ) : <p className="mk-split">Not for sale right now.</p>}
              {bought && !owned && <p className="mk-note" role="status">Payment received. Unlocking your download…</p>}
              {msg && <p className="mk-note" role="status">{msg}</p>}
            </div>

            <div className="mk-seller">
              <span className="mk-seller-av" aria-hidden>{(seller?.name ?? "P").slice(0, 1).toUpperCase()}</span>
              <div><span className="mk-k">Sold by</span><b>{seller?.name ?? "…"}{seller?.verified ? <span className="mk-ver" title="Verified gamertag">✓</span> : null}</b><small>{seller?.sales ?? 0} clip{seller?.sales === 1 ? "" : "s"} sold on the market</small></div>
            </div>

            {mine ? (
              <div className="mk-chat">
                <p className="mk-h">Questions from buyers</p>
                {!inbox.length && <p className="text-sm text-haze">No questions yet. They show up here and in My clips.</p>}
                <ul className="mk-inbox">
                  {inbox.map((r) => (
                    <li key={r.id}>
                      <button onClick={() => setOpenThread(openThread === r.id ? null : r.id)} className={new Date(r.last_at) > new Date(r.seller_seen_at) ? "is-new" : ""}>
                        <b>{r.name}</b><small>{new Date(r.last_at).toLocaleDateString()}</small>
                      </button>
                      {openThread === r.id && user && <Thread threadId={r.id} me={user.id} otherName={r.name} role="seller" />}
                    </li>
                  ))}
                </ul>
              </div>
            ) : live || owned ? (
              <div className="mk-chat">
                <p className="mk-h">Ask {seller?.name ?? "the seller"}</p>
                {thread && user ? <Thread threadId={thread} me={user.id} otherName={seller?.name ?? "the seller"} role="buyer" />
                  : <button className="btn btn-ghost w-full" onClick={ask}>💬 Ask a question before you buy</button>}
              </div>
            ) : null}

            <ul className="mk-trust">
              <li><b>Reviewed</b> Every listing is checked by our team before it goes live.</li>
              <li><b>Locked</b> Nobody can stream or copy the video before buying it.</li>
              <li><b>Problem?</b> If the file isn&apos;t what was described, <Link href="/support" className="underline">tell us</Link> and we&apos;ll sort it out.</li>
            </ul>
          </aside>
        </div>
      </div>

      {zoom && (
        <div className="mk-zoom" role="dialog" aria-modal="true" aria-label="Screenshots" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shots[shot]} alt={`Screenshot ${shot + 1}`} onClick={(e) => { e.stopPropagation(); setShot((s) => (s + 1) % 5); }} />
          <button className="mk-zoom-x" onClick={() => setZoom(false)} aria-label="Close">✕</button>
          <p>{shot + 1} / 5 · tap the picture for the next one</p>
        </div>
      )}
    </div>
  );
}
