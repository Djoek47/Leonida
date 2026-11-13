"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { Confetti } from "@/components/Confetti";

type Win = { id: string; place: 1 | 2 | 3; amount_cents: number; status: string; round: string; period: string; clip_title: string };
const COIN = { 1: "kingpin", 2: "hustler", 3: "street" } as const;
const PLACE = { 1: "1st place", 2: "2nd place", 3: "3rd place" } as const;
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Shown once, the first time a winner opens the site after the result is announced. */
export function WinCelebration() {
  const { user, demo, loading } = useUser();
  const router = useRouter();
  const path = usePathname();
  const [win, setWin] = useState<Win | null>(null);
  const [shown, setShown] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (loading || demo || !user) return;
    const c = sb(); if (!c) return;
    c.rpc("my_unseen_win").then(({ data }) => { if (data && (data as Win).id) setWin(data as Win); });
  }, [user, loading, demo]);

  // the prize ticks up to its amount
  useEffect(() => {
    if (!win) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(win.amount_cents); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0 - 900) / 1600); setShown(Math.round(win.amount_cents * Math.max(0, 1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [win]);

  function done(to?: string) {
    if (!win) return;
    sb()?.rpc("ack_win", { p_id: win.id });
    const id = win.id; setWin(null);
    if (to) router.push(to.replace("{id}", id));
  }
  useEffect(() => {
    if (!win) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") done(); };
    document.addEventListener("keydown", esc); return () => document.removeEventListener("keydown", esc);
  });

  if (!mounted || !win || path?.startsWith("/result/you")) return null;
  const inWallet = win.status === "sent";
  return createPortal(
    <div className="win-wrap" role="dialog" aria-modal="true" aria-labelledby="win-h">
      <Confetti count={70} />
      <div className="win-card">
        <div className="win-coin" aria-hidden>
          <div className="win-flip">{/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/coins/${COIN[win.place]}.webp`} alt="" /></div>
        </div>
        <p className="win-k">{PLACE[win.place]} · {win.round}</p>
        <h2 id="win-h" className="win-h display">You won!</h2>
        <p className="win-sub">What a clip. Congratulations.</p>
        <p className="win-amt display" aria-live="polite">{usd(shown)}</p>
        <dl className="win-receipt">
          <div><dt>Round</dt><dd>{win.round}</dd></div>
          <div><dt>Clip</dt><dd>{win.clip_title}</dd></div>
          <div><dt>How</dt><dd>Voted {PLACE[win.place]} by the community</dd></div>
          <div><dt>Prize</dt><dd>{usd(win.amount_cents)}</dd></div>
          <div><dt>Status</dt><dd>{inWallet ? "In your wallet" : "Add your payout details and it's on its way"}</dd></div>
        </dl>
        <div className="win-actions">
          <button className="btn btn-hot" onClick={() => done("/result/you")}>See the results</button>
          <button className="btn btn-ghost" onClick={() => done(inWallet ? "/wallet" : "/wallet#payout")}>{inWallet ? "Open my wallet" : "Add payout details"}</button>
        </div>
      </div>
    </div>, document.body);
}
