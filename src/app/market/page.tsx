"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { ClipEmblem } from "@/components/ClipEmblem";
import { MarketCard } from "@/components/market/MarketCard";
import { LISTING_COLS, TAGS, shotUrl, type Listing, type MarketTag, type Seller } from "@/lib/market";

/** Clip Market: every live listing as a shop card. Filter by tag, price and length. */
type Sort = "new" | "popular" | "low" | "high";

export default function Market() {
  const { user } = useUser();
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [sellers, setSellers] = useState<Record<string, Seller>>({});
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState<MarketTag | "all">("all");
  const [q, setQ] = useState("");
  const [max, setMax] = useState(2000);
  const [sort, setSort] = useState<Sort>("new");

  useEffect(() => {
    const c = sb(); if (!c) { setRows([]); return; }
    c.from("market_listings").select(LISTING_COLS).eq("status", "live").order("approved_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows((data ?? []) as Listing[]));
    c.from("market_sellers").select("*").then(({ data }) => setSellers(Object.fromEntries(((data ?? []) as Seller[]).map((s) => [s.id, s]))));
  }, []);
  useEffect(() => {
    if (!user) return;
    sb()?.from("market_purchases").select("listing_id").eq("buyer_id", user.id).then(({ data }) => setOwned(new Set((data ?? []).map((d) => d.listing_id as string))));
  }, [user]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = (rows ?? []).filter((l) => (tag === "all" || l.tags.includes(tag)) && l.price_cents <= max
      && (!t || `${l.title} ${l.description} ${sellers[l.seller_id]?.name ?? ""}`.toLowerCase().includes(t)));
    return r.sort((a, b) => sort === "popular" ? b.sales_count - a.sales_count : sort === "low" ? a.price_cents - b.price_cents : sort === "high" ? b.price_cents - a.price_cents : 0);
  }, [rows, tag, q, max, sort, sellers]);
  const count = (t: MarketTag) => (rows ?? []).filter((l) => l.tags.includes(t)).length;

  return (
    <div className="mk-page">
      <section className="mk-hero">
        <div className="mk-hero-in">
          <p className="mk-kick">New · Player-made, player-sold</p>
          <h1 className="mk-title">Clip <span>Market</span></h1>
          <p className="mk-sub">Players sell their best GTA VI moments, full length and full quality. Look at the screenshots, ask the seller anything, then buy and download.</p>
          <div className="mk-hero-cta">
            <Link href="/market/sell" className="btn btn-hot">Sell a clip</Link>
            <Link href={user ? "/market/mine" : "/login?next=/market/mine"} className="btn btn-ghost mk-ghost">My clips and messages</Link>
            <Link href="/market/rules" className="btn btn-ghost mk-ghost">Rules and refunds</Link>
          </div>
        </div>
        <ol className="mk-steps">
          {[["🖼", "Peek", "5 screenshots + what happens"], ["💬", "Ask", "Chat with the seller first"], ["⬇", "Own it", "$1–$20, full file, yours"]].map(([i, h, p], k) => (
            <li key={h} style={{ animationDelay: `${k * 0.12}s` }}><span className="mk-step-i" aria-hidden>{i}</span><span className="mk-step-n">{k + 1}</span><b>{h}</b><small>{p}</small></li>
          ))}
        </ol>
      </section>

      <div className="mk-wrap">
        <div className="mk-tags" role="tablist" aria-label="Filter by tag">
          <button role="tab" aria-selected={tag === "all"} className={`mk-tag${tag === "all" ? " is-on" : ""}`} onClick={() => setTag("all")}>
            <span className="mk-tag-ico mk-tag-all">★</span><b>All clips</b><small>{rows?.length ?? 0}</small>
          </button>
          {TAGS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tag === t.id} className={`mk-tag${tag === t.id ? " is-on" : ""}`} onClick={() => setTag(t.id)}>
              <ClipEmblem id={t.id} className="mk-tag-ico" /><b>{t.label}</b><small>{count(t.id)}</small>
            </button>
          ))}
        </div>

        <div className="mk-bar">
          <label className="mk-search"><span aria-hidden>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, descriptions, sellers" aria-label="Search the market" /></label>
          <label className="mk-max"><span>Up to <b>${max / 100}</b></span><input type="range" min={100} max={2000} step={100} value={max} onChange={(e) => setMax(Number(e.target.value))} aria-label="Maximum price" /></label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="mk-sort" aria-label="Sort">
            <option value="new">Newest</option><option value="popular">Best selling</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
          </select>
        </div>

        {rows === null ? <p className="mk-empty" role="status">Opening the market…</p> : list.length ? (
          <ul className="mk-grid">
            {list.map((l) => (
              <li key={l.id}>
                <MarketCard href={`/market/${l.id}`} owned={owned.has(l.id)}
                  c={{ ...l, shots: l.shots.map(shotUrl), seller: sellers[l.seller_id]?.name, sales: l.sales_count }} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mk-empty">
            <ClipEmblem id={tag === "all" ? "scenic" : tag} className="mk-empty-ico" />
            <p className="font-extrabold text-lg">{rows.length ? "Nothing matches those filters." : "The market just opened."}</p>
            <p className="text-haze">{rows.length ? "Try another tag or a higher price." : "Be the first to put a clip up for sale."}</p>
            <Link href="/market/sell" className="btn btn-hot mt-3">Sell a clip</Link>
          </div>
        )}

        <section className="mk-sell-band">
          <div>
            <h2 className="display text-4xl">Got a clip worth paying for?</h2>
            <p className="text-haze mt-1 max-w-xl">Set your own price from $1 to $20. Files up to 5 GB. You keep 80% of every sale (we keep at least 50¢ to cover card fees), paid into your wallet.</p>
          </div>
          <Link href="/market/sell" className="btn btn-hot">Start selling</Link>
        </section>
      </div>
    </div>
  );
}
