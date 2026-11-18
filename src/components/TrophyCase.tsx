"use client";
import { useMemo, useState } from "react";
import Link from "@/components/A";
import { HoverTip } from "@/components/HoverTip";
import { BadgeWall, type Badge } from "@/components/Gamification";
import { ACTION, HUE, ROOMS, WINGS, fmt, pct, statusLine, useTrophies, type Trophy } from "@/lib/trophies";

export function Medal({ t, earned, size }: { t: Pick<Trophy, "id" | "category">; earned: boolean; size?: string }) {
  const h = HUE[t.category] ?? HUE.Uploads;
  const tier = t.id.startsWith("podium") ? 3 : Math.min(5, Math.max(1, Number(t.id.slice(1)) / 2 | 0 || 1));
  const u = `tm-${t.id}`;
  const st = size ? { width: size, height: size } : undefined;
  if (!earned) return <svg viewBox="0 0 64 64" className="badge-coin is-locked" style={st} aria-hidden><circle cx="32" cy="32" r="28" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeDasharray="3 4" /><circle cx="32" cy="28" r="5" fill="rgba(255,255,255,.22)" /><path d="M29 31h6l2 12h-10z" fill="rgba(255,255,255,.22)" /></svg>;
  return (
    <svg viewBox="0 0 64 64" className="badge-coin" style={st} aria-hidden>
      <defs><linearGradient id={u} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={h[0]} /><stop offset=".55" stopColor={h[1]} /><stop offset="1" stopColor={h[2]} /></linearGradient></defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${u})`} />
      {Array.from({ length: tier }, (_, i) => <circle key={i} cx="32" cy="32" r={26 - i * 2.6} fill="none" stroke={h[2]} strokeOpacity={0.55} strokeWidth="1" strokeDasharray={i % 2 ? "1 3" : "none"} />)}
      <circle cx="32" cy="32" r="14" fill={h[1]} stroke={h[0]} strokeWidth="1.5" />
      <text x="32" y="37" textAnchor="middle" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="13" fill={h[2]}>{t.id.startsWith("podium") ? t.id.slice(7, 8).toUpperCase() : t.id}</text>
      <path d="M14 22a20 20 0 0 1 22-12" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A small progress ring in a category's colour. */
export function Ring({ cat, value, size = 40, children }: { cat: string; value: number; size?: number; children?: React.ReactNode }) {
  const h = HUE[cat] ?? HUE.Uploads; const r = 16, c = 2 * Math.PI * r;
  return (
    <span className="t-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="4" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={h[1]} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 20 20)" />
      </svg>
      <span>{children}</span>
    </span>
  );
}

/** Dashboard card: a one-glance summary of the museum instead of every trophy on the page. */
export function TrophySummary({ rows }: { rows: Trophy[] }) {
  const got = rows.filter((t) => t.earned_at).length;
  const latest = useMemo(() => rows.filter((t) => t.earned_at).sort((a, b) => (b.earned_at ?? "").localeCompare(a.earned_at ?? "")).slice(0, 3), [rows]);
  const next = useMemo(() => rows.filter((t) => !t.earned_at && t.category !== "Podium").sort((a, b) => pct(b) - pct(a))[0], [rows]);
  const fresh = rows.filter((t) => t.earned_at && !t.seen_at).length;
  return (
    <section className="tsum" aria-labelledby="tsum-t">
      <div className="tsum-head">
        <div>
          <p className="dash-kicker">Trophy museum{fresh ? <span className="tsum-new">{fresh} new</span> : null}</p>
          <h3 id="tsum-t" className="display text-3xl">{got} of {rows.length} unlocked</h3>
        </div>
        <Link href="/trophies" className="btn btn-hot">Walk the trophy room →</Link>
      </div>
      <ul className="tsum-rooms">
        {(["Podium", ...WINGS] as string[]).map((cat) => {
          const list = rows.filter((t) => t.category === cat); if (!list.length) return null;
          const g = list.filter((t) => t.earned_at).length;
          return (
            <li key={cat}>
              <Link href={`/trophies?room=${ROOMS.indexOf(cat as (typeof ROOMS)[number])}`} title={`${cat}: ${g} of ${list.length}`}>
                <Ring cat={cat} value={g / list.length}>{g}</Ring>
                <span>{cat === "Return participation" ? "Returns" : cat}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="tsum-foot">
        {latest.length > 0 && (
          <div className="tsum-latest">
            <span className="trophy-label">Latest</span>
            {latest.map((t) => <HoverTip key={t.id} tip={t.description} className="!inline-block"><span className="tsum-chip is-earned"><Medal t={t} earned size="1.6rem" />{t.name}</span></HoverTip>)}
          </div>
        )}
        {next && (
          <p className="text-sm text-haze">
            Next up: <b className="text-foam">{next.name}</b>, {fmt(next, Math.max(0, next.threshold - next.progress))} to go.{" "}
            <Link href={ACTION[next.category]?.[1] ?? "/clips"} className="text-gulf underline underline-offset-4">{ACTION[next.category]?.[0] ?? "Browse clips"}</Link>
          </p>
        )}
      </div>
    </section>
  );
}

/** Flat list of every trophy. Used as the museum's "List view" and when 3D isn't available. */
export function TrophyList({ rows }: { rows: Trophy[] }) {
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"order" | "recent" | "nearest">("order");
  const cats = useMemo(() => ["All", ...Array.from(new Set(rows.map((t) => t.category)))], [rows]);
  const list = useMemo(() => {
    let r = rows.filter((t) => cat === "All" || t.category === cat);
    if (sort === "recent") r = [...r].sort((a, b) => (b.earned_at ?? "").localeCompare(a.earned_at ?? ""));
    if (sort === "nearest") r = [...r].sort((a, b) => Number(!!a.earned_at) - Number(!!b.earned_at) || pct(b) - pct(a));
    return r;
  }, [rows, cat, sort]);
  return (
    <div className="trophy-case">
      <div className="flex flex-wrap items-center gap-2">
        {cats.map((c) => {
          const g = rows.filter((t) => (c === "All" || t.category === c) && t.earned_at).length, n = rows.filter((t) => c === "All" || t.category === c).length;
          return <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`hub-chip${cat === c ? " on" : ""}`}>{c} · {g}/{n}</button>;
        })}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort trophies" className="field !w-auto !py-1.5 ml-auto text-sm">
          <option value="order">Catalogue order</option><option value="recent">Recently unlocked</option><option value="nearest">Nearest milestone</option>
        </select>
      </div>
      <ul className="trophy-grid mt-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(7.5rem,1fr))", gap: ".9rem" }}>
        {list.map((t) => (
          <li key={t.id} className={`text-center ${t.earned_at ? "is-earned" : "is-locked"}`}>
            <HoverTip tip={`${t.earned_at ? "" : "Locked. "}${t.description}`}>
              <Medal t={t} earned={!!t.earned_at} />
              <span className="block text-xs font-bold mt-1">{t.name}{t.earned_at && !t.seen_at ? " · New" : ""}</span>
              <span className="block text-[11px] text-haze">{statusLine(t)}</span>
            </HoverTip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dashboard slot: the summary card, loaded for the signed-in member. */
export function TrophyCase() {
  const rows = useTrophies();
  return rows?.length ? <TrophySummary rows={rows} /> : null;
}

/** One tidy "Trophies" section for the dashboard: pick a tab to see trophies or badges, instead of several stacked panels. */
export function TrophiesSection({ badges }: { badges: Badge[] }) {
  const rows = useTrophies();
  const [tab, setTab] = useState<"trophies" | "badges">("trophies");
  const hasTrophies = !!rows?.length;
  if (!hasTrophies && !badges.length) return null;
  const tabs = [...(hasTrophies ? [["trophies", "Trophies"] as const] : []), ...(badges.length ? [["badges", "Badges"] as const] : [])];
  const active = tabs.some(([k]) => k === tab) ? tab : tabs[0][0];
  return (
    <section className="mt-10" aria-label="Trophies">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="dash-kicker">Your collection</p>
          <h2 className="display text-3xl">Trophies</h2>
        </div>
        {hasTrophies && <Link href="/trophies" className="btn btn-hot !py-2 !px-4 text-sm">Walk the trophy room →</Link>}
      </div>
      <div role="tablist" className="inline-flex rounded border border-line p-1 bg-ink">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={active === k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded font-bold text-sm ${active === k ? "bg-foam text-dusk" : "text-haze"}`}>{l}</button>
        ))}
      </div>
      <div role="tabpanel" className="mt-4">
        {active === "trophies" && rows ? <><TrophySummary rows={rows} /><div className="mt-6"><TrophyList rows={rows} /></div></> : <BadgeWall badges={badges} />}
      </div>
    </section>
  );
}
