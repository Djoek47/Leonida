"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { TIERS, annualSaving, DOWNLOAD, BRACKETS, bracketFor, type Tier } from "@/lib/tiers";
import { useUser } from "@/lib/useUser";
import { money, poolNow, type Pool } from "@/lib/api";
import { DemoNote } from "@/components/DemoNote";

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
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: t.id, period: annual ? "annual" : "monthly" }),
      });
      const j = await r.json();
      if (j.url) location.href = j.url;
      else setErr(j.error ?? "Checkout is not switched on yet.");
    } catch {
      setErr("Could not reach checkout. Try again in a moment.");
    } finally { setBusy(null); }
  }

  return (
    <div>
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

      <section className="mx-auto max-w-7xl px-4 py-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4 items-start">
        {TIERS.map((t) => {
          const current = (profile?.tier ?? "free") === t.id && (t.id === "free" ? !paying : paying);
          const cents = annual ? t.annualCents : t.monthlyCents;
          const best = t.id === "hustler";
          return (
            <div key={t.id} className={`rounded-xl border-2 p-6 h-full flex flex-col ${best ? "border-gulf bg-ink" : "border-line bg-ink"}`}>
              {best && <p className="-mt-9 mb-3 self-start rounded-full bg-gulf px-3 py-1 text-xs font-black text-white">Most take this one</p>}
              <h2 className="display text-4xl">{t.label}</h2>
              <p className="mt-1 text-sm text-haze min-h-10">{t.pitch}</p>
              <p className="mt-3 inline-flex items-baseline gap-2 rounded-lg bg-ink-2 px-3 py-2">
                <span className="display text-4xl text-gulf">{t.votes}</span>
                <span className="font-bold">{t.votes === 1 ? "vote" : "votes"}</span>
              </p>
              <p className="mt-4">
                <span className="display text-5xl">{t.monthlyCents ? price(cents) : "Free"}</span>
                {t.monthlyCents > 0 && <span className="text-haze font-semibold"> /{annual ? "year" : "month"}</span>}
              </p>
              {t.monthlyCents > 0 && annual && (
                <p className="text-sm font-bold text-gulf">{annualSaving(t)}% off the monthly price</p>
              )}
              {t.monthlyCents > 0 && !annual && (
                <p className="text-sm text-haze">{price(t.annualCents)} a year saves {annualSaving(t)}%</p>
              )}

              <ul className="mt-5 grid gap-2 text-[15px] flex-1">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-gulf" />
                    <span>{p}</span>
                  </li>
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
          <div className="sign sign-yellow">
            <p className="font-bold">Right now</p>
            <p className="display text-6xl mt-1">{pool ? money(pool.weekly_cents) : "—"}</p>
            <p className="font-semibold">this week, with {pool?.paying_users ?? 0} paying {pool?.paying_users === 1 ? "member" : "members"}</p>
            <p className="mt-2 text-sm">Clip of the Month: {pool ? money(pool.monthly_cents) : "—"}</p>
          </div>

          <div className="rounded-xl border border-line bg-ink p-6">
            <h3 className="display text-3xl">Downloads pay the creator</h3>
            <p className="mt-2 text-haze">
              Members get free download credits every month. Once those run out a download is{" "}
              {price(DOWNLOAD.priceCents)}, and that goes toward the creator who made the clip.
              Credit downloads pay the creator too.
            </p>
            <p className="mt-3 text-sm text-haze">Every download carries the uploader&apos;s name on the video.</p>
          </div>

          <div className="rounded-xl border border-line bg-ink p-6">
            <h3 className="display text-3xl">Cancel whenever</h3>
            <p className="mt-2 text-haze">
              Your plan runs to the end of the period you paid for, then stops. Unused download
              credits don&apos;t roll over. Free accounts keep competing and keep winning.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
