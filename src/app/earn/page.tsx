"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { BRACKETS, DOWNLOAD, PERIOD_MULTIPLE, bracketFor } from "@/lib/tiers";
import { poolNow, type Pool } from "@/lib/api";
import { Vault } from "@/components/Vault";
import { DemoNote } from "@/components/DemoNote";

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function Earn() {
  const [pool, setPool] = useState<Pool | null>(null);
  useEffect(() => { poolNow().then(setPool); }, []);
  const payers = pool?.paying_users ?? 0;
  const live = bracketFor(payers);

  return (
    <div>
      <section className="bg-asphalt text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <DemoNote />
          <p className="inline-flex items-center gap-2 rounded-full bg-mango text-[#1c1710] px-3 py-1 text-sm font-black">Get paid</p>
          <h1 className="display mt-5 text-[clamp(2.4rem,7.5vw,5.5rem)] leading-[0.95]">How to earn real money<br />on Live From Leonida</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Three ways, and you never pay to enter any of them. Free accounts can win every prize on this page.
          </p>
        </div>
      </section>

      {/* 1 — Clip of the Week */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-start gap-4">
          <span className="shield shrink-0">1</span>
          <div className="min-w-0">
            <h2 className="display text-5xl md:text-6xl">Win Clip of the Week</h2>
            <p className="mt-3 max-w-2xl text-haze">
              Send your best clip. The ones that make the cut go into one compilation, Leonida votes,
              and the top three split the pool. The pool grows with the number of paying members —
              so the bigger the site gets, the more there is to win.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] items-center [&>*]:min-w-0">
          <Vault payers={payers} pool={live.pool} />
          <div className="sign sign-yellow">
            <p className="text-sm font-bold uppercase tracking-wide">This week&apos;s pool · bracket {live.label}</p>
            <dl className="mt-3 grid gap-3">
              {([["Gold", live.gold], ["Silver", live.silver], ["Bronze", live.bronze]] as const).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-black/20 pb-1.5 last:border-0">
                  <dt className="font-bold">{k}</dt><dd className="display text-4xl">{usd(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Clip of the Week prize pool by number of paying members</caption>
            <thead><tr className="border-b-2 border-line">
              <th scope="col" className="py-2.5 pr-4 font-black">Paying members</th>
              <th scope="col" className="py-2.5 pr-4 font-black">Total pool</th>
              <th scope="col" className="py-2.5 pr-4 font-black">Gold</th>
              <th scope="col" className="py-2.5 pr-4 font-black">Silver</th>
              <th scope="col" className="py-2.5 font-black">Bronze</th>
            </tr></thead>
            <tbody>
              {BRACKETS.map((b) => {
                const here = b.label === live.label;
                return (
                  <tr key={b.label} className={`border-b border-line ${here ? "bg-mango/25" : ""}`}>
                    <th scope="row" className="py-2.5 pr-4 font-semibold">
                      {b.label}{here && <span className="ml-2 rounded-full bg-gulf px-2 py-0.5 text-[11px] font-black text-white align-middle">we are here</span>}
                    </th>
                    <td className="py-2.5 pr-4 font-bold">{usd(b.pool)}</td>
                    <td className="py-2.5 pr-4 text-gulf font-bold">{usd(b.gold)}</td>
                    <td className="py-2.5 pr-4">{usd(b.silver)}</td>
                    <td className="py-2.5">{usd(b.bronze)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-haze">
          Whatever the pool is when a round opens is locked in, so it can&apos;t shrink under you once you&apos;ve entered.
        </p>
      </section>

      {/* 2 — downloads */}
      <section className="bg-ink border-y border-line">
        <div className="mx-auto max-w-7xl px-4 py-14 grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center [&>*]:min-w-0">
          <div className="flex items-start gap-4">
            <span className="shield shrink-0">2</span>
            <div className="min-w-0">
              <h2 className="display text-5xl md:text-6xl">Cool clips get downloaded</h2>
              <p className="mt-3 max-w-2xl text-haze">
                Members download clips to keep, edit and repost. Every download is {usd(DOWNLOAD.priceCents / 100)},
                and the money goes toward the creator who made the clip. You earn on every single one —
                whether the member paid cash or spent one of their monthly credits.
              </p>
              <p className="mt-3 max-w-2xl text-haze">
                There&apos;s no cap. A clip that keeps getting downloaded keeps paying, long after its week is over.
                Earnings are tallied as they happen and paid out once a month.
              </p>
            </div>
          </div>
          <div className="rounded-xl border-2 border-gulf bg-dusk p-6 text-center">
            <p className="display text-7xl leading-none">{usd(DOWNLOAD.priceCents / 100)}</p>
            <p className="mt-2 font-bold">every download</p>
            <p className="mt-4 text-sm text-haze">goes toward the creator who made the clip</p>
          </div>
        </div>
      </section>

      {/* 3 — month and year */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-start gap-4">
          <span className="shield shrink-0">3</span>
          <div className="min-w-0">
            <h2 className="display text-5xl md:text-6xl">Clip of the Month and Clip of the Year</h2>
            <p className="mt-3 max-w-2xl text-haze">
              The weekly winners roll up. Clip of the Month pays {PERIOD_MULTIPLE.month}× the weekly pool,
              and Clip of the Year pays {PERIOD_MULTIPLE.year}× — the single biggest prize on the site.
              Same split: Gold, Silver, Bronze.
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {([["Clip of the Week", 1, "Every week"], ["Clip of the Month", PERIOD_MULTIPLE.month, "Best of the month"],
             ["Clip of the Year", PERIOD_MULTIPLE.year, "Once a year"]] as const).map(([name, mult, when]) => (
            <div key={name} className={`rounded-xl border-2 p-6 ${mult === PERIOD_MULTIPLE.year ? "border-mango bg-ink" : "border-line bg-ink"}`}>
              <h3 className="text-xl font-extrabold">{name}</h3>
              <p className="text-sm text-haze">{when}</p>
              <p className="display text-5xl mt-3 sunset-text">{usd(live.pool * mult)}</p>
              <p className="text-sm text-haze mt-1">at today&apos;s member count</p>
              <p className="text-sm mt-3">
                Gold {usd(live.gold * mult)} · Silver {usd(live.silver * mult)} · Bronze {usd(live.bronze * mult)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="sign flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="display text-4xl md:text-5xl">Free to enter. Always.</p>
            <p className="font-semibold mt-1">Send a clip, keep a streak, win the week.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/submit" className="btn btn-hot">Send a clip</Link>
            <Link href="/pricing" className="btn btn-ghost">See the plans</Link>
          </div>
        </div>
        <p className="mt-4 text-sm text-haze">
          Winners confirm the gamertag on the clip before any money moves. Full terms are in the{" "}
          <Link href="/rules" className="text-gulf underline underline-offset-4">contest rules</Link>.
        </p>
      </section>
    </div>
  );
}
