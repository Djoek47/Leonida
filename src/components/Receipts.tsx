"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { exactMoney } from "@/lib/api";

type Item = { id: string; kind: "invoice" | "payment"; at: number; cents: number; what: string; status: string | null;
  number: string | null; view: string | null; pdf: string | null };

/** Bills and receipts from Stripe, under the wallet. */
export function Receipts({ always = false }: { always?: boolean }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    (async () => {
      const t = (await sb()?.auth.getSession())?.data.session?.access_token;
      if (!t) { setItems([]); return; }
      const r = await fetch("/api/billing/receipts", { method: "POST", headers: { authorization: `Bearer ${t}` } });
      const j = await r.json().catch(() => ({ items: [] }));
      setItems(j.items ?? []);
    })();
  }, []);
  if (!items) return always ? <p className="text-haze">Loading receipts…</p> : null;
  if (items.length === 0) return always ? (
    <section><h3 className="money-h">Receipts</h3>
      <p className="text-haze">No payments yet. Every plan payment and paid download shows up here with its Stripe receipt.</p></section>
  ) : null;
  const shown = open || always ? items : items.slice(0, 3);
  return (
    <section className="receipts">
      <h3 className="money-h">Receipts<span className="tail">from Stripe</span></h3>
      <ul className="roll">
        {shown.map((i) => (
          <li key={i.id}>
            <span className="what">
              <b className="truncate">{i.what}</b>
              <small>
                {new Date(i.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                {i.number ? ` · ${i.number}` : ""}
                <span className={`rc-status ml-2 ${i.status === "paid" ? "ok" : ""}`}>{i.status}</span>
              </small>
            </span>
            <span className="amt">{exactMoney(i.cents)}</span>
            <span className="rc-links">
              {i.view && <a href={i.view} target="_blank" rel="noreferrer">View</a>}
              {i.pdf && <a href={i.pdf} target="_blank" rel="noreferrer">PDF</a>}
            </span>
          </li>
        ))}
      </ul>
      {items.length > 3 && <button onClick={() => setOpen(!open)} className="mt-2 text-sm font-bold text-gulf underline underline-offset-4">{open ? "Show less" : `All ${items.length}`}</button>}
    </section>
  );
}
