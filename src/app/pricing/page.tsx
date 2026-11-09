"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { TIERS, annualSaving, DOWNLOAD, BRACKETS, bracketFor, type Tier } from "@/lib/tiers";
import { useUser } from "@/lib/useUser";
import { sb } from "@/lib/supabase";
import { money, poolNow, type Pool } from "@/lib/api";
import { DemoNote } from "@/components/DemoNote";
import { TestPaymentsNote } from "@/components/TestPayments";
import { TierMedal } from "@/components/TierMedal";
import { Vault } from "@/components/Vault";

const price = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 ? 2 : 0 })}`;

export default function Pricing() {
  const { user, profile, paying } = useUser();
  const [annual, setAnnual] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

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

      if (j.url) { location.href = j.url; return; }

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

  return (
    <div>
      <section className="bg-asphalt text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <DemoNote />
          <TestPaymentsNote paying={paying} />
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
                <button onClick={() => subscribe(t)} disabled={busy === t.id || current}
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
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left text-sm">
              <thead><tr className="border-b-2 border-line">
                <th scope="col" className="py-2 font-black">Paying members</th>
                <th scope="col" className="py-2 font-black">Weekly pool</th>
                <th scope="col" className="py-2 font-black">Gold</th>
              </tr></thead>
              <tbody>
                {BRACKETS.map((b) => {
                  const here = b.label === bracketFor(pool?.paying_users ?? 0).label;
                  return (
                    <tr key={b.label} className={`border-b border-line ${here ? "bg-mango/25" : ""}`}>
                      <th scope="row" className="py-2.5 font-semibold">{b.label}</th>
                      <td className="py-2.5 display text-2xl text-gulf">{price(b.pool * 100)}</td>
                      <td className="py-2.5 font-bold">{price(b.gold * 100)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
