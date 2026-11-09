"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser, type Profile } from "@/lib/useUser";
import { DEMO_CLIPS, exactMoney, money, platformName, type Clip, type Winning } from "@/lib/api";
import { tierById, MAX_STARS } from "@/lib/tiers";
import { StreakCard, ClipperProgress, BadgeWall, StarTracker, StreakBoard, StarRank,
  type Badge, type StreakRow } from "@/components/Gamification";
import { DemoNote } from "@/components/DemoNote";
import { Wallet } from "@/components/Wallet";
import { GetStarted } from "@/components/GetStarted";
import { Welcome } from "@/components/Welcome";
import { GamertagDialog } from "@/components/GamertagDialog";
import { Receipts } from "@/components/Receipts";
import { TierMedal } from "@/components/TierMedal";

const statusText: Record<string, string> = {
  pending: "Waiting for review", approved: "In this week's vote", featured: "Featured", rejected: "Not selected",
  unclaimed: "Staff are checking the round", requested: "Staff are checking the round", verifying: "Checking your gamertag", sent: "In your wallet", held: "On hold, check your email",
};
const payoutStatus: Record<string, string> = {
  pending: "Queued for the next run", approved: "Approved, going out", sent: "Paid",
  failed: "Payment failed, check your details", held: "On hold, check your email",
};
const methods = [["paypal", "PayPal"], ["venmo", "Venmo"], ["cashapp", "Cash App"], ["interac", "Interac e-Transfer"], ["wise", "Wise"]] as const;

type Payout = { id: string; period_start: string; period_end: string; amount_cents: number;
  download_count: number; status: string; method: string | null; sent_at: string | null };

export default function Dashboard() {
  const { user, profile, account, setProfile, paying, loading } = useUser();
  const [clips, setClips] = useState<Clip[]>([]);
  const [wins, setWins] = useState<Winning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [board, setBoard] = useState<StreakRow[]>([]);
  const [note, setNote] = useState("");
  const [gt, setGt] = useState(false);
  const [payWay, setPayWay] = useState<"stripe" | "other">("other");
  const [busyPay, setBusyPay] = useState(false);
  useEffect(() => { if (profile) setPayWay(profile.payout_method === "stripe" || !profile.payout_method ? "stripe" : "other"); }, [profile?.payout_method]); // eslint-disable-line react-hooks/exhaustive-deps

  const call = useCallback(async (url: string, body: object) => {
    const t = (await sb()?.auth.getSession())?.data.session?.access_token;
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(body) });
    return r.json().catch(() => ({}));
  }, []);
  async function connectStripe() {
    setBusyPay(true);
    const j = await call("/api/payout/stripe", { action: "connect" });
    if (j.url) { location.href = j.url; return; }
    setBusyPay(false); setNote(j.error ?? "Couldn't open Stripe.");
  }
  // Back from Stripe's sign-up: ask whether the account can take money yet.
  useEffect(() => {
    if (!user || !new URLSearchParams(location.search).has("stripe")) return;
    history.replaceState(null, "", "/dashboard#payout");
    call("/api/payout/stripe", { action: "status" }).then((j) => {
      setNote(j.ready ? "Stripe connected. Cash-outs now go to your card or bank." : "Stripe still needs a detail or two. Press Connect with Stripe to finish.");
      if (j.ready && profile) setProfile({ ...profile, payout_method: "stripe", payout_handle: "Stripe account", stripe_connect_ready: true });
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const reloadProfile = useCallback(async () => {
    const c = sb(); if (!c || !user) return;
    const { data } = await c.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) setProfile(data as Profile);
  }, [user, setProfile]);


  useEffect(() => {
    if (!user) return;
    const c = sb();
    if (!c) {
      setClips([DEMO_CLIPS[3], { ...DEMO_CLIPS[6], id: "p", status: "pending", votes: 0, owner_id: "demo" }]);
      setWins([{ id: "w", contest_id: "w0", clip_id: "x", place: 2, amount_cents: 3000, status: "unclaimed" }]);
      setPayouts([{ id: "p1", period_start: "2026-09-01", period_end: "2026-09-30", amount_cents: 2310,
        download_count: 33, status: "sent", method: "paypal", sent_at: "2026-10-03" }]);
      setBadges([
        { id: "clipper_1", label: "First Clip", blurb: "You sent one in.", earned: true },
        { id: "clipper_10", label: "Regular", blurb: "Ten clips deep.", earned: true },
        { id: "clipper_25", label: "Local", blurb: "Twenty-five clips.", earned: true },
        { id: "clipper_50", label: "Fixture", blurb: "Fifty clips.", earned: false },
        { id: "clipper_100", label: "Leonida Made", blurb: "One hundred clips.", earned: false },
        { id: "week_gold", label: "Clip of the Week", blurb: "First place, one week.", earned: true },
        { id: "drop_winner", label: "Daily Drop", blurb: "Won a Daily Drop.", earned: true },
        { id: "month_gold", label: "Clip of the Month", blurb: "First place, one month.", earned: false },
      ]);
      setBoard([
        { id: "a", display_name: "KeysKingpin", tier: "hustler", streak_days: 34, hot_creator: true },
        { id: "demo", display_name: "ViceCityVandal", tier: "kingpin", streak_days: 9, hot_creator: true },
        { id: "b", display_name: "SwampSaint", tier: "free", streak_days: 6, hot_creator: false },
      ]);
      return;
    }
    c.from("clip_scores").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setClips((data as Clip[]) ?? []));
    c.from("winnings").select("*").eq("owner_id", user.id).then(({ data }) => setWins((data as Winning[]) ?? []));
    c.from("payouts").select("*").eq("creator_id", user.id).order("period_end", { ascending: false })
      .then(({ data }) => setPayouts((data as Payout[]) ?? []));
    Promise.all([
      c.from("badges").select("id,label,blurb,sort").order("sort"),
      c.from("earned_badges").select("badge").eq("player_id", user.id),
    ]).then(([all, mine]) => {
      const got = new Set((mine.data ?? []).map((b: { badge: string }) => b.badge));
      setBadges(((all.data ?? []) as { id: string; label: string; blurb: string }[])
        .map((b) => ({ ...b, earned: got.has(b.id) })));
    });
    c.from("streak_board").select("*").limit(10).then(({ data }) => setBoard((data as StreakRow[]) ?? []));
  }, [user]);

  if (loading) return <div className="mx-auto max-w-xl px-4 py-24 text-haze font-semibold" role="status">Loading your account…</div>;
  if (user && !profile) return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <h1 className="display text-5xl">Your account didn&apos;t load.</h1>
      <p className="mt-3 text-haze">You&apos;re signed in, but the connection dropped while fetching your profile.</p>
      <button onClick={() => location.reload()} className="btn btn-hot mt-6">Try again</button>
    </div>
  );
  if (!user || !profile) return <div className="mx-auto max-w-xl px-4 py-24"><h1 className="display text-6xl">Sign in to see your clips</h1><Link href="/login" className="btn btn-hot mt-6">Sign in</Link></div>;

  const totalVotes = clips.reduce((s, c) => s + (c.votes ?? 0), 0);
  const owed = wins.filter((w) => w.status !== "sent").reduce((s, w) => s + w.amount_cents, 0);
  const pending = account?.pending_cents ?? 0;
  const plan = tierById(profile?.tier);

  async function savePayout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = { payout_method: String(f.get("method")), payout_handle: String(f.get("handle")) };
    const c = sb(); if (c) await c.from("profiles").update(patch).eq("id", profile!.id);
    setProfile({ ...profile!, ...patch }); setNote("Payout details saved.");
  }


  const look = paying ? plan.id : "free";
  return (
    <div className={`dash dash-${look}`}>
    <div className="mx-auto max-w-6xl px-4 py-12">
      <DemoNote />
      <Welcome onLanded={reloadProfile} />
      <header className="dash-hero">
        <TierMedal tier={look} className="dash-medal" />
        <div className="min-w-0">
          <p className="dash-kicker">{paying ? `${plan.label} member` : "Free account"}</p>
          <h1 className="display text-[clamp(2.2rem,9vw,5.2rem)] leading-[0.95] break-words">{profile.display_name}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <span className="dash-plan">{plan.label}</span>
        {paying && <StarRank stars={account?.stars ?? 0} />}
        {paying
          ? <><span className="text-haze">{account?.credits_remaining ?? 0} of {plan.creditsPerMonth} download credits left
              {account?.current_period_end ? `, renews ${new Date(account.current_period_end).toLocaleDateString()}` : ""}</span>
             <Link href="/pricing" className="text-gulf underline underline-offset-4">Change plan</Link></>
          : <Link href="/pricing" className="text-gulf underline underline-offset-4">Go Pro for more votes and downloads</Link>}
      </p>
        </div>
      </header>

      <dl className="dash-stats">
        {([["Clips sent", String(clips.length), clips.length === 0 ? "none yet" : `${account?.submitted_today ?? 0} today`],
          ["Vote points", totalVotes.toLocaleString(), paying ? "across your clips" : "members see live counts"],
          ["Prizes on the way", money(owed), owed > 0 ? "lands in your wallet once checked" : "top three each week get paid"],
          ["Download earnings", exactMoney(pending), `${account?.lifetime_downloads ?? 0} downloads so far`],
        ] as const).map(([k, v, hint]) => (
          <div key={k} className="dash-stat">
            <dt className="text-sm text-haze">{k}</dt>
            <dd className="display text-[clamp(1.6rem,7vw,2.6rem)] mt-1 break-words">{v}</dd>
            <p className="text-xs text-haze mt-0.5">{hint}</p>
          </div>
        ))}
      </dl>
      {note && <p role="status" className="mt-6 inline-block bg-ink-2 px-4 py-2 rounded font-semibold">{note}</p>}

      <GetStarted account={account} onClaimed={() => location.reload()} onGamertag={() => setGt(true)} />
      {gt && <GamertagDialog profile={profile} onClose={() => setGt(false)} onSaved={(x) => setProfile({ ...profile, ...x })} />}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div id="wallet" className="scroll-mt-28"><Wallet payoutReady={Boolean(profile.payout_method && profile.payout_handle)} /></div>
          <Receipts />

          <h2 className="text-2xl font-extrabold mt-12">Winnings</h2>
          {wins.length === 0 ? <p className="text-haze mt-3">No wins yet. Top three each week get paid.</p> : (
            <ul className="mt-4 grid gap-3">{wins.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-lg bg-ink border border-gulf border-2 p-4">
                <div><p className="display text-4xl sunset-text">{money(w.amount_cents)}</p><p className="text-sm text-haze">{["1st", "2nd", "3rd"][w.place - 1]} place. {statusText[w.status]}</p></div>
                {w.status === "sent" && <Link href="#wallet" className="btn btn-hot">Withdraw</Link>}
              </li>))}</ul>
          )}

          {account && (
            <>
              <h2 className="text-2xl font-extrabold mt-12">Streak and badges</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <StreakCard account={account} />
                <ClipperProgress fallback={{ clips: clips.length, next_at: 50, next_label: "Fixture" }} />
                {paying
                  ? <StarTracker stars={account.stars} months={account.stars * 4} />
                  : (
                    <div className="rounded-xl border-2 border-dashed border-line bg-ink p-5">
                      <p className="text-sm font-bold text-haze">Wanted level</p>
                      <StarRank stars={0} className="mt-2 [&_svg]:size-7" />
                      <p className="mt-2 text-sm">Stars fill while you hold a plan — one every four months, all {MAX_STARS} at two years.</p>
                      <Link href="/pricing" className="btn btn-hot mt-4 !py-2">See the plans</Link>
                    </div>
                  )}
              </div>
              <div className={`mt-8 grid gap-8 items-start ${board.length > 0 ? "lg:grid-cols-[1.6fr_1fr]" : ""}`}>
                <BadgeWall badges={badges} />
                {board.length > 0 && <StreakBoard rows={board} />}
              </div>
            </>
          )}

          <h2 className="text-2xl font-extrabold mt-12">Download earnings</h2>
          <p className="text-haze mt-1 text-sm">{exactMoney(70)} every time a member downloads one of your clips.</p>
          <div className="mt-4 rounded-lg bg-ink border-2 border-gulf p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="display text-4xl sunset-text">{exactMoney(pending)}</p>
              <p className="text-sm text-haze">
                building up now{account?.lifetime_downloads ? ` · ${account.lifetime_downloads} downloads all time` : ""}
              </p>
            </div>

          </div>
          {payouts.length > 0 && (
            <ul className="mt-4 divide-y divide-line border-y border-line">{payouts.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{exactMoney(p.amount_cents)}</p>
                  <p className="text-sm text-haze">
                    {new Date(p.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {new Date(p.period_end).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {p.download_count} downloads
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${p.status === "sent" ? "bg-gulf text-white" : "bg-ink-2"}`}>
                  {payoutStatus[p.status] ?? p.status}
                </span>
              </li>))}</ul>
          )}

          <h2 className="text-2xl font-extrabold mt-12">My clips</h2>
          {clips.length === 0 ? <p className="text-haze mt-3">No clips yet. <Link href="/submit" className="text-gulf underline">Send your first one</Link>.</p> : (
            <ul className="mt-4 divide-y divide-line border-y border-line">{clips.map((c) => (
              <li key={c.id} className="py-4 flex items-center justify-between gap-4">
                <div><p className="font-bold">{c.title}</p><p className="text-sm text-haze">{statusText[c.status]}</p></div>
                <p className="shrink-0"><span className="display text-3xl">{c.votes ?? "—"}</span> <span className="text-sm text-haze">points</span></p>
              </li>))}</ul>
          )}
        </section>

        <aside className="grid gap-8 content-start">
          <section className="rounded-lg bg-ink border border-line p-5">
            <h2 id="gamertag" className="text-xl font-extrabold scroll-mt-28">Gamertag</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="display text-2xl break-all">{profile.gamertag ?? "Not set"}</span>
              <span className={`gt-status ${profile.gamertag_verified ? "is-ok" : profile.verify_requested_at ? "is-wait" : ""}`}>
                {profile.gamertag_verified ? "Verified" : profile.verify_requested_at ? "Pending check" : profile.gamertag ? "Unverified" : "Missing"}
              </span>
            </div>
            {!profile.gamertag_verified && (
              <button onClick={() => setGt(true)} className="btn btn-hot mt-4 !py-2 text-sm">
                {profile.gamertag ? (profile.verify_requested_at ? "See the steps" : "Verify it") : "Add your gamertag"}
              </button>
            )}
          </section>

          <section className="rounded-lg bg-ink border border-line p-5 grid gap-3">
            <h2 id="payout" className="text-xl font-extrabold scroll-mt-28">Get paid</h2>
            <div className="pay-pick" role="radiogroup" aria-label="Payout method">
              <button type="button" role="radio" aria-checked={payWay === "stripe"} onClick={() => setPayWay("stripe")} className={payWay === "stripe" ? "on" : ""}>
                <b>Card or bank</b><span>Instant, via Stripe</span></button>
              <button type="button" role="radio" aria-checked={payWay === "other"} onClick={() => setPayWay("other")} className={payWay === "other" ? "on" : ""}>
                <b>PayPal & co.</b><span>Sent by staff</span></button>
            </div>
            {payWay === "stripe" ? (
              profile.stripe_connect_ready && profile.payout_method === "stripe"
                ? <p className="font-bold text-gulf">Stripe connected. Cash-outs go straight to your card or bank.</p>
                : <button onClick={connectStripe} disabled={busyPay} className="btn btn-hot w-fit !py-2">{busyPay ? "Opening Stripe…" : "Connect with Stripe"}</button>
            ) : (
              <form onSubmit={savePayout} className="grid gap-3">
                <select name="method" defaultValue={profile.payout_method && profile.payout_method !== "stripe" ? profile.payout_method : "paypal"} className="field">{methods.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <input name="handle" defaultValue={profile.payout_method !== "stripe" ? profile.payout_handle ?? "" : ""} required className="field" placeholder="Email, @username or $cashtag" />
                <button className="btn btn-hot w-fit !py-2">Save</button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
    </div>
  );
}
