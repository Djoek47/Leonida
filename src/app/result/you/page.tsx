"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { Confetti } from "@/components/Confetti";

type Res = {
  contest_id: string; round: string; period: string; announced_at: string; entries: number;
  win: { id: string; place: 1 | 2 | 3; amount_cents: number; status: string; clip_title: string } | null;
  mine: { title: string; views: number; path: string | null } | null;
  podium: { place: 1 | 2 | 3; title: string; creator: string }[];
};
const MEDAL = {
  1: { name: "Gold", coin: "kingpin", tone: "gold", line: "Leonida picked yours over every other clip." },
  2: { name: "Silver", coin: "hustler", tone: "silver", line: "Second out of everything sent in this week." },
  3: { name: "Bronze", coin: "street", tone: "bronze", line: "On the podium. Top three in Leonida." },
} as const;
const ORD = ["", "1st", "2nd", "3rd"];
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const DEMO: Record<string, Res> = Object.fromEntries([1, 2, 3, 0].map((p) => [String(p), {
  contest_id: "demo", round: "Week of Nov 19", period: "week", announced_at: new Date().toISOString(), entries: 42,
  win: p ? { id: "demo", place: p as 1 | 2 | 3, amount_cents: [0, 1500, 625, 375][p], status: "unclaimed", clip_title: "Airboat through the billboard" } : null,
  mine: { title: "Airboat through the billboard", views: 1318, path: null },
  podium: [{ place: 1, title: "Airboat through the billboard", creator: "SwampSaint" }, { place: 2, title: "Keys bridge jump", creator: "KeysKingpin" }, { place: 3, title: "Squalo stunt off the marina", creator: "MarinaMenace" }],
}]));

function Tick({ to, money, start }: { to: number; money?: boolean; start: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 1800); setV(Math.round(to * (1 - Math.pow(1 - k, 4)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [to, start]);
  return <>{money ? usd(v) : v.toLocaleString("en-US")}</>;
}

function Reveal() {
  const q = useSearchParams();
  const { user, loading } = useUser();
  const [res, setRes] = useState<Res | null | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const demo = q.get("demo");
    const c = sb();
    if (demo !== null && (!c || process.env.NODE_ENV !== "production")) { setRes(DEMO[demo] ?? DEMO["1"]); return; }
    if (!c) { setRes(DEMO["1"]); return; }
    if (loading || !user) { if (!loading) setRes(null); return; }
    c.rpc("my_round_result", { p_contest: q.get("c") && q.get("c") !== "demo" ? q.get("c") : null }).then(({ data }) => setRes((data as Res) ?? null));
  }, [q, user, loading]);

  // The envelope opens itself after a beat; tapping opens it sooner.
  useEffect(() => { if (!res) return; const t = setTimeout(() => setOpen(true), 2600); return () => clearTimeout(t); }, [res]);
  useEffect(() => { if (open && res?.win && res.contest_id !== "demo") sb()?.rpc("ack_win", { p_id: res.win.id }); }, [open, res]);

  const m = res?.win ? MEDAL[res.win.place] : null;
  const tone = m?.tone ?? "field";
  const coinSrc = `/media/coins/${m?.coin ?? "free"}.webp`;
  const share = useMemo(() => res?.win ? `${ORD[res.win.place]} place in ${res.round} on Live From Leonida` : "", [res]);

  if (res === undefined) return <div className="yr yr-field"><p className="yr-wait">Opening your result…</p></div>;
  if (res === null) return (
    <div className="yr yr-field"><div className="yr-inner">
      <p className="yr-k">Results</p>
      <h1 className="display yr-h">{user ? "No result for you yet" : "Sign in to see your result"}</h1>
      <p className="yr-p">{user ? "Enter a clip in this week's round and your result lands here on Thursday at 1:00pm Eastern." : "Your personal result is waiting behind your account."}</p>
      <Link href={user ? "/submit" : "/login?next=/result/you"} className="btn btn-hot mt-6">{user ? "Send a clip" : "Sign in"}</Link>
      <Link href="/result" className="yr-link">See everyone&apos;s results</Link>
    </div></div>
  );

  return (
    <div className={`yr yr-${tone}${open ? " is-open" : ""}`}>
      <div className="yr-beams" aria-hidden><i /><i /><i /></div>
      <div className="yr-rays" aria-hidden />
      {open && res.win && <Confetti count={res.win.place === 1 ? 90 : 60} />}

      <div className="yr-inner">
        <p className="yr-k">{res.round} · Results</p>

        <button className="yr-coin" onClick={() => setOpen(true)} aria-label={open ? "Your medal" : "Reveal your result"} disabled={open}>
          <span className="yr-coin-3d">
            <span className="yr-face yr-back" aria-hidden><span className="yr-q">?</span></span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="yr-face yr-front" src={coinSrc} alt="" />
          </span>
          <span className="yr-flash" aria-hidden />
        </button>

        {!open ? (
          <p className="yr-tap">The votes are counted. <b>Tap to reveal.</b></p>
        ) : res.win && m ? (
          <div className="yr-reveal" aria-live="polite">
            <p className="yr-place">{ORD[res.win.place].toUpperCase()} PLACE · {m.name.toUpperCase()}</p>
            <h1 className="display yr-h">{res.win.place === 1 ? "You won." : "You made the podium."}</h1>
            <p className="yr-amt display"><Tick to={res.win.amount_cents} money start={open} /></p>
            <p className="yr-p">{m.line}</p>
            <dl className="yr-receipt">
              <div><dt>Clip</dt><dd>{res.win.clip_title}</dd></div>
              <div><dt>Round</dt><dd>{res.round}</dd></div>
              <div><dt>Field</dt><dd>{res.entries} clips</dd></div>
              <div><dt>Prize</dt><dd>{usd(res.win.amount_cents)}</dd></div>
              <div><dt>Status</dt><dd>{res.win.status === "sent" ? "In your wallet" : "Waiting for your payout details"}</dd></div>
            </dl>
            <div className="yr-actions">
              <Link href={res.win.status === "sent" ? "/wallet" : "/wallet#payout"} className="btn btn-hot">{res.win.status === "sent" ? "Open my wallet" : "Claim my prize"}</Link>
              <Link href="/result" className="btn btn-ghost">See the full results</Link>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button className="btn btn-ghost" onClick={() => navigator.share({ title: "Live From Leonida", text: share, url: "https://www.livefromleonida.com/result" }).catch(() => {})}>Share it</button>
              )}
            </div>
          </div>
        ) : (
          <div className="yr-reveal" aria-live="polite">
            <p className="yr-place">IN THE RUNNING</p>
            <h1 className="display yr-h">Not the podium this time.</h1>
            <p className="yr-p">{res.mine ? <>Your clip <b>{res.mine.title}</b> went up against {res.entries} clips this week. Its views stay with it, and it keeps earning from downloads.</> : <>This round had {res.entries} clips in it.</>}</p>
            <div className="yr-stats">
              <div><b className="display"><Tick to={res.entries} start={open} /></b><span>Clips in the round</span></div>
              <div><b className="display"><Tick to={res.mine?.views ?? 0} start={open} /></b><span>Your views</span></div>
            </div>
            {res.podium.length > 0 && (
              <ol className="yr-podium">
                {res.podium.map((p) => (
                  <li key={p.place}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/coins/${MEDAL[p.place].coin}.webp`} alt="" />
                    <span><b>{p.title}</b><small>by {p.creator}</small></span>
                    <em>{ORD[p.place]}</em>
                  </li>
                ))}
              </ol>
            )}
            <div className="yr-actions">
              <Link href="/submit" className="btn btn-hot">Send your next clip</Link>
              <Link href="/result" className="btn btn-ghost">See the full results</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><Reveal /></Suspense>; }
