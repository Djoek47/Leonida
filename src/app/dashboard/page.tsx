"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { DEMO_CLIPS, exactMoney, money, platformName, type Clip, type Winning } from "@/lib/api";
import { tierById, MAX_STARS } from "@/lib/tiers";
import { StreakCard, ClipperProgress, BadgeWall, StarTracker, StreakBoard, StarRank,
  type Badge, type StreakRow } from "@/components/Gamification";
import { DemoNote } from "@/components/DemoNote";
import { Wallet } from "@/components/Wallet";
import { GetStarted } from "@/components/GetStarted";
import { TestPaymentsNote } from "@/components/TestPayments";

const statusText: Record<string, string> = {
  pending: "Waiting for review", approved: "In this week's vote", featured: "Featured", rejected: "Not selected",
  unclaimed: "Ready to redeem", requested: "Payout requested", verifying: "Checking your gamertag", sent: "Paid", held: "On hold, check your email",
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

  if (loading) return null;
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
  async function redeem(w: Winning) {
    if (!profile!.payout_handle) { setNote("Add where to send your money first."); return; }
    const c = sb(); if (c) { const { error } = await c.from("winnings").update({ status: "requested", requested_at: new Date().toISOString() }).eq("id", w.id); if (error) { setNote(error.message); return; } }
    setWins((ws) => ws.map((x) => x.id === w.id ? { ...x, status: "requested" } : x));
    setNote(profile!.gamertag_verified ? "Payout requested. Most go out within 3 business days." : "Payout requested. Verify your gamertag below so we can send it.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <DemoNote />
      <TestPaymentsNote paying={paying} />
      <h1 className="display text-[clamp(2.2rem,10vw,6rem)] break-words">{profile.display_name}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <span className={`rounded-full px-3 py-1 ${paying ? "bg-gulf text-white" : "bg-ink-2"}`}>{plan.label}</span>
        {paying && <StarRank stars={account?.stars ?? 0} />}
        {paying
          ? <><span className="text-haze">{account?.credits_remaining ?? 0} of {plan.creditsPerMonth} download credits left
              {account?.current_period_end ? `, renews ${new Date(account.current_period_end).toLocaleDateString()}` : ""}</span>
             <Link href="/pricing" className="text-gulf underline underline-offset-4">Change plan</Link></>
          : <Link href="/pricing" className="text-gulf underline underline-offset-4">Go Pro for more votes and downloads</Link>}
      </p>

      <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 border-y border-line lg:divide-x divide-line">
        {([["Clips sent", String(clips.length), clips.length === 0 ? "none yet" : `${account?.submitted_today ?? 0} today`],
          ["Vote points", totalVotes.toLocaleString(), paying ? "across your clips" : "members see live counts"],
          ["Prize money to redeem", money(owed), owed > 0 ? "ready to claim" : "top three each week get paid"],
          ["Download earnings", exactMoney(pending), `${account?.lifetime_downloads ?? 0} downloads so far`],
        ] as const).map(([k, v, hint]) => (
          <div key={k} className="py-5 px-4">
            <dt className="text-sm text-haze">{k}</dt>
            <dd className="display text-[clamp(1.6rem,7vw,2.6rem)] mt-1 break-words">{v}</dd>
            <p className="text-xs text-haze mt-0.5">{hint}</p>
          </div>
        ))}
      </dl>
      {note && <p role="status" className="mt-6 inline-block bg-ink-2 px-4 py-2 rounded font-semibold">{note}</p>}

      <GetStarted account={account} clips={clips.length} paying={paying}
        hasGamertag={Boolean(profile.gamertag)} hasPayout={Boolean(profile.payout_method && profile.payout_handle)} />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <Wallet payoutReady={Boolean(profile.payout_method && profile.payout_handle)} />

          <h2 className="text-2xl font-extrabold mt-12">Winnings</h2>
          {wins.length === 0 ? <p className="text-haze mt-3">Nothing yet. The top three clips each week split the pool — a win lands here and in your wallet.</p> : (
            <ul className="mt-4 grid gap-3">{wins.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-lg bg-ink border border-gulf border-2 p-4">
                <div><p className="display text-4xl sunset-text">{money(w.amount_cents)}</p><p className="text-sm text-haze">{["1st", "2nd", "3rd"][w.place - 1]} place. {statusText[w.status]}</p></div>
                {w.status === "unclaimed" && <button onClick={() => redeem(w)} className="btn btn-hot">Redeem</button>}
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
              <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
                <BadgeWall badges={badges} />
                {board.length > 0 && <StreakBoard rows={board} />}
              </div>
            </>
          )}

          <h2 className="text-2xl font-extrabold mt-12">Download earnings</h2>
          <p className="text-haze mt-1 text-sm">
            Every time a member downloads one of your clips you earn {exactMoney(70)}, whether they spend
            a free credit or pay the {exactMoney(99)}. Balances are totted up as they happen and paid once a month.
          </p>
          <div className="mt-4 rounded-lg bg-ink border-2 border-gulf p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="display text-4xl sunset-text">{exactMoney(pending)}</p>
              <p className="text-sm text-haze">
                building up now{account?.lifetime_downloads ? ` · ${account.lifetime_downloads} downloads all time` : ""}
              </p>
            </div>
            <p className="text-sm text-haze max-w-[18rem]">
              Paid out at the start of each month to the account below, once the balance passes {exactMoney(1000)}.
            </p>
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
            <h2 id="gamertag" className="text-xl font-extrabold scroll-mt-28">Prove your gamertag</h2>
            <p className="text-sm text-haze mt-1">Only needed to get paid. {profile.gamertag ? <>Gamertag on file: <b className="text-foam">{profile.gamertag}</b> ({platformName[(profile.platform ?? "ps5") as "ps5"]}).</> : null}</p>
            {profile.gamertag_verified ? <p className="mt-4 font-bold text-gulf">Verified</p> : (
              <ol className="mt-4 grid gap-3 text-sm list-decimal pl-5">
                <li><b>Xbox:</b> sign in with your Microsoft account and we read your gamertag automatically. <span className="text-haze">(Coming with Xbox app approval.)</span></li>
                <li><b>PlayStation:</b> put this code in your PSN &ldquo;About me&rdquo;, then press the button. Staff check it and you can remove it after.
                  <span className="mt-2 block display text-4xl tracking-wider text-gulf">{profile.verify_code}</span></li>
              </ol>
            )}
            {!profile.gamertag_verified && <button onClick={() => setNote("Thanks. Staff will check your profile, usually within a day.")} className="btn btn-ghost mt-4 !py-2 text-sm">I&apos;ve added the code</button>}
          </section>

          <form onSubmit={savePayout} className="rounded-lg bg-ink border border-line p-5 grid gap-3">
            <h2 id="payout" className="text-xl font-extrabold scroll-mt-28">Where to send your money</h2>
            <select name="method" defaultValue={profile.payout_method ?? "paypal"} className="field">{methods.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input name="handle" defaultValue={profile.payout_handle ?? ""} required className="field" placeholder="Email, @username or $cashtag" />
            <button className="btn btn-hot w-fit !py-2">Save payout details</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
