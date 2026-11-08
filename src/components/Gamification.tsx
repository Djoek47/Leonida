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
export function StreakCard({ account }: { account: Account }) {
  const hot = account.streak_days >= 7;
  const atRisk = account.submitted_today === 0;
  return (
    <div className={`rounded-xl border-2 p-5 ${hot ? "border-flamingo" : "border-line"} bg-ink`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-haze">Upload streak</p>
          <p className="display text-6xl leading-none">
            {account.streak_days}<span className="text-2xl text-haze"> day{account.streak_days === 1 ? "" : "s"}</span>
          </p>
          <p className="text-sm text-haze mt-1">Best run: {account.best_streak}</p>
        </div>
        {hot && <span className="shrink-0 rounded-full bg-flamingo px-3 py-1 text-xs font-black text-white">Hot Creator</span>}
      </div>
      <p className={`mt-4 text-sm font-semibold ${atRisk ? "text-flamingo" : "text-gulf"}`}>
        {atRisk ? "Nothing sent today — send one to keep the run alive." : "Today is counted. See you tomorrow."}
      </p>
      {account.streak_freezes > 0 && (
        <p className="mt-2 text-sm text-haze">
          {account.freezes_left} of {account.streak_freezes} streak freeze{account.streak_freezes === 1 ? "" : "s"} left.
          A freeze covers one missed day automatically.
        </p>
      )}
      <p className="mt-2 text-xs text-haze">Miss two days in a row and the streak resets to zero.</p>
    </div>
  );
}

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

export function BadgeWall({ badges }: { badges: Badge[] }) {
  const got = badges.filter((b) => b.earned).length;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-extrabold">Badges</h3>
        <p className="text-sm text-haze">{got} of {badges.length}</p>
      </div>
      <ul className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b) => (
          <li key={b.id} title={b.blurb}
            className={`rounded-lg border-2 px-3 py-2.5 ${b.earned ? "border-gulf bg-ink" : "border-dashed border-line opacity-55"}`}>
            <p className="font-bold text-sm leading-tight">{b.label}</p>
            <p className="text-xs text-haze mt-0.5">{b.earned ? b.blurb : "Not yet"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Today's rotating challenge. Open to everyone; the winner gets a week in Trending. */
export type Drop = { id: string; theme: string; blurb: string | null; closes_at: string };

export function DailyDrop({ drop }: { drop: Drop }) {
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

  return (
    <div className="sign sign-yellow flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <span className="rec" aria-hidden />Daily Drop · {left}
        </p>
        <p className="display text-4xl md:text-5xl mt-1">{drop.theme}</p>
        {drop.blurb && <p className="font-semibold mt-1">{drop.blurb}</p>}
        <p className="text-sm mt-2">Open to everyone. The winner is featured in Trending for a full week.</p>
      </div>
      <Link href="/submit" className="btn bg-[#1c1710] text-white shrink-0">Enter today&apos;s drop</Link>
    </div>
  );
}

export type StreakRow = { id: string; display_name: string; tier: string; streak_days: number; hot_creator: boolean };

export function StreakBoard({ rows }: { rows: StreakRow[] }) {
  return (
    <div>
      <h3 className="text-xl font-extrabold">Longest streaks</h3>
      <ol className="mt-4 divide-y divide-line border-y border-line">
        {rows.map((r, i) => (
          <li key={r.id} className="py-2.5 flex items-center gap-3">
            <span className="display text-2xl w-8 shrink-0 text-haze">{i + 1}</span>
            <span className="flex-1 min-w-0">
              <span className="font-bold truncate">{r.display_name}</span>
              {r.tier !== "free" && (
                <span className="ml-2 rounded-full bg-gulf px-1.5 py-0.5 text-[10px] font-black uppercase text-white align-middle">
                  {tierById(r.tier).label}
                </span>
              )}
            </span>
            {r.hot_creator && <span className="shrink-0 text-xs font-black text-flamingo">HOT</span>}
            <span className="shrink-0 display text-2xl">{r.streak_days}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-haze">One upload a day keeps a streak going. Updated live.</p>
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
