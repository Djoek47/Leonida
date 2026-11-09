"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
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

export function Wallet({ payoutReady }: { payoutReady: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [demo, setDemo] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const c = sb();
    if (!c) { setEntries(DEMO); setDemo(true); return; }
    const { data } = await c.from("wallet_entries")
      .select("id,amount_cents,kind,note,created_at").order("created_at", { ascending: false }).limit(50);
    setEntries((data ?? []) as Entry[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const balance = entries.reduce((n, e) => n + e.amount_cents, 0);

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) { setErr("Enter an amount."); return; }
    if (cents > balance) { setErr("That's more than your balance."); return; }
    setBusy(true); setErr(""); setMsg("");
    const c = sb();
    if (!c) { setMsg("Demo mode — nothing was moved."); setBusy(false); return; }
    const { error } = await c.rpc("request_withdrawal", { p_cents: cents });
    setBusy(false);
    if (error) {
      setErr(error.message.includes("INSUFFICIENT_FUNDS") ? "That's more than your balance." : error.message);
    } else {
      setAmount(""); setMsg("Requested. It goes out with the next payout run."); load();
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-extrabold">Your money</h2>

      <div className="vault-read led-board mt-4">
        <p className="led-tag text-xs">BALANCE</p>
        <p className="led-text vault-total">{exactMoney(balance)}</p>
        <p className="led-tag text-xs">
          {entries.length ? `${entries.length} movement${entries.length === 1 ? "" : "s"}` : "NOTHING YET"}
        </p>
      </div>

      {balance > 0 && (
        payoutReady ? (
          <form onSubmit={withdraw} className="mt-4 flex flex-wrap items-end gap-2 [&>*]:min-w-0">
            <label className="grid gap-1.5 flex-1 min-w-[9rem]">
              <span className="text-sm font-bold">Cash out</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
                placeholder={(balance / 100).toFixed(2)} className="field" aria-label="Amount to cash out" />
            </label>
            <button disabled={busy} className="btn btn-hot shrink-0 disabled:opacity-70">
              {busy ? "Sending…" : "Cash out"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-haze">
            Add a payout account below and we can send this out.
          </p>
        )
      )}
      {msg && <p role="status" className="mt-3 font-semibold text-gulf">{msg}</p>}
      {err && <p role="alert" className="mt-3 font-semibold text-flamingo">{err}</p>}

      {entries.length > 0 && (
        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line">
          {entries.map((e) => (
            <li key={e.id} className="bg-ink px-4 py-3 flex items-baseline justify-between gap-4">
              <span className="min-w-0">
                <span className="font-semibold block truncate">{KIND[e.kind] ?? e.kind}</span>
                <span className="text-xs text-haze"><When iso={e.created_at} />{e.note ? ` · ${e.note}` : ""}</span>
              </span>
              <span className={`font-black tabular-nums shrink-0 ${e.amount_cents > 0 ? "text-gulf" : "text-haze"}`}>
                {e.amount_cents > 0 ? "+" : "−"}{exactMoney(Math.abs(e.amount_cents))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {demo && <p className="mt-3 text-xs text-haze">Demo figures. Real balances appear once you sign in.</p>}
    </section>
  );
}
