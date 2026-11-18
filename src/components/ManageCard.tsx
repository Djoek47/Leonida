"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

type Card = { brand: string; last4: string; exp_month: number; exp_year: number };
const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", discover: "Discover", diners: "Diners Club", jcb: "JCB", unionpay: "UnionPay" };

async function call(action?: string) {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch("/api/billing/portal", {
    method: "POST",
    headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify({ action }),
  });
  return { ok: r.ok, j: (await r.json().catch(() => ({}))) as { url?: string; card?: Card | null; error?: string; mock?: boolean } };
}

/** The card behind a paid plan, with one button into Stripe's page to change it.
 *  Stripe hosts the card form, so card numbers never touch this site. */
export function ManageCard() {
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    call("card").then(({ j }) => { if (live) setCard(j.mock ? null : j.card ?? null); }).catch(() => { if (live) setCard(null); });
    return () => { live = false; };
  }, []);

  async function open() {
    setBusy(true); setErr(null);
    try {
      const { ok, j } = await call();
      if (j.mock) { setErr("Card changes aren't available in test mode."); setBusy(false); return; }
      if (ok && j.url) { location.href = j.url; return; }
      setErr(j.error ?? "Couldn't open your card settings. Try again in a minute.");
    } catch { setErr("Couldn't open your card settings. Try again in a minute."); }
    setBusy(false);
  }

  const expired = card ? new Date(2000 + (card.exp_year % 100), card.exp_month, 1) <= new Date() : false;
  return (
    <div id="card" className="plan-line">
      <div className="who">
        <p className="display text-3xl">{card ? `${BRAND[card.brand] ?? "Card"} ending ${card.last4}` : card === undefined ? "Checking your card…" : "No card found"}</p>
        {card && <p className={`text-sm mt-1 ${expired ? "font-semibold text-flamingo" : "text-haze"}`}>{expired ? "Expired " : "Expires "}{String(card.exp_month).padStart(2, "0")}/{String(card.exp_year).slice(-2)}</p>}
        <p className="text-sm text-haze mt-1 max-w-xl">Add a new card, switch your default, fix your billing address or remove an old card. Stripe needs one card on file while your plan is active, so add the new one before removing the old one.</p>
        {err && <p role="alert" className="text-sm font-semibold text-flamingo mt-2">{err}</p>}
      </div>
      <div className="plan-acts">
        <button onClick={open} disabled={busy} className="btn btn-hot !py-2 disabled:opacity-70">{busy ? "Opening…" : "Update or remove card"}</button>
      </div>
    </div>
  );
}
