"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { MAX_STARS, STAR_MONTHS, tierById } from "@/lib/tiers";
import type { Account } from "@/lib/useUser";

/** Six stars, one every four months subscribed, all six at two years. */
export function StarRank({ stars, className = "" }: { stars: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img"
      aria-label={`${stars} of ${MAX_STARS} subscription stars`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-4" aria-hidden
          fill={i < stars ? "var(--mango)" : "none"} stroke="var(--mango)" strokeWidth="1.5">
          <path d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9z" />
        </svg>
      ))}
    </span>
  );
}

/** Upload every day. Two clear days and the run is gone. */

type Progress = { clips: number; next_at: number | null; next_label: string | null };

/** Clipper badges move with uploads and nothing else. */
export function ClipperProgress({ fallback }: { fallback: Progress }) {
  const [p, setP] = useState<Progress>(fallback);
  useEffect(() => {
    const c = sb(); if (!c) return;
    c.from("my_badge_progress").select("*").maybeSingle().then(({ data }) => data && setP(data as Progress));
  }, []);
  const pct = p.next_at ? Math.min(100, Math.round((p.clips / p.next_at) * 100)) : 100;
  return (
    <div className="rounded-xl border-2 border-line bg-ink p-5">
      <p className="text-sm font-bold text-haze">Clipper badge</p>
      <p className="display text-5xl leading-none mt-1">{p.clips}<span className="text-xl text-haze"> clips</span></p>
      {p.next_at ? (
        <>
          <div className="mt-4 h-3 rounded-full bg-ink-2 overflow-hidden" role="progressbar"
            aria-valuenow={p.clips} aria-valuemin={0} aria-valuemax={p.next_at}
            aria-label={`Progress to ${p.next_label}`}>
            <div className="h-full rounded-full bg-gulf transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm font-semibold">
            {p.next_at - p.clips} more for <span className="text-gulf">{p.next_label}</span>
          </p>
        </>
      ) : <p className="mt-3 text-sm font-semibold text-gulf">Every Clipper badge earned.</p>}
      <p className="mt-2 text-xs text-haze">Only uploads move this. Votes and downloads don&apos;t.</p>
    </div>
  );
}

export type Badge = { id: string; label: string; blurb: string; earned: boolean };

/** One badge as a struck coin. Placements are gold, silver or bronze;
 *  Clipper badges are green enamel; a Daily Drop win is red. Locked ones
 *  are a dark blank with a keyhole. */
function BadgeCoin({ id, earned }: { id: string; earned: boolean }) {
  const metal = /_gold$/.test(id) ? ["#fff3b0", "#f0b429", "#8a5a00"]
    : /_silver$/.test(id) ? ["#ffffff", "#c3ccd6", "#5d6b7a"]
    : /_bronze$/.test(id) ? ["#ffd2a8", "#c07a3a", "#6b3a12"]
    : id === "drop_winner" ? ["#ffb3b3", "#d1263a", "#6e0d18"]
    : ["#b7f0cf", "#1f9d63", "#0b4a2d"];
  const mark = id.startsWith("year") ? "Y" : id.startsWith("month") ? "M" : id.startsWith("week") ? "W"
    : id === "drop_winner" ? "D" : id.replace("clipper_", "");
  const u = `bc-${id}`;
  if (!earned) return (
    <svg viewBox="0 0 64 64" className="badge-coin is-locked" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="32" cy="28" r="5" fill="rgba(255,255,255,.22)" /><path d="M29 31h6l2 12h-10z" fill="rgba(255,255,255,.22)" />
    </svg>
  );
  return (
    <svg viewBox="0 0 64 64" className="badge-coin" aria-hidden>
      <defs>
        <linearGradient id={u} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={metal[0]} /><stop offset=".55" stopColor={metal[1]} /><stop offset="1" stopColor={metal[2]} /></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${u})`} />
      <circle cx="32" cy="32" r="23" fill="none" stroke={metal[2]} strokeWidth="1.5" strokeDasharray="1.5 3" />
      <circle cx="32" cy="32" r="20" fill={metal[1]} stroke={metal[0]} strokeWidth="1.5" />
      <text x="32" y={mark.length > 2 ? 37 : 39} textAnchor="middle" fontFamily="Arial Black,Arial" fontWeight="900"
        fontSize={mark.length > 2 ? 14 : 18} fill={metal[2]}>{mark}</text>
      <path d="M14 22a20 20 0 0 1 22-12" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** The trophy case: lit glass shelves, earned coins on display, the rest
 *  waiting as blanks. Grouped the way they're won. */
export function BadgeWall({ badges }: { badges: Badge[] }) {
  const got = badges.filter((b) => b.earned).length;
  const shelves: [string, (b: Badge) => boolean][] = [
    ["Clipper", (b) => b.id.startsWith("clipper")],
    ["Daily Drop", (b) => b.id === "drop_winner"],
  ];
  return (
    <div className="trophy-case">
      <div className="trophy-head">
        <h3 className="display text-3xl">Badges</h3>
        <p className="trophy-count"><b>{got}</b> / {badges.length}</p>
      </div>
      {shelves.map(([name, test]) => {
        const row = badges.filter(test);
        if (!row.length) return null;
        return (
          <div key={name} className="trophy-shelf">
            <p className="trophy-label">{name}</p>
            <ul>
              {row.map((b) => (
                <li key={b.id} className={b.earned ? "is-earned" : "is-locked"} title={b.earned ? b.blurb : `Locked: ${b.blurb}`}>
                  <BadgeCoin id={b.id} earned={b.earned} />
                  <span>{b.label}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Today's rotating challenge. Open to everyone; the winner gets a week in Trending. */
export type Drop = { id: string; theme: string; blurb: string | null; closes_at: string };

export function DailyDrop({ drop, look = "free" }: { drop: Drop; look?: string }) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(drop.closes_at).getTime() - Date.now();
      if (ms <= 0) { setLeft("closed"); return; }
      const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
      setLeft(`${h}h ${m}m left`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [drop.closes_at]);

  // A real road sign in fixed colours per plan, so it never inherits a
  // theme colour that washes the lettering out.
  return (
    <div className={`drop-sign drop-${look}`}>
      <span className="drop-bolt tl" /><span className="drop-bolt tr" /><span className="drop-bolt bl" /><span className="drop-bolt br" />
      <div className="drop-inner">
        <div className="min-w-0">
          <p className="drop-k"><span className="rec" aria-hidden />Daily Drop · {left}</p>
          <p className="drop-title">{drop.theme}</p>
          <p className="drop-blurb">{drop.blurb ?? "Open to everyone. The winner is featured in Trending for a full week."}</p>
        </div>
        <Link href="/submit" className="drop-cta">Enter today&apos;s drop →</Link>
      </div>
    </div>
  );
}


export function StarTracker({ stars, months }: { stars: number; months: number }) {
  const next = Math.min(MAX_STARS, stars + 1);
  const into = months % STAR_MONTHS;
  return (
    <div className="rounded-xl border-2 border-line bg-ink p-5">
      <p className="text-sm font-bold text-haze">Wanted level</p>
      <StarRank stars={stars} className="mt-2 [&_svg]:size-7" />
      <p className="mt-2 text-sm font-semibold">
        {stars >= MAX_STARS ? "Six stars. Two years on the force."
          : `${STAR_MONTHS - into} month${STAR_MONTHS - into === 1 ? "" : "s"} to star ${next}`}
      </p>
      <p className="mt-1 text-xs text-haze">One star every {STAR_MONTHS} months subscribed. All six at two years.</p>
    </div>
  );
}

/** Your private vote balance for this weekly round, in the brief's words. */
function VoteGauge() {
  const [b, setB] = useState<{ allowed: number; remaining: number; resets_at: string | null } | null>(null);
  useEffect(() => {
    const c = sb(); if (!c) { setB({ allowed: 6, remaining: 4, resets_at: null }); return; }
    c.rpc("my_vote_balance").then(({ data }) => setB(((data ?? [])[0] as typeof b) ?? null));
  }, []);
  if (!b) return null;
  const reset = b.resets_at ? new Date(b.resets_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "";
  return (
    <div className="gauge" title="Only you can see this.">
      <span className="vote-pips" aria-hidden>
        {Array.from({ length: b.allowed }, (_, i) => <i key={i} className={i < b.remaining ? "" : "spent"} />)}
      </span>
      <div>
        <p className="gauge-v">{b.remaining}<small> votes left</small></p>
        <p className="gauge-s">{b.remaining > 0
          ? `You have ${b.remaining} vote${b.remaining === 1 ? "" : "s"} left this weekly round.`
          : `You have 0 votes left this weekly round. Your votes reset on ${reset}.`}</p>
      </div>
    </div>
  );
}

/** Your votes, Clipper progress and the six stars as one strip of gauges,
 *  instead of three boxes of text. Details live in each gauge's tooltip. */
export function StatusStrip({ account, paying, fallbackClips }: { account: Account; paying: boolean; fallbackClips: number }) {
  const [p, setP] = useState<Progress>({ clips: fallbackClips, next_at: 1, next_label: "First Clip" });
  useEffect(() => {
    const c = sb(); if (!c) return;
    c.from("my_badge_progress").select("*").maybeSingle().then(({ data }) => data && setP(data as Progress));
  }, []);
  const pct = p.next_at ? Math.min(1, p.clips / p.next_at) : 1;
  const r = 26, len = 2 * Math.PI * r;
  return (
    <section className="status-strip" aria-label="Your progress">
      <VoteGauge />

      <div className="gauge" title={p.next_at ? `${p.next_at - p.clips} more clips for ${p.next_label}. Only uploads count.` : "Every Clipper badge earned."}>
        <svg viewBox="0 0 64 64" className="ring" aria-hidden>
          <circle cx="32" cy="32" r={r} className="ring-bg" />
          <circle cx="32" cy="32" r={r} className="ring-fg" strokeDasharray={len} strokeDashoffset={len * (1 - pct)} transform="rotate(-90 32 32)" />
          <text x="32" y="37" textAnchor="middle">{p.clips}</text>
        </svg>
        <div>
          <p className="gauge-v">{p.next_label ?? "Maxed"}<small> next badge</small></p>
          <p className="gauge-s">{p.next_at ? `${p.next_at - p.clips} clips to go` : "All earned"}</p>
        </div>
      </div>

      <div className="gauge" title="One star every four months on a plan, all six at two years.">
        <StarRank stars={account.stars} className="[&_svg]:size-5" />
        <div>
          <p className="gauge-v">{account.stars}<small> / {MAX_STARS} wanted</small></p>
          {paying ? <p className="gauge-s">{account.stars < MAX_STARS ? `A star every ${STAR_MONTHS} months` : "Most wanted"}</p>
            : <Link href="/pricing" className="gauge-s link">Stars come with a plan</Link>}
        </div>
      </div>
    </section>
  );
}
