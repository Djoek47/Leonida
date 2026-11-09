"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import {
  castVote, clearVote, contestClips, currentContest, downloadWithCredit, exactMoney,
  money, myVotes, platformName, poolNow, ytAt, type Clip, type Contest, type Pool,
} from "@/lib/api";
import { useUser } from "@/lib/useUser";
import { sb } from "@/lib/supabase";
import { DOWNLOAD, PERIOD_MULTIPLE, bracketFor } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";
import { ClipVideo } from "@/components/ClipVideo";
import { TAG_LABEL, FLAGGED_SLUGS } from "@/lib/tags";
import { DailyDrop, type Drop } from "@/components/Gamification";
import { PlatformIcon } from "@/components/Icons";

function left(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Voting closed";
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return `Voting closes in ${d}d ${h}h`;
}
const embed = (u: string) => u.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");

export default function ClipsPage() {
  const { user, account, paying, tier, demo } = useUser();
  const [contest, setContest] = useState<Contest | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [voted, setVoted] = useState<string[]>([]);
  const [pool, setPool] = useState<Pool | null>(null);
  const [credits, setCredits] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [ask, setAsk] = useState<Clip | null>(null);
  const [confirm, setConfirm] = useState<{ clip: Clip; state: "ask" | "busy" | "done" } | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [watchers, setWatchers] = useState<Record<string, number>>({});
  const [kingpins, setKingpins] = useState<Record<string, number>>({});

  useEffect(() => {
    currentContest().then(async (c) => {
      setContest(c);
      setClips(await contestClips(c.id));
      setVoted(await myVotes(c.id));
    });
    poolNow().then(setPool);

    const c = sb();
    if (!c) {
      setDrop({ id: "demo", theme: "Five-star escapes", blurb: "Lose them in under a minute.",
        closes_at: new Date(new Date().setHours(23, 59, 0, 0)).toISOString() });
      setWatchers({}); setKingpins({});
      return;
    }
    c.from("daily_drops").select("id,theme,blurb,closes_at").eq("day", new Date().toISOString().slice(0, 10))
      .maybeSingle().then(({ data }) => data && setDrop(data as Drop));

    // Live activity: refreshed on a timer, nothing persistent.
    const counts = async () => {
      const [w, k] = await Promise.all([
        c.from("watching_now").select("clip_id,watchers"),
        c.from("kingpin_signal").select("clip_id,kingpin_votes"),
      ]);
      setWatchers(Object.fromEntries((w.data ?? []).map((r: { clip_id: string; watchers: number }) => [r.clip_id, r.watchers])));
      setKingpins(Object.fromEntries((k.data ?? []).map((r: { clip_id: string; kingpin_votes: number }) => [r.clip_id, r.kingpin_votes])));
    };
    counts();
    const id = setInterval(counts, 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { setCredits(account?.credits_remaining ?? 0); }, [account]);

  const maxVotes = tier.votes;
  const votesLeft = maxVotes - voted.length;

  /** Nudge a clip's tally on screen so the vote is visible straight away;
   *  the server copy replaces it on the next refresh. */
  const bump = (id: string, by: number) =>
    setClips((all) => all.map((x) => (x.id === id ? { ...x, votes: Math.max(0, (x.votes ?? 0) + by) } : x)));
  const refresh = useCallback(async () => { if (contest) setClips(await contestClips(contest.id)); }, [contest]);

  function voteMessage(err: string) {
    if (err.includes("OUT_OF_VOTES")) return `You've used all ${maxVotes} of your votes this round. Take one back to move it.`;
    if (err.includes("VOTING_CLOSED")) return "Voting for this round has closed.";
    if (err.includes("own clip")) return "You can't vote for your own clip.";
    return err;
  }

  /** Tapping Vote opens the confirmation; tapping a vote you already cast takes it back. */
  async function vote(c: Clip) {
    if (!user) { setMsg("Sign in to vote. It's free and takes ten seconds."); return; }
    if (c.owner_id && c.owner_id === user.id) { setMsg("You can't vote for your own clip."); return; }
    if (voted.includes(c.id)) {
      setVoted((v) => v.filter((x) => x !== c.id)); bump(c.id, -1);
      const err = await clearVote(c.id);
      if (err) { setVoted((v) => [...v, c.id]); bump(c.id, 1); setMsg(voteMessage(err)); }
      else { setMsg(`Vote taken back. ${votesLeft + 1} of ${maxVotes} left.`); refresh(); }
      return;
    }
    if (votesLeft <= 0 && maxVotes > 1) { setMsg(voteMessage("OUT_OF_VOTES")); return; }
    setMsg(null);
    setConfirm({ clip: c, state: "ask" });
  }

  async function confirmVote() {
    if (!confirm) return;
    const c = confirm.clip;
    setConfirm({ clip: c, state: "busy" });
    const prev = voted;
    const moving = maxVotes === 1 ? prev : [];
    setVoted(maxVotes === 1 ? [c.id] : [...prev, c.id]);
    moving.forEach((id) => bump(id, -1)); bump(c.id, 1);
    const err = await castVote(c.id);
    if (err) {
      setVoted(prev); moving.forEach((id) => bump(id, 1)); bump(c.id, -1);
      setConfirm(null); setMsg(voteMessage(err));
      return;
    }
    setConfirm({ clip: c, state: "done" });
    refresh();
    setTimeout(() => setConfirm((x) => (x?.clip.id === c.id && x.state === "done" ? null : x)), 3200);
  }

  /** Ask the server for the file. It only hands one over once the clip is
   *  paid for: by a credit, by card, or in test mode. */
  const fetchFile = useCallback(async (clipId: string) => {
    const token = (await sb()?.auth.getSession())?.data.session?.access_token;
    const r = await fetch("/api/download", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ clipId }),
    });
    return (await r.json().catch(() => ({}))) as { file?: string; checkout?: string; error?: string; external?: boolean };
  }, []);

  const deliver = (j: { file?: string; external?: boolean }) => {
    if (!j.file) return false;
    if (j.external) window.open(j.file, "_blank", "noopener"); else location.href = j.file;
    return true;
  };

  const download = useCallback(async (c: Clip) => {
    if (!user) { setMsg("Sign in to download."); return; }
    if (!paying) { setAsk(c); return; }
    if (demo) { setMsg("Demo mode: a real download would spend a credit here."); return; }
    setMsg("Getting the file ready…");
    if (credits > 0) {
      const { row, error } = await downloadWithCredit(c.id);
      if (error === "NO_CREDITS") { setCredits(0); setMsg(`That was your last credit. The next download is ${exactMoney(DOWNLOAD.priceCents)}.`); return; }
      if (error) { setMsg(error); return; }
      // A clip you already own comes back without spending anything.
      const fresh = row && Date.now() - new Date((row as { created_at?: string }).created_at ?? 0).getTime() < 60_000;
      if (fresh) setCredits((n) => Math.max(0, n - 1));
      const j = await fetchFile(c.id);
      if (!deliver(j)) { setMsg(j.error ?? "Could not start the download."); return; }
      setMsg(fresh && c.owner_id !== user.id ? `Downloading. ${exactMoney(DOWNLOAD.creatorCents)} went to ${c.gamertag}.` : "Downloading.");
      return;
    }
    const j = await fetchFile(c.id);
    if (j.checkout) { location.href = j.checkout; return; }
    if (!deliver(j)) { setMsg(j.error ?? "Could not start the download."); return; }
    setMsg(c.owner_id !== user.id ? `Downloading. ${exactMoney(DOWNLOAD.creatorCents)} went to ${c.gamertag}.` : "Downloading.");
  }, [user, paying, credits, demo, fetchFile]);

  // Back from Stripe: the webhook records the sale a moment later, so wait for it, then hand over the file.
  useEffect(() => {
    if (!user) return;
    const id = new URLSearchParams(location.search).get("downloaded");
    if (!id) return;
    history.replaceState(null, "", "/clips");
    let tries = 0, stop = false;
    setMsg("Payment received. Getting your file…");
    const go = async () => {
      if (stop) return;
      const j = await fetchFile(id);
      if (deliver(j)) { setMsg("Downloading. Thanks for paying the player."); return; }
      if (j.checkout && ++tries < 8) { setTimeout(go, 1500); return; }
      setMsg("Payment received. The file isn't ready yet: tap ↓ on the clip again in a moment, it won't charge twice.");
    };
    go();
    return () => { stop = true; };
  }, [user, fetchFile]);

  if (!contest) return <div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading this week&apos;s round…</div>;

  // Free accounts don't see tallies, so the order they get is the submission order.
  const shown = tag ? clips.filter((c) => c.tags?.includes(tag)) : clips;
  const sorted = paying ? [...shown].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)) : shown;
  // Every tag in play this round, commonest first, so the filter reflects the
  // clips that actually exist rather than all 121 possibilities.
  const inPlay = Object.entries(
    clips.reduce<Record<string, number>>((n, c) => {
      for (const t of c.tags ?? []) n[t] = (n[t] ?? 0) + 1;
      return n;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 14);
  // Same window the database enforces in voting_open(): status 'voting', and
  // between the later of voting_opens and (closes - deadline_hours) and the close.
  const closesAt = new Date(contest.voting_closes).getTime();
  const opensAt = Math.max(new Date(contest.voting_opens).getTime(), closesAt - (contest.deadline_hours ?? 48) * 36e5);
  const open = contest.status === "voting" && Date.now() >= opensAt && Date.now() <= closesAt;
  // The prizes close_contest() will actually pay: the bracket for the paying
  // count locked when the round opened (or today's count), times the period.
  const b = bracketFor(contest.payers_at_open ?? pool?.paying_users ?? 0);
  const mult = PERIOD_MULTIPLE[(contest.period ?? "week") as keyof typeof PERIOD_MULTIPLE] ?? 1;
  const prizes = [b.gold, b.silver, b.bronze].map((d) => Math.round(d * mult * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <DemoNote />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="lower-third text-sm mb-4"><span className="tag">{open ? <><span className="rec" />Voting</> : "Round"}</span><span className="txt">{contest.status === "voting" && Date.now() < opensAt ? `Voting opens ${new Date(opensAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}` : left(contest.voting_closes)}</span></div>
          <h1 className="display text-6xl md:text-8xl">{contest.title}</h1>
        </div>
        <div className="flex gap-6 text-right">
          {prizes.map((cents, i) => (
            <div key={i}><p className="display text-4xl text-gulf">{exactMoney(cents)}</p><p className="text-sm text-haze">{["1st", "2nd", "3rd"][i]}</p></div>
          ))}
        </div>
      </div>

      {contest.youtube_url ? (
        <div className="mt-10 aspect-video rounded-lg overflow-hidden border border-line">
          <iframe className="h-full w-full" src={embed(contest.youtube_url)} title="This week's compilation" allowFullScreen />
        </div>
      ) : (
        <p className="mt-8 text-haze">The compilation video goes up when voting opens. Each clip below links to its moment in it.</p>
      )}

      {/* What this account can do in this round */}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border-2 border-line bg-ink px-4 py-3 text-sm font-semibold">
        {paying ? (
          <>
            <span><span className="display text-2xl text-gulf">{votesLeft}</span> of {maxVotes} votes left</span>
            <span className="text-haze hidden sm:inline">·</span>
            <span><span className="display text-2xl text-gulf">{credits}</span> download credit{credits === 1 ? "" : "s"} this month</span>
          </>
        ) : (
          <>
            <span>You get one vote. Totals and the ranking are hidden on free accounts.</span>
            <Link href="/pricing" className="btn btn-hot !py-1.5 !px-3 text-sm">Get more votes</Link>
          </>
        )}
        {pool && <span className="sm:ml-auto text-haze">Pool grows with members: {money(pool.weekly_cents)} this week</span>}
      </div>

      {drop && <div className="mt-8"><DailyDrop drop={drop} /></div>}

      {msg && <p role="status" className="mt-5 inline-block bg-ink-2 px-4 py-2 rounded font-semibold">{msg} {!user && <Link className="text-gulf underline" href="/login">Sign in</Link>}</p>}

      {sorted.length === 0 ? (
        <div className="mt-16 text-center py-20 border border-dashed border-line rounded-lg">
          <p className="display text-5xl">No clips in this round yet</p>
          <p className="text-haze mt-3">Be the first one in.</p>
          <Link href="/submit" className="btn btn-hot mt-6">Send a clip</Link>
        </div>
      ) : (
        <>
        {inPlay.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-haze">Filter</span>
            {inPlay.map(([t, n]) => (
              <button key={t} onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t}
                className={`rounded-full border-2 px-3 py-1 text-sm font-bold
                  ${tag === t ? "border-gulf bg-gulf text-white" : "border-line text-haze hover:border-gulf"}`}>
                {TAG_LABEL[t] ?? t} <span className="opacity-60">{n}</span>
              </button>
            ))}
            {tag && (
              <button onClick={() => setTag(null)} className="text-sm font-bold text-gulf underline underline-offset-4">
                Clear
              </button>
            )}
          </div>
        )}
        {sorted.length === 0 && tag && (
          <p className="mt-8 text-haze">
            Nothing tagged {TAG_LABEL[tag] ?? tag} this round.{" "}
            <button onClick={() => setTag(null)} className="text-gulf underline underline-offset-4">Show everything</button>
          </p>
        )}
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c, i) => {
            const at = ytAt(contest.youtube_url, c.youtube_timestamp);
            const mine = voted.includes(c.id);
            const top = paying && i < 3;
            return (
              <li key={c.id} className={`rounded-lg overflow-hidden bg-ink border ${top ? "border-gulf border-2" : "border-line"}`}>
                <div className="relative aspect-video bg-ink-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.thumb && <img src={c.thumb} alt="" className="h-full w-full object-cover" />}
                  <ClipVideo clip={c} poster={c.thumb} />
                  {paying && <span className={`absolute left-0 top-3 display text-3xl px-3 py-1 ${top ? "bg-mango text-foam" : "bg-white text-foam"}`}>{i + 1}</span>}
                  {!paying && <span className="absolute left-0 top-3 bg-white/90 text-foam px-2.5 py-1 text-[11px] font-black tracking-wide">{c.gamertag.toUpperCase()}</span>}
                  {at && <a href={at} target="_blank" rel="noreferrer" className="absolute right-3 bottom-3 btn !py-1.5 !px-3 text-sm bg-white text-foam">Watch</a>}
                  {c.trending_until && new Date(c.trending_until) > new Date() && (
                    <span className="absolute right-3 top-3 rounded-full bg-flamingo px-2.5 py-1 text-[11px] font-black text-white">TRENDING</span>
                  )}
                  {watchers[c.id] > 0 && (
                    <span className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white">
                      <span className="rec" aria-hidden />{watchers[c.id]} watching now
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold leading-snug">{c.title}</p>
                  <p className="text-sm text-haze mt-1 flex items-center gap-1.5"><PlatformIcon name={c.platform} className="size-4" />{c.gamertag} on {platformName[c.platform]}</p>
                  {c.tags && c.tags.length > 0 && (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <li key={t}>
                          <button onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide
                              ${FLAGGED_SLUGS.has(t) ? "bg-flamingo text-white"
                                : tag === t ? "bg-gulf text-white" : "bg-ink-2 text-haze"}`}>
                            {TAG_LABEL[t] ?? t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {kingpins[c.id] >= 2 && (
                    <p className="mt-2 text-xs font-black uppercase tracking-wide text-mango">
                      Kingpins are voting heavily on this one
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {paying ? (
                      <span><span key={c.votes ?? 0} className="display text-3xl bump">{(c.votes ?? 0).toLocaleString()}</span> <span className="text-sm text-haze">votes</span></span>
                    ) : (
                      <Link href="/pricing" className="text-sm font-bold text-gulf underline-offset-4 hover:underline">Totals hidden</Link>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => download(c)} title={paying ? "Download this clip" : "Downloads are for members"}
                        className="btn btn-ghost !py-2 !px-3 text-sm">↓</button>
                      <button disabled={!open || Boolean(user && c.owner_id === user.id)} onClick={() => vote(c)}
                        title={user && c.owner_id === user.id ? "Your own clip" : undefined}
                        className={`btn !py-2 text-sm ${mine ? "bg-gulf text-white" : "btn-hot"} disabled:opacity-60`}>
                        {user && c.owner_id === user.id ? "Yours" : mine ? "Voted ✓" : "Vote"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        </>
      )}

      <p className="mt-10 text-sm text-haze">
        {paying
          ? `Your plan gives you ${maxVotes} votes, spread across different clips. Tap a vote again to take it back.`
          : "One vote per free account per round. You can move it until voting closes."}{" "}
        You can&apos;t vote for your own clip. Free accounts can win every prize.
      </p>

      {confirm && (() => {
        const c = confirm.clip;
        const closes = new Date(contest.voting_closes);
        const when = closes.toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
        const moving = maxVotes === 1 && voted.length > 0 && !voted.includes(c.id) ? clips.find((x) => x.id === voted[0]) : null;
        const after = confirm.state === "done" ? votesLeft : votesLeft - (maxVotes === 1 ? (voted.length ? 0 : 1) : 1);
        return (
          <div role="dialog" aria-modal="true" aria-labelledby="vote-t"
            className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4"
            onClick={() => confirm.state !== "busy" && setConfirm(null)}
            onKeyDown={(e) => e.key === "Escape" && confirm.state !== "busy" && setConfirm(null)}>
            <div className="vote-card w-full max-w-md overflow-hidden rounded-2xl border-2 border-line bg-ink" onClick={(e) => e.stopPropagation()}>
              <div className="relative aspect-[16/7] bg-ink-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.thumb && <img src={c.thumb} alt="" className="h-full w-full object-cover" />}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-3 pt-10 text-white">
                  <span className="block font-extrabold leading-snug">{c.title}</span>
                  <span className="text-sm opacity-85">{c.gamertag} on {platformName[c.platform]}</span>
                </span>
                {confirm.state === "done" && <span className="vote-stamp" aria-hidden>VOTED</span>}
              </div>
              <div className="p-6">
                {confirm.state === "done" ? (
                  <>
                    <h2 id="vote-t" className="display text-4xl">Vote counted.</h2>
                    <p className="mt-3 text-haze">
                      {maxVotes === 1
                        ? "That's your vote for this round."
                        : <><strong className="text-foam">{after}</strong> of {maxVotes} vote{maxVotes === 1 ? "" : "s"} left this round.</>}{" "}
                      Voting closes <strong className="text-foam">{when}</strong>.
                    </p>
                    <button autoFocus onClick={() => setConfirm(null)} className="btn btn-hot mt-6 w-full">Done</button>
                  </>
                ) : (
                  <>
                    <h2 id="vote-t" className="display text-4xl">Cast your vote?</h2>
                    <dl className="vote-facts mt-4">
                      <div><dt>Votes</dt><dd>{maxVotes === 1
                        ? (moving ? <>Moves your one vote from <strong>{moving.title}</strong></> : "Uses your one vote for this round")
                        : <>Uses 1 of your {maxVotes}. <strong>{Math.max(0, after)}</strong> left after this</>}</dd></div>
                      <div><dt>Deadline</dt><dd><strong>{when}</strong> · {left(contest.voting_closes).replace("Voting closes in ", "")} to go</dd></div>
                      <div><dt>Change it</dt><dd>Take it back or move it any time before the deadline</dd></div>
                    </dl>
                    <div className="mt-6 flex gap-3">
                      <button autoFocus onClick={confirmVote} disabled={confirm.state === "busy"} className="btn btn-hot flex-1">
                        {confirm.state === "busy" ? "Counting…" : moving ? "Move my vote" : "Cast my vote"}
                      </button>
                      <button onClick={() => setConfirm(null)} disabled={confirm.state === "busy"} className="btn btn-ghost">Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Download is members-only: explain and offer the upgrade rather than a dead button */}
      {ask && (
        <div role="dialog" aria-modal="true" aria-labelledby="dl-t"
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setAsk(null)}>
          <div className="w-full max-w-md rounded-xl bg-ink border-2 border-line p-6" onClick={(e) => e.stopPropagation()}>
            <h2 id="dl-t" className="display text-4xl">Downloads are for members</h2>
            <p className="mt-3 text-haze">
              Free accounts stream everything. Members get free download credits every month, and once
              those run out a download is {exactMoney(DOWNLOAD.priceCents)} —{" "}
              <strong className="text-foam">{exactMoney(DOWNLOAD.creatorCents)} of which goes to {ask.gamertag}</strong>,
              the player who made the clip.
            </p>
            <p className="mt-2 text-sm text-haze">Credit the player when you post it. On the site, every clip plays with their tag and our seal on it.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/pricing" className="btn btn-hot">See the plans</Link>
              <button onClick={() => setAsk(null)} className="btn btn-ghost">Not now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
