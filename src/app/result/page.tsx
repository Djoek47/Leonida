"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { Confetti } from "@/components/Confetti";

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
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = sb(); if (!c) { setRounds([]); return; }
    c.rpc("public_results", { p_limit: 12 }).then(({ data }) => setRounds((data as Round[]) ?? []));
    c.rpc("next_announcement").then(({ data }) => setNext((data as Next) ?? null));
  }, []);

  const round = rounds?.[i];
  const mine = useMemo(() => round?.podium.find((p) => p.mine), [round]);

  return (
    <div className="res">
      {celebrate && <Confetti count={60} />}
      <section className="res-hero">
        <p className="res-k">Clip of the Week</p>
        <h1 className="display res-h1">RESULT</h1>
        {next && <><p className="res-sub">Next winners</p><Countdown to={next.announce_at} /></>}
      </section>

      {rounds === null && <p className="res-empty">Loading…</p>}
      {rounds?.length === 0 && (
        <section className="res-emptybox">
          <div className="res-coin big">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/media/coins/kingpin.webp" alt="" /></div>
          <p className="display">First winners land Thursday</p>
          <Link href="/submit" className="btn btn-hot">Send a clip</Link>
        </section>
      )}

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
