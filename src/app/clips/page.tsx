"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { castVote, contestClips, currentContest, money, myVote, platformName, votingMode, ytAt, type Clip, type Contest, type VotingMode } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import { DemoNote } from "@/components/DemoNote";
import { PlatformIcon } from "@/components/Icons";

function left(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Voting closed";
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return `Voting closes in ${d}d ${h}h`;
}
const embed = (u: string) => u.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");

export default function ClipsPage() {
  const { user, profile } = useUser();
  const [mode, setMode] = useState<VotingMode>("club");
  const [contest, setContest] = useState<Contest | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [voted, setVoted] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    currentContest().then(async (c) => {
      setContest(c);
      setClips(await contestClips(c.id));
      setVoted(await myVote(c.id));
      setMode(await votingMode());
    });
  }, []);

  async function vote(id: string) {
    if (!user) { setMsg("Sign in to vote. It's free and takes ten seconds."); return; }
    if (mode === "club" && !profile?.is_club) { setMsg("Voting is open to Triple Comma Club members for now."); return; }
    const prev = voted;
    setVoted(id);
    setClips((cs) => cs.map((c) => ({ ...c, votes: c.votes + (c.id === id ? 1 : 0) - (c.id === prev ? 1 : 0) })));
    const err = await castVote(id);
    if (err) { setMsg(err); setVoted(prev); } else setMsg(prev ? "Vote moved." : "Vote counted.");
  }

  if (!contest) return <div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading this week&apos;s round…</div>;
  const sorted = [...clips].sort((a, b) => b.votes - a.votes);
  const open = contest.status === "voting" && new Date(contest.voting_closes) > new Date();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <DemoNote />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
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

      {mode === "club" && (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border-2 border-mango bg-mango/20 px-4 py-3 text-sm font-semibold">
          <span>Right now, only Triple Comma Club members vote. Everyone can watch.</span>
          <Link href="/club" className="underline">How to join</Link>
        </p>
      )}
      {msg && <p role="status" className="mt-6 inline-block bg-ink-2 px-4 py-2 rounded font-semibold">{msg} {!user && <Link className="text-gulf underline" href="/login">Sign in</Link>}</p>}

      {sorted.length === 0 ? (
        <div className="mt-16 text-center py-20 border border-dashed border-line rounded-lg">
          <p className="display text-5xl">No clips in this round yet</p>
          <p className="text-haze mt-3">Be the first one in.</p>
          <Link href="/submit" className="btn btn-hot mt-6">Send a clip</Link>
        </div>
      ) : (
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c, i) => {
            const at = ytAt(contest.youtube_url, c.youtube_timestamp);
            const mine = voted === c.id;
            return (
              <li key={c.id} className={`rounded-lg overflow-hidden bg-ink border ${i < 3 ? "border-gulf border-2" : "border-line"}`}>
                <div className="relative aspect-video bg-ink-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.thumb && <img src={c.thumb} alt="" className="h-full w-full object-cover" />}
                  <span className={`absolute left-0 top-3 display text-3xl px-3 py-1 ${i < 3 ? "bg-mango text-foam" : "bg-white text-foam"}`}>{i + 1}</span>
                  {at && <a href={at} target="_blank" rel="noreferrer" className="absolute right-3 bottom-3 btn !py-1.5 !px-3 text-sm bg-white text-foam">Watch</a>}
                </div>
                <div className="p-4">
                  <p className="font-bold leading-snug">{c.title}</p>
                  <p className="text-sm text-haze mt-1 flex items-center gap-1.5"><PlatformIcon name={c.platform} className="size-4" />{c.gamertag} on {platformName[c.platform]}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span><span key={c.votes} className="display text-3xl bump">{c.votes.toLocaleString()}</span> <span className="text-sm text-haze">votes</span></span>
                    <button disabled={!open || mine} onClick={() => vote(c.id)}
                      className={`btn !py-2 text-sm ${mine ? "bg-gulf text-white" : "btn-hot"} disabled:opacity-90`}>
                      {mine ? "Your vote" : voted ? "Move my vote here" : "Vote"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-10 text-sm text-haze">{mode === "club" ? "Club members get one vote per round." : "One vote per account per round."}{" "}You can move it until voting closes. You can&apos;t vote for your own clip.</p>
    </div>
  );
}
