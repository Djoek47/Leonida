"use client";
import Link from "@/components/A";
import type { Account } from "@/lib/useUser";

type Step = { done: boolean; title: string; body: string; href: string; cta: string };

/** A new account's dashboard is a wall of zeros, which reads as broken rather
 *  than new. This replaces it with the four things that actually move you off
 *  zero, ticking off as they happen, and disappears once they all have. */
export function GetStarted({
  account, clips, hasGamertag, hasPayout, paying,
}: {
  account: Account | null; clips: number;
  hasGamertag: boolean; hasPayout: boolean; paying: boolean;
}) {
  const steps: Step[] = [
    {
      done: clips > 0,
      title: "Send your first clip",
      body: account
        ? `You can send ${account.daily_submissions} a day on your plan. Under three minutes to enter the weekly round.`
        : "Under three minutes to enter the weekly round.",
      href: "/submit", cta: "Send a clip",
    },
    {
      done: hasGamertag,
      title: "Set your gamertag",
      body: "It goes on every clip you send, and it's what we check before paying out a win.",
      href: "/dashboard#gamertag", cta: "Add it",
    },
    {
      done: hasPayout,
      title: "Say where to send money",
      body: "PayPal, Venmo, Cash App, Interac or Wise. Nothing can be paid out until this is set.",
      href: "/dashboard#payout", cta: "Add a payout account",
    },
    {
      done: paying,
      title: "Vote on this week's round",
      body: account
        ? `Free accounts hold ${account.votes} vote. Members hold more, and their subscriptions are what grow the pool.`
        : "Members hold more votes, and their subscriptions grow the pool.",
      href: "/clips", cta: "See the clips",
    },
  ];

  const left = steps.filter((s) => !s.done);
  if (left.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border-2 border-gulf bg-ink p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display text-4xl">Get going</h2>
        <p className="text-sm font-bold text-haze">
          {steps.length - left.length} of {steps.length} done
        </p>
      </div>
      <p className="mt-1 text-haze">
        Your account is live and connected — there&apos;s just nothing in it yet. Here&apos;s what fills it.
      </p>

      <ol className="mt-5 grid gap-3 md:grid-cols-2 [&>*]:min-w-0">
        {steps.map((s) => (
          <li key={s.title}
              className={`rounded-lg border p-4 flex gap-3 ${s.done ? "border-line opacity-60" : "border-line bg-ink-2"}`}>
            <span aria-hidden
              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-black
                          ${s.done ? "bg-gulf text-white" : "border-2 border-line text-haze"}`}>
              {s.done ? "✓" : ""}
            </span>
            <span className="min-w-0">
              <span className={`block font-extrabold ${s.done ? "line-through" : ""}`}>{s.title}</span>
              <span className="block text-sm text-haze mt-0.5">{s.body}</span>
              {!s.done && (
                <Link href={s.href} className="mt-2 inline-block text-sm font-bold text-gulf underline underline-offset-4">
                  {s.cta} →
                </Link>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
