"use client";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { Wallet } from "@/components/Wallet";
import { Receipts } from "@/components/Receipts";
import { GetPaid, Winnings } from "@/components/MoneyDesk";
import { TierMedal } from "@/components/TierMedal";
import { tierById } from "@/lib/tiers";
import { exactMoney } from "@/lib/api";

/** Money in one place: the wallet, the plan you pay for, and every receipt. */
export default function WalletPage() {
  const { user, profile, setProfile, paying, loading } = useUser();
  if (loading) return <div className="mx-auto max-w-xl px-4 py-24 text-haze font-semibold" role="status">Loading your wallet…</div>;
  if (!user || !profile) return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <h1 className="display text-5xl">Wallet & billing</h1>
      <Link href="/login?next=/wallet" className="btn btn-hot mt-6">Sign in</Link>
    </div>
  );
  const plan = tierById(paying ? profile.tier : "free");
  const look = paying ? plan.id : "free";
  const price = profile.billing_period === "annual" ? plan.annualCents : plan.monthlyCents;
  const payoutReady = Boolean(profile.payout_method && profile.payout_handle);

  return (
    <div className={`dash dash-${look}`}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="dash-kicker">Money</p>
        <h1 className="display text-[clamp(2.4rem,8vw,4.6rem)] leading-none">Wallet & billing</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] items-start">
          <div>
            <Wallet payoutReady={payoutReady} />
            <div className="mt-8"><Winnings userId={profile.id} /></div>
          </div>
          <div className="grid gap-6">
            <GetPaid profile={profile} setProfile={(p) => setProfile(p)} />

          <section className="rounded-xl bg-ink border border-line p-5">
            <div className="flex items-center gap-4">
              <TierMedal tier={look} className="size-20 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-haze">Your plan</p>
                <p className="display text-3xl">{plan.label}</p>
                {paying
                  ? <p className="text-sm text-haze">{exactMoney(price)} {profile.billing_period === "annual" ? "a year" : "a month"}{profile.current_period_end ? ` · renews ${new Date(profile.current_period_end).toLocaleDateString()}` : ""}</p>
                  : <p className="text-sm text-haze">No card on file. Free forever.</p>}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/pricing" className="btn btn-hot !py-2">{paying ? "Change plan" : "Upgrade"}</Link>
              {paying && <Link href="/settings" className="btn btn-ghost !py-2">Cancel</Link>}
            </div>
          </section>
          </div>
        </div>

        <div className="mt-10"><Receipts always /></div>
      </div>
    </div>
  );
}
