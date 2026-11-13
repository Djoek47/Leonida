"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type T = { id: string; category: string; name: string; description: string; threshold: number; privacy: "public" | "private";
  progress: number; earned_at: string | null; seen_at: string | null };

const HUE: Record<string, [string, string, string]> = {
  Podium: ["#fff3b0", "#f0b429", "#8a5a00"], Audience: ["#cfe8ff", "#3b8bd9", "#12365f"], Earnings: ["#b7f0cf", "#1f9d63", "#0b4a2d"],
  Downloads: ["#ffd9f0", "#d6409f", "#5c0d3d"], Uploads: ["#ffe2b8", "#e8871e", "#6b3a00"], Featuring: ["#fff6a8", "#e0c200", "#5c5000"],
  "Votes received": ["#e3d1ff", "#8a4fe0", "#2f1363"], "Votes given": ["#d1f5f0", "#14a89a", "#064a43"], "Return participation": ["#ffd1d1", "#d1263a", "#5c0a15"],
};
const ACTION: Record<string, [string, string]> = {
  Audience: ["Send a clip", "/submit"], Uploads: ["Send a clip", "/submit"], Downloads: ["See your clips", "/dashboard"], Earnings: ["Send a clip", "/submit"],
  Featuring: ["See the plans", "/pricing"], "Votes received": ["Send a clip", "/submit"], "Votes given": ["Vote on this week's clips", "/clips"],
  "Return participation": ["Vote on this week's clips", "/clips"], Podium: ["Enter this week", "/submit"],
};
const fmt = (t: T, n: number) => t.id.startsWith("E") && t.category === "Earnings" ? `$${(n / 100).toLocaleString("en-US")}` : n.toLocaleString("en-US");

function Medal({ t, earned }: { t: T; earned: boolean }) {
  const h = HUE[t.category] ?? HUE.Uploads;
  const tier = t.id.startsWith("podium") ? 3 : Math.min(5, Math.max(1, Number(t.id.slice(1)) / 2 | 0 || 1));
  const u = `tm-${t.id}`;
  if (!earned) return <svg viewBox="0 0 64 64" className="badge-coin is-locked" aria-hidden><circle cx="32" cy="32" r="28" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeDasharray="3 4" /><circle cx="32" cy="28" r="5" fill="rgba(255,255,255,.22)" /><path d="M29 31h6l2 12h-10z" fill="rgba(255,255,255,.22)" /></svg>;
  return (
    <svg viewBox="0 0 64 64" className="badge-coin" aria-hidden>
      <defs><linearGradient id={u} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={h[0]} /><stop offset=".55" stopColor={h[1]} /><stop offset="1" stopColor={h[2]} /></linearGradient></defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${u})`} />
      {Array.from({ length: tier }, (_, i) => <circle key={i} cx="32" cy="32" r={26 - i * 2.6} fill="none" stroke={h[2]} strokeOpacity={0.55} strokeWidth="1" strokeDasharray={i % 2 ? "1 3" : "none"} />)}
      <circle cx="32" cy="32" r="14" fill={h[1]} stroke={h[0]} strokeWidth="1.5" />
      <text x="32" y="37" textAnchor="middle" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="13" fill={h[2]}>{t.id.startsWith("podium") ? t.id.slice(7, 8).toUpperCase() : t.id}</text>
      <path d="M14 22a20 20 0 0 1 22-12" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** The trophy case: Podium (3) plus 80 retention trophies. Private categories show only to the owner. */
export function TrophyCase() {
  const { user, demo } = useUser();
  const [rows, setRows] = useState<T[] | null>(null);
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"order" | "recent" | "nearest">("order");

  useEffect(() => {
    if (!user || demo) { setRows([]); return; }
    const c = sb(); if (!c) { setRows([]); return; }
    c.rpc("my_trophies").then(({ data }) => {
      setRows((data as T[]) ?? []);
      if ((data as T[] | null)?.some((t) => t.earned_at && !t.seen_at)) setTimeout(() => c.rpc("ack_trophies"), 4000);
    });
  }, [user, demo]);

  const cats = useMemo(() => ["All", ...Array.from(new Set((rows ?? []).map((t) => t.category)))], [rows]);
  const list = useMemo(() => {
    let r = (rows ?? []).filter((t) => cat === "All" || t.category === cat);
    if (sort === "recent") r = [...r].sort((a, b) => (b.earned_at ?? "").localeCompare(a.earned_at ?? ""));
    if (sort === "nearest") r = [...r].sort((a, b) => Number(!!a.earned_at) - Number(!!b.earned_at) || (b.progress / b.threshold) - (a.progress / a.threshold));
    return r;
  }, [rows, cat, sort]);
  const next = useMemo(() => (rows ?? []).filter((t) => !t.earned_at && t.category !== "Podium").sort((a, b) => (b.progress / b.threshold) - (a.progress / a.threshold))[0], [rows]);

  if (!rows?.length) return null;
  const got = rows.filter((t) => t.earned_at).length;
  return (
    <div className="trophy-case">
      <div className="trophy-head">
        <h3 className="display text-3xl">Trophy case</h3>
        <p className="trophy-count"><b>{got}</b> / {rows.length}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {cats.map((c) => {
          const g = rows.filter((t) => (c === "All" || t.category === c) && t.earned_at).length, n = rows.filter((t) => c === "All" || t.category === c).length;
          return <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`hub-chip${cat === c ? " on" : ""}`}>{c} · {g}/{n}</button>;
        })}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort trophies" className="field !w-auto !py-1.5 ml-auto text-sm">
          <option value="order">Catalogue order</option><option value="recent">Recently unlocked</option><option value="nearest">Nearest milestone</option>
        </select>
      </div>
      {next && (
        <p className="mt-3 text-sm text-haze">
          Next up: <b className="text-foam">{next.name}</b>, {fmt(next, Math.max(0, next.threshold - next.progress))} to go. <Link href={ACTION[next.category]?.[1] ?? "/clips"} className="text-gulf underline underline-offset-4">{ACTION[next.category]?.[0] ?? "Browse clips"}</Link>
        </p>
      )}
      <ul className="trophy-grid mt-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(7.5rem,1fr))", gap: ".9rem" }}>
        {list.map((t) => (
          <li key={t.id} className={`text-center ${t.earned_at ? "is-earned" : "is-locked"}`}
            title={t.earned_at ? `${t.description} Earned ${new Date(t.earned_at).toLocaleDateString()}.` : `${t.description} ${fmt(t, Math.max(0, t.threshold - t.progress))} to go.`}>
            <Medal t={t} earned={!!t.earned_at} />
            <span className="block text-xs font-bold mt-1">{t.name}{t.earned_at && !t.seen_at ? " · New" : ""}</span>
            <span className="block text-[11px] text-haze">
              {t.earned_at ? new Date(t.earned_at).toLocaleDateString() : `${fmt(t, t.progress)} / ${fmt(t, t.threshold)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-haze">Trophies are achievements only. They never pay money, votes or credits. Money, votes given and votes received stay private to you.</p>
    </div>
  );
}
