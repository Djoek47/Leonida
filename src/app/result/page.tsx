"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";
import { poolNow, type Pool } from "@/lib/api";
import { bracketFor } from "@/lib/tiers";

type Slot = { place: 1 | 2 | 3; amount_cents: number; clip_id: string; clip_title: string; creator: string; gamertag: string | null; platform: string | null; path: string | null; mine: boolean };
type Round = { id: string; title: string; period: string; announced_at: string; podium: Slot[] };
type Next = { title: string; announce_at: string } | null;

const COIN = { 1: "kingpin", 2: "hustler", 3: "street" } as const;
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Toronto" });

function useCountdown(to?: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!to) return;
    const t = () => setLeft(Math.max(0, new Date(to).getTime() - Date.now()));
    t(); const i = setInterval(t, 1000); return () => clearInterval(i);
  }, [to]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}

function CountUp({ to, money = false }: { to: number; money?: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 1400); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{money ? usd(v * 100).replace(/\.00$/, "") : v.toLocaleString("en-US")}</>;
}

function Countdown({ to }: { to: string }) {
  const c = useCountdown(to);
  if (!c) return <div className="res-count" aria-hidden style={{ minHeight: 76 }} />;
  const cell = (n: number, l: string) => <div><b className="display">{String(n).padStart(2, "0")}</b><span>{l}</span></div>;
  return <div className="res-count" role="timer" aria-label="Time until the next result">{cell(c.d, "days")}{cell(c.h, "hrs")}{cell(c.m, "min")}{cell(c.s, "sec")}</div>;
}

function Stage({ round }: { round: Round }) {
  const [url, setUrl] = useState<string | null>(null);
  const gold = round.podium.find((p) => p.place === 1);
  useEffect(() => {
    setUrl(null);
    const c = sb(); if (!c || !gold?.path) return;
    c.storage.from("clips").createSignedUrl(gold.path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [gold?.path]);
  const order = [2, 1, 3] as const; // silver left, gold centre, bronze right
  return (
    <div className="res-stage">
      <div className="res-podium">
        {order.map((pl) => {
          const s = round.podium.find((p) => p.place === pl);
          if (!s) return <div key={pl} className={`res-col p${pl}`} />;
          return (
            <div key={pl} className={`res-col p${pl}`} style={{ ["--d" as string]: `${pl === 1 ? 0.5 : pl === 2 ? 0.25 : 0}s` }}>
              <div className="res-coin">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/media/coins/${COIN[pl]}.webp`} alt="" /></div>
              <p className="res-name">{s.mine ? "You" : s.creator}</p>
              <p className="res-amt display">{usd(s.amount_cents)}</p>
              <div className="res-block"><span className="display">{pl}</span></div>
            </div>
          );
        })}
      </div>
      {gold && (
        <figure className="res-video">
          {url ? <video src={url} autoPlay muted loop playsInline controls preload="metadata" /> : <div className="res-video-ph" />}
          <figcaption><b>{gold.clip_title}</b><span>{gold.gamertag ? `${gold.gamertag} · ` : ""}{gold.platform ?? ""}</span></figcaption>
        </figure>
      )}
    </div>
  );
}

function Results() {
  const params = useSearchParams();
  const celebrate = Boolean(params.get("win"));
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [next, setNext] = useState<Next>(null);
  const [i, setI] = useState(0);
  const [pool, setPool] = useState<Pool | null>(null);
  const [entries, setEntries] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = sb(); if (!c) { setRounds([]); return; }
    c.rpc("public_results", { p_limit: 12 }).then(({ data }) => setRounds((data as Round[]) ?? []));
    c.rpc("next_announcement").then(({ data }) => setNext((data as Next) ?? null));
    c.rpc("browse_clips", { p_cat: "week", p_limit: 1 }).then(({ data }) => setEntries(((data as { total: number }[] | null)?.[0]?.total) ?? 0));
  }, []);
  useEffect(() => { poolNow().then(setPool); }, []);

  const live = bracketFor(pool?.paying_users ?? 0);
  const paidOut = useMemo(() => (rounds ?? []).reduce((n, r) => n + r.podium.reduce((m, p) => m + p.amount_cents, 0), 0), [rounds]);
  const round = rounds?.[i];
  const mine = useMemo(() => round?.podium.find((p) => p.mine), [round]);

  return (
    <div className="res">
      {celebrate && <Confetti count={60} />}
      <section className="res-hero">
        <p className="res-pill">Clip of the Week</p>
        <h1 className="display res-h1">Results</h1>
        {next ? <><p className="res-sub">Next winners announced in</p><Countdown to={next.announce_at} /></>
               : <p className="res-sub">Winners are announced every Thursday at 1:00pm Eastern</p>}
      </section>

      <section className="res-stats" aria-label="Live numbers">
        <div><b className="display"><CountUp to={Math.round(live.pool)} money /></b><span>This week&apos;s pool</span></div>
        <div><b className="display">{entries === null ? "–" : <CountUp to={entries} />}</b><span>Clips in the running</span></div>
        <div><b className="display">{rounds === null ? "–" : <CountUp to={Math.round(paidOut / 100)} money />}</b><span>Paid to winners</span></div>
        <div><b className="display">{rounds === null ? "–" : <CountUp to={rounds.length} />}</b><span>Rounds announced</span></div>
      </section>

      <section className="res-grab" aria-label="Up for grabs this week">
        <p className="res-sub">Up for grabs this week</p>
        <div className="res-grab-row">
          {([[2, "hustler", live.silver], [1, "kingpin", live.gold], [3, "street", live.bronze]] as const).map(([pl, coin, amt]) => (
            <div key={pl} className={`res-grab-c p${pl}`}>
              <div className="res-coin">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/media/coins/${coin}.webp`} alt="" /></div>
              <b className="display">${amt}</b>
            </div>
          ))}
        </div>
        <Link href="/submit" className="btn btn-hot mt-5">Send a clip</Link>
      </section>

      {rounds === null && <p className="res-empty">Loading…</p>}
      {rounds?.length === 0 && <p className="res-empty">The first winners will appear here after the next announcement.</p>}

      {round && (
        <section ref={stage} className="res-main">
          <div className="res-title">
            <h2 className="display">{round.title}</h2>
            <span>{when(round.announced_at)}</span>
          </div>
          {mine && (
            <p className="res-mine">You placed {mine.place === 1 ? "1st" : mine.place === 2 ? "2nd" : "3rd"} · {usd(mine.amount_cents)}. <Link href="/wallet">Wallet</Link></p>
          )}
          <Stage round={round} />
        </section>
      )}

      {rounds && rounds.length > 1 && (
        <section className="res-history" aria-label="Past results">
          {rounds.map((r, k) => (
            <button key={r.id} onClick={() => { setI(k); stage.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className={`res-chip${k === i ? " on" : ""}`} aria-pressed={k === i}>
              <span>{when(r.announced_at)}</span><b>{r.title}</b>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

export default function Result() { return <Suspense><Results /></Suspense>; }
