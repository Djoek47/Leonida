"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { openContests, type Clip, type Contest } from "@/lib/api";

const MSG: Record<string, string> = {
  CLIP_ALREADY_WON: "This clip has already won a prize, so it can't be submitted again.",
  CLIP_WITHDRAWN: "Withdrawn clips can't be entered again.",
  ALREADY_IN_ROUND: "This clip is already in a round that hasn't finished.",
  ROUND_CLOSED: "That week has stopped taking clips. Pick another one.",
  WEEKLY_LIMIT: "You've used your clip allowance for that week. Pick another week.",
};
const nice = (m: string) => Object.entries(MSG).find(([k]) => m.includes(k))?.[1] ?? "Couldn't resubmit that clip. Try again.";

/** Which of your clips have won a weekly/monthly prize (never resubmittable), and which sit in a finished round. */
export function useResubmitInfo(clips: Clip[], userId?: string) {
  const [won, setWon] = useState<Set<string>>(new Set());
  const [over, setOver] = useState<Set<string>>(new Set());
  useEffect(() => {
    const c = sb(); if (!c || !userId || !clips.length) return;
    c.from("winnings").select("clip_id").eq("owner_id", userId).then(({ data }) =>
      setWon(new Set(((data ?? []) as { clip_id: string }[]).map((w) => w.clip_id))));
    const ids = Array.from(new Set(clips.map((x) => x.contest_id).filter(Boolean))) as string[];
    if (!ids.length) return;
    c.from("contests").select("id,status,voting_closes").in("id", ids).then(({ data }) => {
      const done = new Set(((data ?? []) as { id: string; status: string; voting_closes: string }[])
        .filter((k) => ["closed", "paid"].includes(k.status) || new Date(k.voting_closes).getTime() <= Date.now()).map((k) => k.id));
      setOver(new Set(clips.filter((x) => x.status === "rejected" || (x.contest_id && done.has(x.contest_id))).map((x) => x.id)));
    });
  }, [clips, userId]);
  return { won, over };
}

/** "Resubmit" for a clip that hasn't won: pick the next available week from the menu. */
export function ResubmitClip({ clip, onDone }: { clip: Clip; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rounds, setRounds] = useState<Contest[] | null>(null);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!open || rounds) return;
    openContests().then((rs) => { const r = rs.filter((x) => x.id !== clip.contest_id); setRounds(r); setPick(r[0]?.id ?? ""); }).catch(() => setRounds([]));
  }, [open, rounds, clip.contest_id]);
  async function go() {
    const c = sb(); if (!c || !pick) return;
    setBusy(true); setErr("");
    const { error } = await c.rpc("resubmit_clip", { p_clip: clip.id, p_contest: pick });
    setBusy(false);
    if (error) { setErr(nice(error.message)); return; }
    setOpen(false); onDone();
  }
  if (!open) return <button onClick={() => setOpen(true)} className="pull-out" title="Send this clip to another week">Resubmit</button>;
  return (
    <div className="flex flex-wrap items-center gap-2 w-full mt-2">
      <label className="sr-only" htmlFor={`rs-${clip.id}`}>Week to resubmit to</label>
      <select id={`rs-${clip.id}`} className="field !w-auto !py-1.5 text-sm" value={pick} onChange={(e) => setPick(e.target.value)} disabled={busy || !rounds?.length}>
        {rounds === null ? <option>Loading weeks…</option> : rounds.length === 0 ? <option>No open weeks</option>
          : rounds.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
      </select>
      <button className="btn btn-hot !py-1.5 !px-3 text-sm" onClick={go} disabled={busy || !pick}>{busy ? "Sending…" : "Resubmit"}</button>
      <button className="text-sm underline" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
      {err && <p role="alert" className="w-full text-sm font-semibold text-flamingo">{err}</p>}
    </div>
  );
}
