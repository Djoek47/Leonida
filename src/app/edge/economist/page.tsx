"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { CHAPTERS } from "@/lib/missions";
import { CASH_RULES, CHAPTER_ALERTS, ECONOMY_SOURCES, FENCES, SAVINGS, SCHEMES } from "@/lib/economy";

const KEY = "lfl-chapter"; // shared with Mission Briefing
const RISK = ["", "Low heat", "Medium heat", "High heat"];

/** Leonida Economist: every scheme to make money in Leonida. Hustler and Kingpin.
 *  Uses the same "which chapter are you on" setting as Mission Briefing, so fences, schemes and
 *  warnings from later chapters show only as "opens in Chapter N". */
export default function Economist() {
  const { user, profile, paying, tier, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 2));
  const [cur, setCur] = useState<number | null>(null);
  useEffect(() => {
    try { const v = Number(localStorage.getItem(KEY)); setCur(Number.isInteger(v) && v >= 0 && v < CHAPTERS.length ? v : 1); } catch { setCur(1); }
  }, []);
  const pick = (c: number) => { setCur(c); try { localStorage.setItem(KEY, String(c)); } catch {} };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 [&>*]:min-w-0">
      <p className="dash-kicker"><Link href="/edge" className="underline underline-offset-4">The Edge</Link> · Hustler and Kingpin</p>
      <h1 className="display text-5xl md:text-6xl mt-1">Leonida Economist</h1>
      <p className="mt-2 text-haze max-w-2xl">Every scheme to make money in Leonida, where to sell what you take, and how to keep it. Matched to where you are in the story.</p>

      {loading || cur === null ? (
        <p className="mt-10 text-haze font-semibold" role="status">Opening the books…</p>
      ) : !allowed ? (
        <section className="brief-locked mt-8">
          <div className="brief-lock-head">
            <span className="brief-lock-ico" aria-hidden>🔒</span>
            <div>
              <p className="font-extrabold text-lg">Leonida Economist comes with Hustler and Kingpin.</p>
              <p className="text-haze text-sm">{SCHEMES.length} money schemes, all {FENCES.length} fences and who pays best, the BuckMe savings ladder, and the one mission where you can lose everything. {user ? "Upgrade your plan to open it." : "Sign in with a Hustler or Kingpin plan to open it."}</p>
            </div>
            <Link href={user ? "/pricing" : "/login?next=/edge/economist"} className="btn btn-hot ml-auto">{user ? "See the plans" : "Sign in"}</Link>
          </div>
          <ul className="brief-teasers" aria-label="What's inside">
            {SCHEMES.map((s) => <li key={s.name}><b>{s.name}</b><span>{RISK[s.risk]}</span></li>)}
          </ul>
        </section>
      ) : (
        <>
          <section className="mb-picker mt-8" aria-label="Which chapter are you on?">
            <p className="font-extrabold">Where are you in the story?</p>
            <div className="mb-chips" role="radiogroup">
              {CHAPTERS.map((c) => <button key={c.id} role="radio" aria-checked={cur === c.id} className={`mb-chip${cur === c.id ? " is-on" : ""}`} onClick={() => pick(c.id)}>{c.label}</button>)}
            </div>
            <p className="text-haze text-sm mt-2">Same setting as Mission Briefing. Anything past your chapter stays hidden.</p>
          </section>

          {CHAPTER_ALERTS.filter((a) => a.ch <= cur).length > 0 && (
            <aside className="mb-tips mx-0 mt-6" aria-label="Money alerts">
              <p className="mb-tips-k">Money alerts for where you are</p>
              <ul>{CHAPTER_ALERTS.filter((a) => a.ch <= cur).map((a) => <li key={a.text}><b>Chapter {a.ch}:</b> {a.text}</li>)}</ul>
            </aside>
          )}

          <h2 className="display text-3xl mt-10">Ways to make money</h2>
          <ol className="mb-grid !px-0">
            {SCHEMES.map((s) => s.ch <= cur ? (
              <li key={s.name} className={`mb-card${s.risk === 3 ? " is-heist" : ""}`}>
                <div className="mb-card-top"><span className="mb-tag">{s.pay}</span><span className={`eco-risk r${s.risk}`}>{RISK[s.risk]}</span></div>
                <b className="mb-name">{s.name}</b>
                <p className="mb-goal">{s.how}</p>
                <ul className="eco-tips">{s.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </li>
            ) : (
              <li key={s.name} className="mb-card is-opt eco-locked"><b className="mb-name">🔒 Opens in Chapter {s.ch}</b><p className="mb-goal">Keep playing. This one shows up when you get there.</p></li>
            ))}
          </ol>

          <h2 className="display text-3xl mt-10">Fences: who buys what</h2>
          <p className="text-haze text-sm mt-1">Stolen goods are worth nothing until a fence buys them. Hover a fence on the in-game map to see today&apos;s rates.</p>
          <div className="eco-table-wrap mt-3">
            <table className="eco-table">
              <thead><tr><th>Fence</th><th>Area</th><th>Buys</th><th>Rates</th><th>Opens after</th></tr></thead>
              <tbody>
                {FENCES.map((f) => f.ch <= cur ? (
                  <tr key={f.name}><td><b>{f.name}</b></td><td>{f.area}</td><td>{f.buys}</td><td>{f.rate}</td><td>{f.unlock} <span className="text-haze">(Ch. {f.ch})</span></td></tr>
                ) : (
                  <tr key={f.name} className="eco-locked"><td colSpan={5}>🔒 A fence opens in Chapter {f.ch}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="display text-3xl mt-10">Keep it: BuckMe and Family Savings</h2>
          <ul className="eco-rules mt-3">{CASH_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
          <div className="eco-table-wrap mt-4">
            <table className="eco-table">
              <thead><tr><th>Savings goal</th><th>Saved</th><th>Checking limit</th><th>Perk</th></tr></thead>
              <tbody>{SAVINGS.map((g) => <tr key={g.goal}><td><b>{g.goal}</b></td><td>{g.saved}</td><td>{g.limit}</td><td>{g.perk}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-haze text-sm mt-2">New goals open as the story moves on.</p>

          <p className="mt-10 text-xs text-haze">
            Compiled from community guides and rewritten by our team:{" "}
            {ECONOMY_SOURCES.map((s, i) => <span key={s.href}>{i ? ", " : ""}<a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{s.label}</a></span>)}.
            Exact payouts vary in game; the map shows the estimate for each target.
          </p>
        </>
      )}
    </div>
  );
}
