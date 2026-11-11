"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { DOWNLOAD, PERIOD_MULTIPLE, bracketFor } from "@/lib/tiers";
import { poolNow, type Pool } from "@/lib/api";
import { Vault } from "@/components/Vault";
import { PrizeLadder } from "@/components/PrizeLadder";
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
          <Vault payers={payers} pool={live.pool} cycle />
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

        <div className="mt-8">
          <PrizeLadder payers={payers} variant="steps" />
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
              <p className="mt-3 max-w-xl text-haze">
                No cap, no expiry. A clip that keeps getting downloaded keeps paying. Paid out monthly.
              </p>
            </div>
          </div>
          <div className="panel-enamel text-center">
            <p className="k">Every download</p>
            <p className="v">{usd(DOWNLOAD.priceCents / 100)}</p>
            <p className="s">
              most of it straight to the creator
              <span className="ast">
                <button type="button" aria-label="What most of it means" aria-describedby="dl-ast">*</button>
                <span role="tooltip" id="dl-ast" className="ast-note">
                  The creator&apos;s share is the large majority of each download. It isn&apos;t a fixed
                  figure: card fees and the platform&apos;s cut come off first, so it can land a little
                  under that. The exact amount shows on every sale.
                </span>
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 3 — month and year */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-start gap-4">
          <span className="shield shrink-0">3</span>
          <div className="min-w-0">
            <h2 className="display text-5xl md:text-6xl">The winners roll up</h2>
            <p className="mt-3 max-w-xl text-haze">
              Weekly winners go through to the Month, and the Month to the Year.
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {([["Week", 1, "panel-crate"], ["Month", PERIOD_MULTIPLE.month, "panel-steel"],
             ["Year", PERIOD_MULTIPLE.year, "panel-enamel panel-enamel-gold"]] as const).map(([name, mult, panel]) => (
            <div key={name} className={panel}>
              <p className="k">Clip of the {name}</p>
              <p className="v">{usd(live.pool * mult)}</p>
              <p className="s">Gold {usd(live.gold * mult)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="sign flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="display text-4xl md:text-5xl">Free to enter. Always.</p>
            <p className="font-semibold mt-1">Send a clip, win the week.</p>
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
