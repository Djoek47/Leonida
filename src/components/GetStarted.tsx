"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import type { Account } from "@/lib/useUser";

type P = { clip: boolean; gamertag: boolean; payout: boolean; voted: boolean; claimed: boolean };

/** Four first moves, as a little mission. Finish all four and claim a bonus
 *  vote that stays on the account for good. Checked by the database, so the
 *  reward can't be clicked into existence. Gone once claimed. */
export function GetStarted({ account, onClaimed, onGamertag }: {
  account: Account | null; onClaimed: () => void; onGamertag: () => void;
}) {
  const [p, setP] = useState<P | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    const c = sb(); if (!c) return;
    const { data } = await c.rpc("starter_progress");
    setP(((data as P[] | null) ?? [])[0] ?? null);
  }, []);
  useEffect(() => { load(); }, [load, account]);

  if (!p || (p.claimed && !done)) return null;

  const steps: [boolean, string, string, string | (() => void)][] = [
    [p.clip, "Send a clip", "▶", "/submit"],
    [p.gamertag, "Your gamertag", "◎", onGamertag],
    [p.payout, "Get-paid account", "$", "#payout"],
    [p.voted, "Cast a vote", "★", "/clips"],
  ];
  const n = steps.filter(([d]) => d).length;
  const all = n === steps.length;

  async function claim() {
    setBusy(true);
    const c = sb(); const { error } = c ? await c.rpc("claim_starter_bonus") : { error: null };
    setBusy(false);
    if (!error) { setDone(true); onClaimed(); }
  }

  return (
    <section className={`mission ${all ? "is-ready" : ""} ${done ? "is-done" : ""}`}>
      <div className="mission-head">
        <p className="mission-k">Mission · {n}/4</p>
        <p className="mission-prize">Reward <b>+1 vote</b> for good</p>
      </div>
      <div className="mission-bar" aria-hidden><i style={{ width: `${(n / 4) * 100}%` }} /></div>
      {done ? (
        <p className="mission-win">Bonus vote unlocked. You now hold {(account?.votes ?? 1) + 1} votes every round.</p>
      ) : (
        <ol className="mission-steps">
          {steps.map(([ok, label, icon, go]) => {
            const inner = <><span className="mission-ico">{ok ? "✓" : icon}</span><span>{label}</span></>;
            return (
              <li key={label} className={ok ? "is-ok" : ""}>
                {ok ? <span className="mission-step">{inner}</span>
                  : typeof go === "string" ? <Link href={go} className="mission-step">{inner}</Link>
                  : <button type="button" onClick={go} className="mission-step">{inner}</button>}
              </li>
            );
          })}
        </ol>
      )}
      {all && !done && (
        <button onClick={claim} disabled={busy} className="btn btn-hot mission-claim">{busy ? "Claiming…" : "Claim your bonus vote"}</button>
      )}
    </section>
  );
}
