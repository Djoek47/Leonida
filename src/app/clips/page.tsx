"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import {
  castVote, clearVote, contestClips, currentContest, downloadWithCredit, exactMoney,
  money, myVotes, platformName, poolNow, ytAt, type Clip, type Contest, type Pool,
} from "@/lib/api";
import { useUser } from "@/lib/useUser";
import { sb } from "@/lib/supabase";
import { DOWNLOAD } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";
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

  async function vote(c: Clip) {
    if (!user) { setMsg("Sign in to vote. It's free and takes ten seconds."); return; }
    if (voted.includes(c.id)) {
      setVoted((v) => v.filter((x) => x !== c.id));
      const err = await clearVote(c.id);
      if (err) setMsg(err); else setMsg("Vote taken back.");
      return;
    }
    if (votesLeft <= 0 && paying) { setMsg(`You've used all ${maxVotes} of your votes this round. Take one back to move it.`); return; }
    const prev = voted;
    setVoted(paying ? [...voted, c.id] : [c.id]);
    const err = await castVote(c.id);
    if (err) {
      setVoted(prev);
      setMsg(err.includes("OUT_OF_VOTES") ? `You've used all ${maxVotes} of your votes this round.` : err);
    } else setMsg("Vote counted.");
  }

  const download = useCallback(async (c: Clip) => {
    if (!user) { setMsg("Sign in to download."); return; }
    if (!paying) { setAsk(c); return; }
    if (demo) { setMsg("Demo mode: a real download would spend a credit here."); return; }
    if (credits > 0) {
      const { error } = await downloadWithCredit(c.id);
      if (error === "NO_CREDITS") { setCredits(0); setMsg("That was your last credit. The next download is 99¢."); return; }
      if (error) { setMsg(error); return; }
      setCredits((n) => Math.max(0, n - 1));
      setMsg(`Downloading. ${exactMoney(DOWNLOAD.creatorCents)} goes to ${c.gamertag}.`);
      return;
    }
    const token = (await sb()?.auth.getSession())?.data.session?.access_token;
    const r = await fetch("/api/download", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ clipId: c.id }),
    });
    const j = await r.json();
    if (j.url) location.href = j.url; else setMsg(j.error ?? "Could not start the download.");
  }, [user, paying, credits, demo]);

  if (!contest) return <div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading this week&apos;s round…</div>;

  // Free accounts don't see tallies, so the order they get is the submission order.
  const sorted = paying ? [...clips].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)) : clips;
  const open = contest.status === "voting" && new Date(contest.voting_closes) > new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <DemoNote />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="lower-third text-sm mb-4"><span className="tag">{open ? <><span className="rec" />Voting</> : "Round"}</span><span className="txt">{left(contest.voting_closes)}</span></div>
          <h1 className="display text-6xl md:text-8xl">{contest.title}</h1>
        </div>
        <div className="flex gap-6 text-right">
          {contest.split.map((s, i) => (
            <div key={i}><p className="display text-4xl text-gulf">{money(contest.pool_cents * s)}</p><p className="text-sm text-haze">{["1st", "2nd", "3rd"][i]}</p></div>
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
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c, i) => {
            const at = ytAt(contest.youtube_url, c.youtube_timestamp);
            const mine = voted.includes(c.id);
            const top = paying && i < 3;
            return (
              <li key={c.id} className={`rounded-lg overflow-hidden bg-ink border ${top ? "border-gulf border-2" : "border-line"}`}>
                <div className="relative aspect-video bg-ink-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.thumb && <img src={c.thumb} alt="" className="h-full w-full object-cover" />}
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
                      <button disabled={!open} onClick={() => vote(c)}
                        className={`btn !py-2 text-sm ${mine ? "bg-gulf text-white" : "btn-hot"} disabled:opacity-60`}>
                        {mine ? "Voted ✓" : "Vote"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-10 text-sm text-haze">
        {paying
          ? `Your plan gives you ${maxVotes} votes, spread across different clips. Tap a vote again to take it back.`
          : "One vote per free account per round. You can move it until voting closes."}{" "}
        You can&apos;t vote for your own clip. Free accounts can win every prize.
      </p>

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
            <p className="mt-2 text-sm text-haze">Every file carries the uploader&apos;s name on the video.</p>
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
