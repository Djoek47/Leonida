"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import type { Profile } from "@/lib/useUser";
import { money, type Winning } from "@/lib/api";

const methods = [["paypal", "PayPal"], ["venmo", "Venmo"], ["cashapp", "Cash App"], ["interac", "Interac e-Transfer"]] as const;

async function call(url: string, body: object) {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

/** Where your money goes: Stripe straight to card or bank, or PayPal and co. sent by staff. */
export function GetPaid({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const [way, setWay] = useState<"stripe" | "other">(profile.payout_method && profile.payout_method !== "stripe" ? "other" : "stripe");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!new URLSearchParams(location.search).has("stripe")) return;
    history.replaceState(null, "", "/wallet#payout");
    call("/api/payout/stripe", { action: "status" }).then((j) => {
      setNote(j.ready ? "Stripe connected. Cash-outs now go to your card or bank." : "Stripe still needs a detail or two. Press Connect with Stripe to finish.");
      if (j.ready) setProfile({ ...profile, payout_method: "stripe", payout_handle: "Stripe account", stripe_connect_ready: true });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function connect() {
    setBusy(true);
    const j = await call("/api/payout/stripe", { action: "connect" });
    if (j.url) { location.href = j.url; return; }
    setBusy(false);
    if (String(j.error ?? "").includes("switched on")) {
      setWay("other");
      setNote("Card and bank payouts aren't available yet. Use PayPal, Venmo, Cash App or Interac for now; nothing is lost, your wallet keeps the money.");
    } else setNote(j.error ?? "Couldn't open Stripe.");
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = { payout_method: String(f.get("method")), payout_handle: String(f.get("handle")) };
    const c = sb(); if (c) await c.from("profiles").update(patch).eq("id", profile.id);
    setProfile({ ...profile, ...patch }); setNote("Saved.");
  }

  return (
    <section>
      <h2 id="payout" className="money-h scroll-mt-28">Get paid</h2>
      <div className="pay-tabs" role="radiogroup" aria-label="Payout method">
        <button type="button" role="radio" aria-checked={way === "stripe"} onClick={() => setWay("stripe")} className={way === "stripe" ? "on" : ""}>
          <b>Card or bank</b><span>Instant, via Stripe</span></button>
        <button type="button" role="radio" aria-checked={way === "other"} onClick={() => setWay("other")} className={way === "other" ? "on" : ""}>
          <b>Payout apps</b><span>Sent by staff</span></button>
      </div>
      <div className="mt-4 grid gap-3 max-w-sm">
      {way === "stripe" ? (
        profile.stripe_connect_ready && profile.payout_method === "stripe"
          ? <p className="font-bold text-gulf">Stripe connected. Cash-outs go straight to your card or bank.</p>
          : <button onClick={connect} disabled={busy} className="btn btn-hot w-fit !py-2">{busy ? "Opening Stripe…" : "Connect with Stripe"}</button>
      ) : (
        <form onSubmit={save} className="grid gap-3">
          <select name="method" defaultValue={profile.payout_method && profile.payout_method !== "stripe" ? profile.payout_method : "paypal"} className="field">{methods.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="handle" defaultValue={profile.payout_method !== "stripe" ? profile.payout_handle ?? "" : ""} required className="field" placeholder="Email, @username or $cashtag" />
          <button className="btn btn-hot w-fit !py-2">Save</button>
        </form>
      )}
      </div>
      {note && <p role="status" className="mt-3 text-sm font-semibold text-gulf">{note}</p>}
    </section>
  );
}

const winText: Record<string, string> = { unclaimed: "Being checked", requested: "Being checked", verifying: "Checking your gamertag", sent: "In your wallet", held: "On hold" };

/** Prize history. */
export function Winnings({ userId }: { userId: string }) {
  const [wins, setWins] = useState<Winning[]>([]);
  const load = useCallback(() => {
    sb()?.from("winnings").select("*").eq("owner_id", userId).then(({ data }) => setWins((data as Winning[]) ?? []));
  }, [userId]);
  useEffect(() => { load(); }, [load]);
  if (!wins.length) return null;
  return (
    <section>
      <h2 className="money-h">Prizes</h2>
      <ul className="roll">{wins.map((w) => (
        <li key={w.id}>
          <span className={`place-chip p${w.place}`}>{["1st", "2nd", "3rd"][w.place - 1]}</span>
          <span className="what"><b>{winText[w.status] ?? w.status}</b></span>
          <span className="amt in">{money(w.amount_cents)}</span>
        </li>))}</ul>
      <div className="roll-tear" aria-hidden />
      <Link href="/rules" className="mt-2 inline-block text-xs text-haze underline">How prizes are checked</Link>
    </section>
  );
}
