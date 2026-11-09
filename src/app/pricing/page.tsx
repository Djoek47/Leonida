"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { TIERS, annualSaving, DOWNLOAD, tierById, type Tier } from "@/lib/tiers";
import { useUser } from "@/lib/useUser";
import { sb } from "@/lib/supabase";
import { money, poolNow, type Pool } from "@/lib/api";
import { DemoNote } from "@/components/DemoNote";
import { TierMedal } from "@/components/TierMedal";
import { Vault } from "@/components/Vault";
import { PrizeLadder } from "@/components/PrizeLadder";

const price = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 ? 2 : 0 })}`;

export default function Pricing() {
  const { user, profile, paying } = useUser();
  const [annual, setAnnual] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState<Tier | null>(null);

  /** Paying members confirm any change first; a downgrade lists what goes. */
  function choose(t: Tier) {
    if (paying && profile?.tier && profile.tier !== "free" && t.id !== profile.tier) { setAsk(t); return; }
    subscribe(t);
  }

  useEffect(() => { poolNow().then(setPool); }, []);

  async function subscribe(t: Tier) {
    if (!user) { location.href = "/login?next=/pricing"; return; }
    setBusy(t.id); setErr("");
    try {
      // The route reads the caller from a bearer token. Without it every
      // checkout came back "Sign in first", however signed in you were.
      const token = (await sb()?.auth.getSession())?.data.session?.access_token;
      const headers = {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      };
      const body = JSON.stringify({ tier: t.id, period: annual ? "annual" : "monthly" });

      const r = await fetch("/api/checkout", { method: "POST", headers, body });
      const j = await r.json();

      if (j.url) { location.href = j.url; return; }   // Stripe checkout, or the dashboard after a plan switch

      // Test mode: no card, applied straight away, same end state as a real
      // subscription so everything downstream can be exercised.
      if (j.mock) {
        const m = await fetch("/api/mock/subscribe", { method: "POST", headers, body });
        const mj = await m.json();
        if (mj.ok) { location.href = "/dashboard?welcome=" + t.id; return; }
        setErr(mj.error ?? "Test payment failed.");
        return;
      }

      setErr(j.error ?? "Checkout is not switched on yet.");
    } catch {
      setErr("Could not reach checkout. Try again in a moment.");
    } finally { setBusy(null); }
  }

  const from = paying ? tierById(profile?.tier) : null;
  const down = Boolean(ask && from && ask.rank < from.rank);
  return (
    <div>
      {ask && from && (
        <div role="dialog" aria-modal="true" aria-labelledby="chg-t" className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" onClick={() => setAsk(null)}>
          <div className={`chg-card ${down ? "is-down" : ""}`} onClick={(e) => e.stopPropagation()}>
            <p className="chg-k">{down ? "Heads up" : "Plan change"}</p>
            <h2 id="chg-t" className="display text-3xl md:text-4xl">{down ? `Drop to ${ask.label}?` : `Move up to ${ask.label}?`}</h2>
            {down ? (
              <>
                <p className="mt-3">{ask.id === "free" ? <>Your plan ends at the close of this billing period. After that you lose:</> : <>This takes effect <b>right away</b>. You&apos;re leaving {from.label}, so you lose:</>}</p>
                <ul className="chg-list">
                  {from.votes > ask.votes && <li>{from.votes - ask.votes} vote{from.votes - ask.votes === 1 ? "" : "s"} per round ({from.votes} → {ask.votes})</li>}
                  {from.dailySubmissions > ask.dailySubmissions && <li>Daily uploads: {from.dailySubmissions} → {ask.dailySubmissions}</li>}
                  {from.creditsPerMonth > ask.creditsPerMonth && <li>Free downloads a month: {from.creditsPerMonth} → {ask.creditsPerMonth}</li>}
                  {from.streakFreezes > ask.streakFreezes && <li>Streak freezes: {from.streakFreezes} → {ask.streakFreezes}</li>}
                </ul>
                <p className="text-sm opacity-80">No refund for the rest of this period; the lower price starts at your next renewal. Your clips, badges, stars and wallet stay.</p>
              </>
            ) : (
              <p className="mt-3">Next you&apos;ll see Stripe&apos;s payment page with the exact difference for the rest of this period. Nothing is charged until you pay there.</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button autoFocus={!down} onClick={async () => {
                const t = ask; setAsk(null);
                if (t.id === "free") {
                  const token = (await sb()?.auth.getSession())?.data.session?.access_token;
                  await fetch("/api/billing/cancel", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: "{}" });
                  location.href = "/wallet"; return;
                }
                subscribe(t);
              }} className={`btn ${down ? "chg-danger" : "btn-hot"} flex-1`}>
                {down ? `Yes, drop to ${ask.label}` : "Continue to payment"}
              </button>
              <button autoFocus={down} onClick={() => setAsk(null)} className="btn btn-ghost">{down ? `Keep ${from.label}` : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}
      <section className="bg-asphalt text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <DemoNote />
          <p className="inline-flex items-center gap-2 rounded-full bg-mango text-[#1c1710] px-3 py-1 text-sm font-black">Memberships</p>
          <h1 className="display mt-5 text-[clamp(2.6rem,8vw,6rem)] leading-[0.95]">Back the channel.<br />Get a louder vote.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            You never have to pay to enter or to win. Members get more votes, more clips a day,
            clip downloads and no ads — and their subscriptions are what grow the prize pool.
          </p>

          <div className="mt-8 inline-flex rounded-full border-2 border-white/25 p-1 text-sm font-bold">
            <button onClick={() => setAnnual(false)} aria-pressed={!annual}
              className={`rounded-full px-4 py-2 ${!annual ? "bg-mango text-[#1c1710]" : "text-white/80"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} aria-pressed={annual}
              className={`rounded-full px-4 py-2 ${annual ? "bg-mango text-[#1c1710]" : "text-white/80"}`}>
              Yearly{" "}<span className="font-black">&middot; save up to {Math.max(...TIERS.filter((t) => t.monthlyCents).map(annualSaving))}%</span>
            </button>
          </div>
        </div>
      </section>

      {err && <p role="alert" className="mx-auto max-w-7xl px-4 pt-6 text-flamingo font-semibold">{err}</p>}

      <section className="mx-auto max-w-7xl px-4 py-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4 items-stretch [&>*]:min-w-0">
        {TIERS.map((t) => {
          const current = (profile?.tier ?? "free") === t.id && (t.id === "free" ? !paying : paying);
          const cents = annual ? t.annualCents : t.monthlyCents;
          const best = t.id === "hustler";
          return (
            <div key={t.id} className={`plan plan-${t.id} ${best ? "plan-best" : ""}`}>
              {best && <p className="plan-flag">Most take this one</p>}

              <TierMedal tier={t.id} className="plan-medal" />

              <h2 className="display text-4xl text-center">{t.label}</h2>
              <p className="plan-pitch">{t.pitch}</p>

              <p className="plan-price">
                <span className="display">{t.monthlyCents ? price(cents) : "Free"}</span>
                {t.monthlyCents > 0 && <span className="plan-per">/{annual ? "year" : "month"}</span>}
              </p>
              <p className="plan-sub">
                {t.monthlyCents === 0 ? "No card needed"
                  : annual ? `${annualSaving(t)}% off the monthly price`
                  : `${price(t.annualCents)} a year saves ${annualSaving(t)}%`}
              </p>

              <p className="plan-votes"><strong>{t.votes}</strong> {t.votes === 1 ? "vote" : "votes"}</p>

              <ul className="plan-perks">
                {t.perks.map((p) => (
                  <li key={p}><span aria-hidden /><span>{p}</span></li>
                ))}
              </ul>

              {t.id === "free" ? (
                <Link href={user ? "/submit" : "/login"} className="btn btn-ghost mt-6 w-full justify-center">
                  {current ? "Your plan" : "Start free"}
                </Link>
              ) : (
                <button onClick={() => choose(t)} disabled={busy === t.id || current}
                  className={`btn mt-6 w-full justify-center ${best ? "btn-hot" : "bg-mango text-[#1c1710] hover:brightness-110"} disabled:opacity-70`}>
                  {current ? "Your plan" : busy === t.id ? "Opening checkout…" : `Get ${t.label}`}
                </button>
              )}
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <h2 className="display text-5xl">Where the prize money comes from</h2>
          <p className="mt-3 text-haze">
            The weekly pool grows with the number of paying members. Whatever it is when a round
            opens is locked in, so it can&apos;t shrink under you.
          </p>
          <div className="mt-6"><PrizeLadder payers={pool?.paying_users ?? 0} /></div>
          <p className="mt-4 text-sm">
            <Link href="/earn" className="text-gulf font-bold underline underline-offset-4">
              See all three ways to earn →
            </Link>
          </p>
        </div>

        <div className="grid gap-5 content-start">
          <div>
            <Vault payers={pool?.paying_users ?? 0} pool={Math.round((pool?.weekly_cents ?? 2500) / 100)} />
            <p className="mt-3 text-sm text-haze">
              Each strap is a real bundle — the straps get fatter as the site grows. Clip of the Month pays {pool ? money(pool.monthly_cents) : "—"}.
            </p>
          </div>

          <div className="panel-steel">
            <p className="k">Every download</p>
            <p className="v">{price(DOWNLOAD.creatorCents)}</p>
            <p className="s">to the creator. Credits pay them too.</p>
          </div>

          <div className="panel-crate">
            <p className="k">Cancel</p>
            <p className="v">Whenever</p>
            <p className="s">Runs to the end of the period, then stops.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
