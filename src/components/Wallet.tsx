"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import Link from "@/components/A";
import { exactMoney } from "@/lib/api";

export type Entry = {
  id: number; amount_cents: number; kind: string; note: string | null; created_at: string;
};

/** Plain words for each ledger kind, so a member can read their own history. */
const KIND: Record<string, string> = {
  admin_credit: "Added by Leonida",
  admin_debit: "Taken off by Leonida",
  prize: "Prize money",
  clip_earning: "Clip earnings",
  download_earning: "Download earnings",
  withdrawal: "Paid out to you",
  refund: "Refund",
  adjustment: "Adjustment",
};

const DEMO: Entry[] = [
  { id: 3, amount_cents: -2000, kind: "withdrawal", note: null, created_at: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: 2, amount_cents: 625, kind: "prize", note: "Place 2", created_at: new Date(Date.now() - 6 * 864e5).toISOString() },
  { id: 1, amount_cents: 2100, kind: "download_earning", note: "30 downloads", created_at: new Date(Date.now() - 9 * 864e5).toISOString() },
];

function When({ iso }: { iso: string }) {
  const [t, setT] = useState("");
  useEffect(() => { setT(new Date(iso).toLocaleDateString()); }, [iso]);
  return <span suppressHydrationWarning>{t}</span>;
}

type Prize = { id: string; place: number; amount_cents: number; status: string; sent_at: string | null };
/** Where a prize stands, in plain words. */
const PRIZE_STATUS: Record<string, [string, string]> = {
  unclaimed: ["Won", "We're confirming the result. It lands in your wallet once confirmed."],
  requested: ["Being processed", "Staff are processing this prize."],
  verifying: ["Checking your gamertag", "Verify your gamertag on your dashboard so we can release it."],
  held: ["On hold", "Something needs a look. Contact support and we'll sort it out."],
  sent: ["In your wallet", "Paid into your wallet. You can cash it out."],
};
const PLACE = ["", "1st place", "2nd place", "3rd place"];

export function Wallet({ payoutReady }: { payoutReady: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [demo, setDemo] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  // Split from the server: this month's download earnings are pending until
  // month-end; everything else (prizes included) is available now.
  const [split, setSplit] = useState<{ pending_cents: number; available_cents: number; releases_at: string } | null>(null);

  const load = useCallback(async () => {
    const c = sb();
    if (!c) {
      setEntries(DEMO); setDemo(true);
      setSplit({ pending_cents: 2100, available_cents: 625, releases_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString() });
      return;
    }
    const me = (await c.auth.getUser()).data.user?.id;
    if (!me) return;
    c.from("winnings").select("id,place,amount_cents,status,sent_at").eq("owner_id", me).order("requested_at", { ascending: false, nullsFirst: true }).limit(20)
      .then(({ data: w }) => setPrizes((w as Prize[]) ?? []));
    const [{ data }, { data: sp }] = await Promise.all([
      c.from("wallet_entries").select("id,amount_cents,kind,note,created_at").eq("player_id", me).order("created_at", { ascending: false }).limit(50),
      c.rpc("wallet_split"),
    ]);
    setEntries((data ?? []) as Entry[]);
    setSplit(((sp ?? [])[0] as typeof split) ?? null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = entries.reduce((n, e) => n + e.amount_cents, 0);
  const balance = split ? split.available_cents : total;   // what can actually be withdrawn
  const pending = split?.pending_cents ?? 0;
  const releaseOn = split ? new Date(split.releases_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";
  const payouts = entries.filter((e) => e.kind === "withdrawal");

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setErr("Enter an amount."); return; }
    if (cents > balance) { setErr("That's more than you can withdraw right now. This month's download earnings unlock at month-end."); return; }
    setBusy(true); setErr(""); setMsg("");
    const c = sb();
    if (!c) { setMsg("Demo mode — nothing was moved."); setBusy(false); return; }
    const token = (await c.auth.getSession()).data.session?.access_token;
    const r = await fetch("/api/wallet/withdraw", { method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ cents }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Couldn't start that. Try again."); load(); return; }
    setAmount("");
    setMsg(j.sent ? "Sent to your Stripe account. It reaches your card or bank on Stripe's schedule." : "Requested. Staff send it, usually within a few days.");
    load();
  }

  return (
    <section className="mt-8">
      <div className="vault-read led-board">
        <p className="led-tag text-xs">AVAILABLE TO WITHDRAW</p>
        <p className="led-text vault-total">{exactMoney(balance)}</p>
        <p className="led-tag text-xs">PENDING {exactMoney(pending)} · UNLOCKS {releaseOn.toUpperCase()}
          <button type="button" onClick={() => setInfo((x) => !x)} aria-expanded={info} aria-label="How payouts work" className="info-star">★</button></p>
      </div>

      <dl className="money-split">
        <div><dt>Pending earnings</dt><dd>{exactMoney(pending)}</dd><dd className="sub">Becomes available {releaseOn}</dd></div>
        <div><dt>Available to withdraw</dt><dd>{exactMoney(balance)}</dd><dd className="sub">Prizes land here straight away</dd></div>
        <div><dt>Paid out so far</dt><dd>{exactMoney(-payouts.reduce((n, e) => n + e.amount_cents, 0))}</dd><dd className="sub">{payouts.length} payout{payouts.length === 1 ? "" : "s"}</dd></div>
      </dl>
      {prizes.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {prizes.map((p) => {
            const [label, hint] = PRIZE_STATUS[p.status] ?? [p.status, ""];
            return (
              <li key={p.id} className="set-card !mt-0 flex flex-wrap items-center justify-between gap-2 !py-3">
                <span className="font-black">{PLACE[p.place] ?? "Prize"} · {exactMoney(p.amount_cents)}</span>
                <span className={`text-sm font-bold ${p.status === "sent" ? "text-[#2fd27a]" : p.status === "held" ? "text-flamingo" : "text-haze"}`} title={hint}>{label}</span>
                <span className="w-full text-xs text-haze">{hint}</span>
              </li>
            );
          })}
        </ul>
      )}
      {info && (
        <div role="note" className="set-card mt-3 grid gap-2 text-sm text-haze">
          <p>Your download earnings build up through the month and become available to withdraw at the end of the month.</p>
          <p>Why the wait? We pay download earnings out once a month instead of one by one. Every payout carries a small processing fee, so batching them keeps more of your money in your pocket, and it gives us time to catch refunds or fake downloads before cash leaves.</p>
          <p>Prizes are not held. They land here straight away.</p>
        </div>
      )}

      {balance > 0 && (
        payoutReady ? (
          <form onSubmit={withdraw} className="mt-5 flex flex-wrap items-end gap-2 [&>*]:min-w-0">
            <label className="grid gap-1.5 flex-1 min-w-[9rem] max-w-xs">
              <span className="text-sm font-bold">Cash out</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
                placeholder={(balance / 100).toFixed(2)} className="field" aria-label="Amount to cash out" />
            </label>
            <button disabled={busy} className="btn btn-hot shrink-0 disabled:opacity-70">
              {busy ? "Sending…" : "Cash out"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-haze">Set a payout route below and we can send this out.</p>
        )
      )}
      {msg && <p role="status" className="mt-3 font-semibold text-gulf">{msg}</p>}
      {err && <p role="alert" className="mt-3 font-semibold text-flamingo">{err}</p>}

      {/* An empty wallet is the normal first state, so say how it fills. */}
      {entries.length === 0 ? (
        <>
          <h2 className="money-h">How money lands here</h2>
          <ul className="money-howto">
            <li><b>Win a week.</b> Gold, silver and bronze are paid in here once staff confirm the gamertag.</li>
            <li><b>Sell a clip.</b> Every member download pays the player who made it, for as long as people keep downloading.</li>
            <li><b>Cash out</b> whenever you like — card, bank, or PayPal and the rest.</li>
          </ul>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/submit" className="btn btn-hot !py-2">Send a clip</Link>
            <Link href="/earn" className="btn btn-ghost !py-2">How earning works</Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="money-h">Payout history and movements{demo && <span className="tail">demo figures</span>}</h2>
          <ul className="roll">
            {entries.map((e) => (
              <li key={e.id}>
                <span className="what">
                  <b>{KIND[e.kind] ?? e.kind}</b>
                  <small><When iso={e.created_at} />{e.note ? ` · ${e.note}` : ""}</small>
                </span>
                <span className={`amt ${e.amount_cents > 0 ? "in" : "out"}`}>
                  {e.amount_cents > 0 ? "+" : "−"}{exactMoney(Math.abs(e.amount_cents))}
                </span>
              </li>
            ))}
          </ul>
          <div className="roll-tear" aria-hidden />
        </>
      )}
    </section>
  );
}
