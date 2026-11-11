"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { exactMoney } from "@/lib/api";

type Day = { day: string; sales_cents: number; creator_cents: number; paid_out_cents: number; new_members: number };
type M = {
  series: Day[]; mrr_cents: number; subscribers: Record<string, number>; weekly_pool_cents: number;
  owed: { wallets_cents: number; creators_pending_cents: number; prizes_waiting_cents: number };
  lifetime: { sales_cents: number; paid_out_cents: number };
};

const DEMO: M = {
  series: Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10), sales_cents: Math.round(200 + Math.abs(Math.sin(i / 3)) * 900), creator_cents: Math.round(140 + Math.abs(Math.sin(i / 3)) * 630), paid_out_cents: i % 9 === 0 ? 2000 : 0, new_members: Math.round(2 + Math.abs(Math.cos(i / 4)) * 9) })),
  mrr_cents: 61 * 900, subscribers: { street: 30, hustler: 22, kingpin: 9 }, weekly_pool_cents: 3000,
  owed: { wallets_cents: 18400, creators_pending_cents: 9100, prizes_waiting_cents: 6000 }, lifetime: { sales_cents: 128000, paid_out_cents: 54000 },
};

const $ = (c: number) => exactMoney(c);

/** Bars with an optional second series drawn inside the first. Pure SVG: no chart library. */
function Bars({ days, a, b, aLabel, bLabel, fmt }: { days: Day[]; a: (d: Day) => number; b?: (d: Day) => number; aLabel: string; bLabel?: string; fmt: (n: number) => string }) {
  const [hot, setHot] = useState<number | null>(null);
  const W = 640, H = 170, pad = 4, max = Math.max(1, ...days.map(a));
  const bw = (W - pad * 2) / days.length;
  const d = hot != null ? days[hot] : null;
  return (
    <div>
      <p className="mb-1 flex flex-wrap gap-x-4 text-xs text-haze">
        <span><i className="mr-1 inline-block size-2 rounded-sm bg-[#ff3d8b]" />{aLabel}</span>
        {b && <span><i className="mr-1 inline-block size-2 rounded-sm bg-[#2fd27a]" />{bLabel}</span>}
        <span className="ml-auto font-bold text-foam">{d ? `${d.day.slice(5)} · ${fmt(a(d))}${b ? ` · ${fmt(b(d))}` : ""}` : `Peak ${fmt(max)}`}</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={aLabel} onPointerLeave={() => setHot(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={W} y1={H - f * (H - 14)} y2={H - f * (H - 14)} stroke="currentColor" strokeOpacity=".08" />)}
        {days.map((x, i) => {
          const h = (a(x) / max) * (H - 14), h2 = b ? (b(x) / max) * (H - 14) : 0;
          return (
            <g key={x.day} onPointerEnter={() => setHot(i)}>
              <rect x={pad + i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect x={pad + i * bw + 1} y={H - h} width={Math.max(1, bw - 2)} height={Math.max(h, a(x) ? 2 : 0)} rx={2} fill="#ff3d8b" opacity={hot === i ? 1 : 0.85} />
              {b && <rect x={pad + i * bw + 1} y={H - h2} width={Math.max(1, bw - 2)} height={Math.max(h2, b(x) ? 2 : 0)} rx={2} fill="#2fd27a" opacity={hot === i ? 1 : 0.85} />}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 flex justify-between text-[10px] text-haze"><span>{days[0]?.day.slice(5)}</span><span>{days[days.length - 1]?.day.slice(5)}</span></p>
    </div>
  );
}

export function useMoney(days = 30) {
  const [m, setM] = useState<M | null>(null);
  const load = useCallback(async () => {
    const c = sb(); if (!c) { setM(DEMO); return; }
    const { data } = await c.rpc("console_money", { p_days: days });
    if (data) setM(data as M);
  }, [days]);
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);
  return m;
}

export function MoneyPanel({ compact }: { compact?: boolean }) {
  const [days, setDays] = useState(30);
  const m = useMoney(days);
  if (!m) return <p className="text-haze">Counting the money…</p>;
  const sum = (f: (d: Day) => number) => m.series.reduce((n, d) => n + f(d), 0);
  const sales = sum((d) => d.sales_cents), share = sum((d) => d.creator_cents), out = sum((d) => d.paid_out_cents);
  const owed = m.owed.wallets_cents + m.owed.creators_pending_cents + m.owed.prizes_waiting_cents;
  const subs = Object.values(m.subscribers).reduce((n, x) => n + x, 0);
  const inMonthly = m.mrr_cents, outMonthly = m.weekly_pool_cents * 4;
  const Kpi = ({ k, v, s, tone }: { k: string; v: string; s?: string; tone?: string }) => (
    <div className="set-card !mt-0 !p-4"><p className="text-[11px] font-black uppercase tracking-wide text-haze">{k}</p>
      <p className={`display mt-1 text-3xl ${tone ?? ""}`}>{v}</p>{s && <p className="mt-1 text-xs text-haze">{s}</p>}</div>
  );
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi k="Coming in each month" v={$(inMonthly)} s={`${subs} paying members, estimated from active plans`} tone="text-[#2fd27a]" />
        <Kpi k="Going out each month" v={$(outMonthly)} s={`${$(m.weekly_pool_cents)} a week in prizes`} tone="text-flamingo" />
        <Kpi k="Left over, before fees" v={$(inMonthly - outMonthly)} s="Stripe and processing fees come off this" tone={inMonthly - outMonthly >= 0 ? "text-[#2fd27a]" : "text-flamingo"} />
        <Kpi k="We owe members right now" v={$(owed)} s={`Wallets ${$(m.owed.wallets_cents)} · creators ${$(m.owed.creators_pending_cents)} · prizes ${$(m.owed.prizes_waiting_cents)}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Last</span>
        {[7, 30, 90].map((d) => <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={`btn btn-ghost !py-1 !px-3 text-sm${days === d ? " is-on" : ""}`}>{d} days</button>)}
        <span className="ml-auto text-xs text-haze">Plan income is an estimate. Stripe is the source of truth for what actually arrived.</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="set-card !mt-0"><h3 className="font-black">Download sales</h3>
          <p className="text-sm text-haze">{$(sales)} sold · {$(share)} to creators</p>
          <Bars days={m.series} a={(d) => d.sales_cents} b={(d) => d.creator_cents} aLabel="Sold" bLabel="Creator share" fmt={$} /></section>
        <section className="set-card !mt-0"><h3 className="font-black">Cash-outs paid</h3>
          <p className="text-sm text-haze">{$(out)} sent in this window</p>
          <Bars days={m.series} a={(d) => d.paid_out_cents} aLabel="Paid out" fmt={$} /></section>
        {!compact && <section className="set-card !mt-0"><h3 className="font-black">New members</h3>
          <p className="text-sm text-haze">{sum((d) => d.new_members)} joined</p>
          <Bars days={m.series} a={(d) => d.new_members} aLabel="Joined" fmt={(n) => String(n)} /></section>}
        {!compact && <section className="set-card !mt-0"><h3 className="font-black">Paying members by plan</h3>
          <ul className="mt-3 grid gap-2">{(["street", "hustler", "kingpin"] as const).map((t) => {
            const n = m.subscribers[t] ?? 0, pct = subs ? (n / subs) * 100 : 0;
            return <li key={t}><div className="flex justify-between text-sm"><b className="capitalize">{t}</b><span>{n}</span></div>
              <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#ff3d8b]" style={{ width: `${pct}%` }} /></div></li>;
          })}</ul>
          <p className="mt-4 text-xs text-haze">Lifetime: {$(m.lifetime.sales_cents)} in download sales · {$(m.lifetime.paid_out_cents)} paid out to members.</p></section>}
      </div>
    </div>
  );
}
