"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser, type Profile } from "@/lib/useUser";
import { DEMO_CLIPS, exactMoney, type Clip } from "@/lib/api";
import { tierById, DOWNLOAD } from "@/lib/tiers";
import { StatusStrip, BadgeWall, StreakBoard, type Badge, type StreakRow } from "@/components/Gamification";
import { DemoNote } from "@/components/DemoNote";
import { GetStarted } from "@/components/GetStarted";
import { Welcome } from "@/components/Welcome";
import { GamertagDialog } from "@/components/GamertagDialog";
import { TierMedal } from "@/components/TierMedal";

const clipState: Record<string, [string, string]> = {
  pending: ["Under review", "wait"], approved: ["In the vote", "live"], featured: ["Featured", "gold"],
  rejected: ["Not selected", "off"], suspended: ["Suspended", "off"], withdrawn: ["Out of the running", "off"],
};
type Sale = { clip_id: string; downloads: number; earned_cents: number; last_sale: string | null };

/** The dashboard: what you've done, what's moving, and how it turns into
 *  money. The money itself (wallet, cash-out, receipts) lives on /wallet. */
export default function Dashboard() {
  const { user, profile, account, setProfile, paying, loading } = useUser();
  const [clips, setClips] = useState<Clip[]>([]);
  const [sales, setSales] = useState<Record<string, Sale>>({});
  const [balance, setBalance] = useState(0);
  const [prizes, setPrizes] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [board, setBoard] = useState<StreakRow[]>([]);
  const [gt, setGt] = useState(false);

  const reloadProfile = useCallback(async () => {
    const c = sb(); if (!c || !user) return;
    const { data } = await c.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) setProfile(data as Profile);
  }, [user, setProfile]);

  useEffect(() => {
    if (!user) return;
    const c = sb();
    if (!c) { setClips([DEMO_CLIPS[3]]); return; }
    c.from("clip_scores").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setClips((data as Clip[]) ?? []));
    c.rpc("my_clip_sales").then(({ data }) => setSales(Object.fromEntries(((data ?? []) as Sale[]).map((x) => [x.clip_id, x]))));
    c.from("wallet_entries").select("amount_cents,kind").then(({ data }) => {
      const rows = (data ?? []) as { amount_cents: number; kind: string }[];
      setBalance(rows.reduce((n, r) => n + r.amount_cents, 0));
      setPrizes(rows.filter((r) => r.kind === "prize").reduce((n, r) => n + r.amount_cents, 0));
    });
    Promise.all([
      c.from("badges").select("id,label,blurb,sort").order("sort"),
      c.from("earned_badges").select("badge").eq("player_id", user.id),
    ]).then(([all, mine]) => {
      const got = new Set((mine.data ?? []).map((b: { badge: string }) => b.badge));
      setBadges(((all.data ?? []) as { id: string; label: string; blurb: string }[]).map((b) => ({ ...b, earned: got.has(b.id) })));
    });
    c.from("streak_board").select("*").limit(10).then(({ data }) => setBoard((data as StreakRow[]) ?? []));
  }, [user]);

  // Taking a clip out of the running. The clip and its file stay with us —
  // that is what the terms say — it simply stops competing.
  async function pullOut(c: Clip) {
    if (!window.confirm(`Take "${c.title}" out of the competition?\n\nIt stops competing straight away. We keep the clip and its file, as the terms set out, and it carries on earning from downloads.`)) return;
    const s = sb();
    if (s) {
      const { error } = await s.rpc("withdraw_my_clip", { p_clip: c.id, p_reason: null });
      if (error) { alert(error.message); return; }
    }
    setClips((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: "withdrawn" } : x)));
  }

  if (loading) return <div className="mx-auto max-w-xl px-4 py-24 text-haze font-semibold" role="status">Loading your account…</div>;
  if (user && !profile) return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <h1 className="display text-5xl">Your account didn&apos;t load.</h1>
      <p className="mt-3 text-haze">You&apos;re signed in, but the connection dropped while fetching your profile.</p>
      <button onClick={() => location.reload()} className="btn btn-hot mt-6">Try again</button>
    </div>
  );
  if (!user || !profile) return <div className="mx-auto max-w-xl px-4 py-24"><h1 className="display text-6xl">Sign in to see your clips</h1><Link href="/login" className="btn btn-hot mt-6">Sign in</Link></div>;

  const plan = tierById(profile.tier);
  const look = paying ? plan.id : "free";
  const sold = Object.values(sales).reduce((n, x) => n + x.downloads, 0);
  const earned = Object.values(sales).reduce((n, x) => n + x.earned_cents, 0);
  const votes = clips.reduce((n, c) => n + (c.votes ?? 0), 0);
  const best = Object.values(sales).sort((a, b) => b.earned_cents - a.earned_cents)[0]?.clip_id;
  const credits = account?.credits_remaining ?? 0;

  return (
    <div className={`dash dash-${look}`}>
    <div className="mx-auto max-w-6xl px-4 py-12">
      <DemoNote />
      <Welcome onLanded={reloadProfile} />
      {gt && <GamertagDialog profile={profile} onClose={() => setGt(false)} onSaved={(x) => setProfile({ ...profile, ...x })} />}

      <header className="dash-hero">
        <TierMedal tier={look} className="dash-medal" />
        <div className="min-w-0 flex-1">
          <p className="dash-kicker">{paying ? `${plan.label} member` : "Free account"}</p>
          <h1 className="display text-[clamp(2.2rem,9vw,5.2rem)] leading-[0.95] break-words">{profile.display_name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href="/wallet" className="wallet-pill"><span>Wallet</span><b>{exactMoney(balance)}</b></Link>
            {paying ? <span className="dash-plan">{credits} download{credits === 1 ? "" : "s"} left</span>
              : <Link href="/pricing" className="dash-plan">Go Pro</Link>}
          </div>
        </div>
      </header>

      <dl className="dash-stats">
        {([["Clips", String(clips.length)], ["Votes", paying ? votes.toLocaleString() : "—"], ["Sold", String(sold)], ["Earned", exactMoney(earned + prizes)]] as const).map(([k, v]) => (
          <div key={k} className="dash-stat"><dt>{k}</dt><dd className="text-[clamp(1.5rem,6vw,2.4rem)]">{v}</dd></div>
        ))}
      </dl>

      <GetStarted account={account} onClaimed={() => location.reload()} onGamertag={() => setGt(true)} />
      {account && <StatusStrip account={account} paying={paying} fallbackClips={clips.length} />}

      <section className="deal">
        <h2 className="display text-3xl md:text-4xl">How your clips pay</h2>
        <ol className="deal-lanes">
          <li><span className="deal-n">1</span><b>Send it</b><small>Up to {account?.daily_submissions ?? 2} a day. Staff approve it into the weekly vote.</small></li>
          <li><span className="deal-n">2</span><b>Win it</b><small>Top three each week, month and year split the prize pool.</small></li>
          <li><span className="deal-n">3</span><b>Sell it</b><small>Every member download pays you most of the price, straight into your wallet.</small></li>
          <li><span className="deal-n">4</span><b>Cash out</b><small>To your card or bank through Stripe, or by PayPal & co.</small></li>
        </ol>
        <p className="deal-foot">
          <b>Downloading other players&apos; clips:</b>{" "}
          {paying ? <>you have {credits} free download{credits === 1 ? "" : "s"} this month, then {exactMoney(DOWNLOAD.priceCents)} each.</>
            : <>members get free downloads every month, then {exactMoney(DOWNLOAD.priceCents)} each. Free accounts stream everything.</>}{" "}
          Either way, the player who made the clip takes most of it. <Link href="/clips" className="underline">Browse clips</Link>
        </p>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] items-start">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="display text-3xl">Your clips</h2>
            <Link href="/submit" className="btn btn-hot !py-2 !px-4 text-sm">Send a clip</Link>
          </div>
          {clips.some((c) => c.status === "pending") && (
            <p className="review-note">
              <i aria-hidden /> {clips.filter((c) => c.status === "pending").length === 1
                ? "One of your clips is in the review queue."
                : `${clips.filter((c) => c.status === "pending").length} of your clips are in the review queue.`}{" "}
              Staff watch every clip before it goes live — usually within a day. You&apos;ll get an email either way.
            </p>
          )}
          {clips.length === 0 ? (
            <p className="mt-4 text-haze">Nothing yet. Your first clip starts the streak, the badges and the sales.</p>
          ) : (
            <ul className="sales mt-4">
              {clips.map((c) => {
                const s = sales[c.id]; const [label, kind] = clipState[c.status] ?? [c.status, "off"];
                return (
                  <li key={c.id} className={c.id === best ? "is-best" : ""}>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold truncate">{c.id === best && <span className="best-tag">Best seller</span>}{c.title}</p>
                      <span className={`clip-state ${kind}`}>{label}</span>
                    </div>
                    <div className="sales-n" title="Votes"><b>{c.votes ?? "—"}</b><small>votes</small></div>
                    <div className="sales-n" title="Downloads"><b>{s?.downloads ?? 0}</b><small>sold</small></div>
                    <div className="sales-n money" title="Earned from downloads"><b>{exactMoney(s?.earned_cents ?? 0)}</b><small>earned</small></div>
                    {["approved", "featured", "pending"].includes(c.status) && (
                      <button onClick={() => pullOut(c)} className="pull-out"
                        title="Take this clip out of the competition">Withdraw</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="grid gap-6 content-start">
          <section className="rounded-xl bg-ink border border-line p-5">
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
          {board.length > 0 && <StreakBoard rows={board} />}
        </aside>
      </div>

      {/* The trophy case runs full width. In a side column it was a tall
          ladder beside a short list of clips, which left the page half
          empty for anyone who hasn't filled it yet; across the page the
          shelves lay out as shelves. */}
      {badges.length > 0 && <div className="mt-10"><BadgeWall badges={badges} /></div>}
    </div>
    </div>
  );
}
