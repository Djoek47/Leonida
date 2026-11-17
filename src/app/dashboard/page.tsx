"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser, type Profile } from "@/lib/useUser";
import { DEMO_CLIPS, exactMoney, type Clip } from "@/lib/api";
import { tierById, DOWNLOAD } from "@/lib/tiers";
import { StatusStrip, BadgeWall, type Badge } from "@/components/Gamification";
import { TrophyCase } from "@/components/TrophyCase";
import { FeaturedClips } from "@/components/FeaturedClips";
import { DemoNote } from "@/components/DemoNote";
import { GetStarted } from "@/components/GetStarted";
import { DownloadLibrary } from "@/components/DownloadLibrary";
import { Welcome } from "@/components/Welcome";
import { GamertagDialog } from "@/components/GamertagDialog";
import { TierMedal } from "@/components/TierMedal";

const clipState: Record<string, [string, string]> = {
  pending: ["Pending review", "wait"], approved: ["Approved · In the contest", "live"], featured: ["Approved · Featured", "gold"],
  rejected: ["Not selected", "off"], suspended: ["Suspended", "off"], withdrawn: ["Withdrawn", "off"],
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
  const [gt, setGt] = useState(false);
  // Open the explainer the first time only; after that it stays folded.
  const [firstVisit, setFirstVisit] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem("lfl-deal-seen")) { setFirstVisit(true); localStorage.setItem("lfl-deal-seen", "1"); } } catch {} }, []);
  const [views, setViews] = useState<Record<string, { views: number; views_24h: number }>>({});

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
    c.rpc("my_clip_views").then(({ data }) => setViews(Object.fromEntries(((data ?? []) as { clip_id: string; views: number; views_24h: number }[]).map((x) => [x.clip_id, x]))));
    c.rpc("my_clip_sales").then(({ data }) => setSales(Object.fromEntries(((data ?? []) as Sale[]).map((x) => [x.clip_id, x]))));
    c.from("wallet_entries").select("amount_cents,kind").eq("player_id", user.id).then(({ data }) => {
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
  }, [user]);

  // Taking a clip out of the running. The clip and its file stay with us —
  // that is what the terms say — it simply stops competing.
  // Contest entry only happens through staff approval of a submission, so older download-only clips stay as they are.
  const downloadOnly = (c: Clip) => c.for_contest === false && !c.contest_id && ["approved", "featured"].includes(c.status);

  type Pull = { clip: Clip; votes: number | null; buyers: number | null; ack: boolean; state: "ask" | "busy" | "error"; err?: string };
  const [pull, setPull] = useState<Pull | null>(null);
  const [pulled, setPulled] = useState<{ title: string; votes: number; views: number; keep: number } | null>(null);
  async function pullOut(c: Clip) {
    setPull({ clip: c, votes: null, buyers: null, ack: false, state: "ask" });
    const s = sb();
    if (s) {
      const [v, b] = await Promise.all([s.rpc("my_clip_votes", { p_clip: c.id }), s.rpc("my_clip_buyers", { p_clip: c.id })]);
      setPull((p) => (p && p.clip.id === c.id ? { ...p, votes: Number(v.data ?? 0), buyers: Number(b.data ?? 0) } : p));
    } else setPull((p) => (p ? { ...p, votes: 3, buyers: 2 } : p));
  }
  async function confirmPull() {
    if (!pull || !pull.ack) return;
    const c = pull.clip;
    setPull({ ...pull, state: "busy" });
    const s = sb();
    let out = { votes_removed: pull.votes ?? 0, views_removed: views[c.id]?.views ?? 0, keep_access: pull.buyers ?? 0 };
    if (s) {
      const { data, error } = await s.rpc("withdraw_my_clip", { p_clip: c.id, p_reason: null });
      if (error) {
        const m = error.message ?? "";
        setPull({ ...pull, state: "error", err: m.includes("ALREADY_PLACED") ? "This clip already placed in a round, so it can't be withdrawn."
          : m.includes("ROUND_CLOSED") ? "Voting on this round has closed, so the clip can't be withdrawn now."
          : "That didn't go through. Try again." });
        return;
      }
      if (data) out = data as typeof out;
    }
    setClips((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: "withdrawn" } : x)));
    setViews((v) => ({ ...v, [c.id]: { views: 0, views_24h: 0 } }));
    setPulled({ title: c.title, votes: out.votes_removed, views: out.views_removed, keep: out.keep_access });
    setPull(null);
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
            {paying && <span className="dash-plan">{credits} download{credits === 1 ? "" : "s"} left</span>}
          </div>
        </div>
      </header>

      <dl className="dash-stats">
        {([["Clips", String(clips.length)], ["Views", String(Object.values(views).reduce((n, v) => n + v.views, 0))], ["Sold", String(sold)], ["Earned", exactMoney(earned + prizes)]] as const).map(([k, v]) => (
          <div key={k} className="dash-stat"><dt>{k}</dt><dd className="text-[clamp(1.5rem,6vw,2.4rem)]">{v}</dd></div>
        ))}
      </dl>

      <GetStarted account={account} onClaimed={() => location.reload()} onGamertag={() => setGt(true)} />
      {account && <StatusStrip account={account} paying={paying} fallbackClips={clips.length} />}

      <details className="deal deal-fold" open={firstVisit} onToggle={(e) => { try { if (!(e.currentTarget as HTMLDetailsElement).open) localStorage.setItem("lfl-deal-seen", "1"); } catch {} }}>
        <summary><h2 className="display text-3xl md:text-4xl">How your clips pay</h2><span className="deal-tog" aria-hidden /></summary>
        <ol className="deal-lanes">
          <li><span className="deal-n">1</span><b>Send it</b></li>
          <li><span className="deal-n">2</span><b>Win it</b><small>Top three each week, month and year split the prize pool.</small></li>
          <li><span className="deal-n">3</span><b>Sell it</b><small>Every member download can earn you up to $0.99, straight into your wallet.</small></li>
          <li><span className="deal-n">4</span><b>Cash out</b><small>Only available with a minimum balance of $5</small></li>
        </ol>
        <p className="deal-foot">
          <b>Downloading other players&apos; clips:</b>{" "}
          {paying ? <>you have {credits} free download{credits === 1 ? "" : "s"} this month, then {exactMoney(DOWNLOAD.priceCents)} each.</>
            : <>members get free downloads every month, then {exactMoney(DOWNLOAD.priceCents)} each. Free accounts stream everything.</>}{" "}
          <Link href="/clips" className="underline">Browse clips</Link>
        </p>
      </details>

      {pull && (
        <div className="hub-scrim" onClick={() => pull.state !== "busy" && setPull(null)} onKeyDown={(e) => e.key === "Escape" && pull.state !== "busy" && setPull(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="pull-t" className="hub-sheet pull-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="dash-kicker flex items-center gap-2"><i className="stop-mark" aria-hidden>!</i>Withdraw from competition</p>
            <h2 id="pull-t" className="display text-3xl mt-1">Withdraw “{pull.clip.title}”?</h2>
            <p className="mt-2 text-haze">This can&apos;t be undone. Here is exactly what happens.</p>

            <dl className="dash-stats !grid-cols-3 !mt-4">
              <div className="dash-stat"><dt>Votes</dt><dd className="text-3xl">{pull.votes ?? "…"}</dd></div>
              <div className="dash-stat"><dt>Views</dt><dd className="text-3xl">{views[pull.clip.id]?.views ?? 0}</dd></div>
              <div className="dash-stat"><dt>Bought by</dt><dd className="text-3xl">{pull.buyers ?? "…"}</dd></div>
            </dl>

            <ul className="pull-list">
              <li className="is-lose"><b>Lost for good</b><span>Every vote on this clip is deleted and its views go back to zero. If you ever re-upload it, it starts from nothing.</span></li>
              <li className="is-lose"><b>Out of the competition</b><span>It can&apos;t win this round and can&apos;t be entered again. Nobody can vote on it.</span></li>
              <li className="is-lose"><b>Off the site</b><span>Other people can no longer find it, watch it or buy it, so it stops earning new sales.</span></li>
              <li className="is-keep"><b>Kept by buyers</b><span>{pull.buyers ? `The ${pull.buyers} ${pull.buyers === 1 ? "person who" : "people who"} already downloaded it` : "Anyone who already downloaded it"} keep it and can download it again from their account. Nobody else can.</span></li>
              <li className="is-keep"><b>Your earnings stay</b><span>Money from past downloads is yours and stays in your wallet. We keep the file, as the terms set out.</span></li>
            </ul>

            <label className="pull-ack">
              <input type="checkbox" checked={pull.ack} onChange={(e) => setPull({ ...pull, ack: e.target.checked })} disabled={pull.state === "busy"} />
              <span>I understand the votes and views on this clip will be removed and can&apos;t be restored.</span>
            </label>
            {pull.state === "error" && <p role="alert" className="mt-3 font-semibold text-flamingo">{pull.err}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button autoFocus className="btn btn-hot flex-1 justify-center" onClick={() => setPull(null)} disabled={pull.state === "busy"}>Keep it in</button>
              <button className="stop-btn" onClick={confirmPull} disabled={!pull.ack || pull.state === "busy"} aria-disabled={!pull.ack}><span>{pull.state === "busy" ? "Withdrawing…" : "Withdraw it"}</span></button>
            </div>
          </div>
        </div>
      )}

      {pulled && (
        <p role="status" className="pull-done">
          <b>“{pulled.title}” is withdrawn.</b> {pulled.votes} vote{pulled.votes === 1 ? "" : "s"} and {pulled.views} view{pulled.views === 1 ? "" : "s"} were removed.
          {pulled.keep > 0 ? ` The ${pulled.keep} ${pulled.keep === 1 ? "person who" : "people who"} bought it can still download it.` : " Nobody had bought it, so no one else can get it."}
          <button onClick={() => setPulled(null)} aria-label="Dismiss">×</button>
        </p>
      )}

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
            <p className="mt-4 text-haze">Nothing yet. Your first clip starts the badges and the sales.</p>
          ) : (
            <ul className="sales mt-4">
              {clips.map((c) => {
                const s = sales[c.id]; const [label, kind] = c.status === "approved" && c.for_contest === false ? ["Approved", "live"] : clipState[c.status] ?? [c.status, "off"];
                return (
                  <li key={c.id} className={c.id === best ? "is-best" : ""}>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold truncate">{c.id === best && <span className="best-tag">Best seller</span>}{c.title}</p>
                      <span className={`clip-state ${kind}`}>{label}</span>
                      {downloadOnly(c) && <span className="clip-state off ml-2">Download only</span>}
                      {c.status === "withdrawn" && (s?.downloads ?? 0) > 0 && <span className="text-xs text-haze ml-2">{s?.downloads} can still download it</span>}
                    </div>
                    <div className="sales-n" title={`${views[c.id]?.views_24h ?? 0} in the last 24 hours`}><b>{views[c.id]?.views ?? 0}</b><small>views</small></div>
                    <div className="sales-n" title="Downloads"><b>{s?.downloads ?? 0}</b><small>sold</small></div>
                    <div className="sales-n money" title="Earned from downloads"><b>{exactMoney(s?.earned_cents ?? 0)}</b><small>earned</small></div>
                    {["approved", "featured", "pending"].includes(c.status) && c.for_contest !== false && (
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
        </aside>
      </div>

      {/* The trophy case runs full width. In a side column it was a tall
          ladder beside a short list of clips, which left the page half
          empty for anyone who hasn't filled it yet; across the page the
          shelves lay out as shelves. */}
      <DownloadLibrary />

      <FeaturedClips clips={clips} />

      <div className="mt-10"><TrophyCase /></div>
      {badges.some((b) => !/^(week|month|year)_/.test(b.id)) && <div className="mt-10"><BadgeWall badges={badges.filter((b) => !/^(week|month|year)_/.test(b.id))} /></div>}
    </div>
    </div>
  );
}
