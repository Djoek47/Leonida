"use client";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { Wallet } from "@/components/Wallet";
import { Receipts } from "@/components/Receipts";
import { GetPaid, Winnings } from "@/components/MoneyDesk";
import { TierMedal } from "@/components/TierMedal";
import { tierById } from "@/lib/tiers";
import { exactMoney } from "@/lib/api";

/** Money in one place: the wallet, the plan you pay for, and every receipt.
 *
 *  The balance runs full width rather than down one side. A new member has an
 *  empty wallet by definition, and a tall column holding one small board left
 *  half the page blank on the day most people see it — their first. */
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
        <h1 className="display text-[clamp(2.4rem,8vw,4.6rem)] leading-none">Wallet &amp; billing</h1>

        {/* The balance, the cash-out and the history: one run, full width. */}
        <Wallet payoutReady={payoutReady} />

        <GetPaid profile={profile} setProfile={(p) => setProfile(p)} />

        <h2 className="money-h">Your plan</h2>
        <div className="plan-line">
          <TierMedal tier={look} className="size-20 shrink-0" />
          <div className="who">
            <p className="display text-4xl">{plan.label}</p>
            {paying
              ? <p className="text-sm text-haze mt-1">{exactMoney(price)} {profile.billing_period === "annual" ? "a year" : "a month"}{profile.current_period_end ? ` · renews ${new Date(profile.current_period_end).toLocaleDateString()}` : ""}</p>
              : <p className="text-sm text-haze mt-1">No card on file. Free forever.</p>}
          </div>
          <div className="plan-acts">
            <Link href="/pricing" className="btn btn-hot !py-2">{paying ? "Change plan" : "Upgrade"}</Link>
            {paying && <Link href="/settings" className="btn btn-ghost !py-2">Cancel</Link>}
          </div>
        </div>

        <Winnings userId={profile.id} />

        <Receipts always />
      </div>
    </div>
  );
}
