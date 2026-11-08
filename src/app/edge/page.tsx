"use client";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { TIERS, tierById } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";

/** Three tools, each gated by tier. Locked cards still show what's inside —
 *  hiding it entirely just makes people think the page is broken. */
const TOOLS = [
  {
    id: "economist", name: "Leonida Economist", minRank: 2,
    tag: "Hustler and up",
    blurb: "What's actually making money in Leonida this week, updated live.",
    points: [
      "Live trend board: which clip subjects are climbing and which are cooling",
      "Money-making methods most players haven't found yet",
      "Payout rates by activity, tracked as the economy shifts",
      "Early calls on what the next week's Daily Drops will reward",
    ],
  },
  {
    id: "meta_brief", name: "Weekly Meta Brief", minRank: 2,
    tag: "Hustler and up",
    blurb: "One page, every Monday: what won last week and why.",
    points: [
      "Breakdown of the winning clips and what they had in common",
      "Tags and subjects that over-performed against their volume",
      "Voting patterns across the tiers",
      "What to shoot this week",
    ],
  },
  {
    id: "perf_lab", name: "Clip Performance Lab", minRank: 3,
    tag: "Kingpin only",
    blurb: "Deep analytics on every clip you've posted.",
    points: [
      "Watch-through and drop-off, second by second",
      "Download curve: which clips keep earning after their week",
      "Vote sources broken down by tier",
      "Side-by-side comparison of any two of your clips",
      "Best time of day to post, from your own history",
    ],
  },
];

export default function Edge() {
  const { profile, paying } = useUser();
  const rank = paying ? tierById(profile?.tier).rank : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <DemoNote />
      <p className="inline-flex items-center gap-2 rounded-full bg-gulf text-white px-3 py-1 text-sm font-black">Member tools</p>
      <h1 className="display mt-4 text-[clamp(2.4rem,8vw,5rem)]">The edge</h1>
      <p className="mt-3 max-w-2xl text-haze">
        Three tools for people who treat this seriously. They don&apos;t change who can win —
        free accounts take every prize on the site — they just make it easier to know what to shoot.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3 items-start">
        {TOOLS.map((t) => {
          const open = rank >= t.minRank;
          const need = TIERS.find((x) => x.rank === t.minRank);
          return (
            <section key={t.id} className={`rounded-xl border-2 p-6 h-full flex flex-col ${open ? "border-gulf bg-ink" : "border-line bg-ink"}`}>
              <p className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide">
                <span className={open ? "text-gulf" : "text-haze"}>{t.tag}</span>
                {!open && <span aria-label="Locked" title="Locked">🔒</span>}
              </p>
              <h2 className="display text-4xl mt-2">{t.name}</h2>
              <p className="mt-2 text-haze">{t.blurb}</p>
              <ul className="mt-4 grid gap-2 text-[15px] flex-1">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gulf" />
                    <span className={open ? "" : "text-haze"}>{p}</span>
                  </li>
                ))}
              </ul>
              {open ? (
                <p className="btn btn-ghost mt-6 w-full justify-center !cursor-default">
                  Opens with the first live round
                </p>
              ) : (
                <Link href="/pricing" className="btn btn-hot mt-6 w-full justify-center">
                  Unlock with {need?.label}
                </Link>
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-haze">
        These fill with real numbers once clips are flowing — there&apos;s nothing to analyse before launch.
        Your tier already unlocks them, so they&apos;ll simply be there on day one.
      </p>
    </div>
  );
}
