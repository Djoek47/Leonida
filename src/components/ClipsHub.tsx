"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/A";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { castVote, exactMoney, myVotes, platformName, type Clip } from "@/lib/api";
import { DOWNLOAD, type TierId } from "@/lib/tiers";
import { CoinAvatar } from "@/components/CoinAvatar";
import { TierMedal } from "@/components/TierMedal";
import { ALL_TAGS, TAG_LABEL, FLAGGED_SLUGS, slugTag } from "@/lib/tags";
import { DEMO_CLIPS } from "@/lib/api";

/** Clips from Leonida: one hub, three categories.
 *
 *  This week's clips — approved entries in the open weekly round (Trending, New, Featured).
 *  All Videos       — every approved clip across weeks (Trending, New; never Featured).
 *  Featured Clips   — every live 24-hour subscription placement, across weeks.
 *
 *  Everything is filtered and sorted by the database (browse_clips) before it
 *  is paged, so a filter covers the whole catalogue, not just what loaded.
 *  Vote totals never reach this page. */

export type Cat = "week" | "all" | "featured";
type Row = {
  id: string; contest_id: string | null; owner_id: string | null; title: string; platform: Clip["platform"];
  gamertag: string; storage_path: string | null; watermark_path: string | null; source_url: string | null;
  duration_seconds: number | null; view_count: number; published_at: string; created_at: string;
  trending_until: string | null; tags: string[]; winner: boolean; votable: boolean;
  featured_until: string | null; total: number; thumb?: string;
  owner_tier?: string | null; owner_avatar?: string | null;
};
type Stats = { clips: number; views: number; views_24h: number; new_today: number; creators: number; timezone: string; tags: { tag: string; n: number }[] };
type Round = { id: string; title: string; state: string; timezone: string; starts_at: string; submissions_close_at: string; voting_closes_at: string };

const CATS: [Cat, string, string][] = [
  ["week", "This week's clips", "/clips"],
  ["all", "All Videos", "/clips/all"],
  ["featured", "Featured Clips", "/clips/featured"],
];
const PAGE = 24;
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const thumbOf = (r: Row) => r.thumb ?? (SUPA && r.owner_id ? `${SUPA}/storage/v1/object/public/thumbs/${r.owner_id}/${r.id}.jpg` : undefined);
const num = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
const dur = (s: number | null) => (s == null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - +new Date(iso)) / 6e4));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24); return d < 30 ? `${d} day${d === 1 ? "" : "s"} ago` : new Date(iso).toLocaleDateString();
}
const tl = (t: string) => TAG_LABEL[t] ?? t;
function anonKey() {
  try { let k = localStorage.getItem("lfl-v"); if (!k) { k = crypto.randomUUID(); localStorage.setItem("lfl-v", k); } return k; } catch { return null; }
}
const DEMO: Row[] = DEMO_CLIPS.map((c, i) => ({
  id: c.id, contest_id: c.contest_id, owner_id: c.owner_id, title: c.title, platform: c.platform, gamertag: c.gamertag,
  storage_path: null, watermark_path: null, source_url: null, duration_seconds: 34 + i * 9, view_count: [4210, 2980, 1870, 1220, 860, 540, 310, 96][i],
  published_at: c.created_at, created_at: c.created_at, trending_until: i === 0 ? new Date(Date.now() + 864e5).toISOString() : null,
  tags: [["funny", "npc"], ["chase"], ["stunt", "funny"], ["drift"], ["npc"], ["chase", "scenic"], ["stunt"], []][i] ?? [],
  winner: i === 2, votable: true, featured_until: i < 2 ? new Date(Date.now() + 5 * 36e5).toISOString() : null, total: 8, thumb: c.thumb,
}));

// Signed playback URLs, minted ahead of the click (on hover/focus) so the
// player starts instantly. They last an hour; we reuse them for 50 minutes.
const signed = new Map<string, { url: string; at: number }>();
async function signFor(r: Row): Promise<string | null> {
  const path = r.watermark_path ?? r.storage_path; const c = sb();
  if (!c || !path) return null;
  const hit = signed.get(path); if (hit && Date.now() - hit.at < 50 * 6e4) return hit.url;
  const { data } = await c.storage.from("clips").createSignedUrl(path, 3600);
  if (!data) return null;
  signed.set(path, { url: data.signedUrl, at: Date.now() });
  return data.signedUrl;
}
function warm(r: Row) {
  signFor(r).then((u) => { if (!u || document.querySelector(`link[href="${u}"]`)) return;
    const l = document.createElement("link"); l.rel = "preload"; l.as = "video"; l.href = u; document.head.appendChild(l); }).catch(() => {});
}

async function browse(cat: Cat, o: { section?: string; sort?: string; tags?: string[]; offset?: number; limit?: number }): Promise<Row[]> {
  const c = sb();
  if (!c) {
    let r = [...DEMO];
    if (cat === "featured" || o.section === "featured") r = r.filter((x) => x.featured_until);
    if (o.tags?.length) r = r.filter((x) => x.tags.some((t) => o.tags!.includes(t)));
    if (o.sort === "views" || o.section === "trending") r.sort((a, b) => b.view_count - a.view_count);
    return r.map((x) => ({ ...x, total: r.length })).slice(o.offset ?? 0, (o.offset ?? 0) + (o.limit ?? PAGE));
  }
  const { data, error } = await c.rpc("browse_clips", {
    p_cat: cat, p_section: o.section ?? null, p_sort: o.sort ?? "new",
    p_tags: o.tags?.length ? o.tags : null, p_limit: o.limit ?? PAGE, p_offset: o.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as Row[];
}

export function ClipsHub({ cat }: { cat: Cat }) {
  const router = useRouter(), path = usePathname(), q = useSearchParams();
  const sort = q.get("sort") === "views" ? "views" : q.get("sort") === "new" ? "new" : null;
  const tags = useMemo(() => (q.get("tags") ?? "").split(",").filter((t) => ALL_TAGS.map(slugTag).includes(t)), [q]);
  const filtered = Boolean(sort || tags.length);

  const { user, account, paying, tier } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [sections, setSections] = useState<{ trending: Row[]; fresh: Row[]; featured: Row[] } | null>(null);
  const [grid, setGrid] = useState<Row[]>([]);
  const [more, setMore] = useState(false);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [voted, setVoted] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  // Messages are a toast pinned to the screen; they clear on their own.
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 7000); return () => clearTimeout(t); }, [msg]);
  const [open, setOpen] = useState<Row | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const seq = useRef(0);

  // Category facts and the round clock.
  useEffect(() => {
    const c = sb();
    if (!c) {
      setStats({ clips: 8, views: 12086, views_24h: 1430, new_today: 2, creators: 8, timezone: "America/Toronto",
        tags: [{ tag: "funny", n: 2 }, { tag: "npc", n: 2 }, { tag: "chase", n: 2 }, { tag: "stunt", n: 2 }, { tag: "drift", n: 1 }] });
      return;
    }
    c.rpc("hub_stats", { p_cat: cat }).then(({ data }) => data && setStats(data as Stats));
    if (cat === "week") c.rpc("round_status").then(({ data }) => {
      const rs = (data ?? []) as Round[];
      const r = rs.find((x) => x.state === "open" || x.state === "voting_only") ?? null;
      setRound(r);
      if (r) myVotes(r.id).then(setVoted);
    });
  }, [cat]);

  const [owned, setOwned] = useState<Set<string>>(new Set());
  useEffect(() => {
    const c = sb();
    if (!c || !user) return;
    c.rpc("my_downloaded_clips").then(({ data }) => setOwned(new Set(((data ?? []) as { clip_id: string }[]).map((d) => d.clip_id))));
    c.rpc("my_favorite_ids").then(({ data }) => setFavs(new Set(((data ?? []) as string[]))));
  }, [user]);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setState("loading");
    try {
      if (filtered) {
        const rows = await browse(cat, { sort: sort ?? "new", tags });
        if (my !== seq.current) return;
        setGrid(rows); setMore(rows.length > 0 && rows[0].total > rows.length); setSections(null);
      } else {
        const [trending, fresh, featured, all] = await Promise.all([
          cat === "featured" ? Promise.resolve([]) : browse(cat, { section: "trending", limit: 12 }),
          cat === "featured" ? Promise.resolve([]) : browse(cat, { section: "new", limit: 12 }),
          cat === "week" ? browse(cat, { section: "featured", limit: 12 }) : Promise.resolve([]),
          browse(cat, { sort: "new" }),
        ]);
        if (my !== seq.current) return;
        setSections({ trending, fresh, featured });
        setGrid(all); setMore(all.length > 0 && all[0].total > all.length);
      }
      setState("ok");
    } catch { if (my === seq.current) setState("error"); }
  }, [cat, filtered, sort, tags]);
  useEffect(() => { load(); }, [load]);

  // Deep link to one clip: /clips/all?play=<id>
  useEffect(() => {
    const id = q.get("play"); if (!id || state !== "ok") return;
    const hit = grid.find((r) => r.id === id);
    if (hit) { setOpen(hit); return; }
    browse("all", { sort: "new", limit: 60 }).then((rs) => { const h = rs.find((r) => r.id === id); if (h) setOpen(h); }).catch(() => {});
  }, [q, state, grid]);

  async function loadMore() {
    const rows = await browse(cat, { sort: sort ?? "new", tags, offset: grid.length }).catch(() => []);
    const seen = new Set(grid.map((r) => r.id));
    const next = [...grid, ...rows.filter((r) => !seen.has(r.id))];
    setGrid(next); setMore(rows.length > 0 && rows[0].total > next.length);
  }

  function setQuery(nextSort: string | null, nextTags: string[]) {
    const p = new URLSearchParams();
    if (nextSort) p.set("sort", nextSort);
    if (nextTags.length) p.set("tags", nextTags.join(","));
    router.push(p.toString() ? `${path}?${p}` : path, { scroll: false });
  }

  async function toggleFav(r: Row) {
    if (!user) { setMsg("Sign in, then pick a plan, to save favorites."); return; }
    if (!paying) { setMsg("Favorites are for Street, Hustler and Kingpin members."); return; }
    const on = !favs.has(r.id);
    const prev = new Set(favs);
    const nx = new Set(favs); if (on) nx.add(r.id); else nx.delete(r.id); setFavs(nx);
    const c = sb(); if (!c) return;
    const { error } = await c.rpc("set_favorite", { p_clip: r.id, p_on: on });
    if (error) { setFavs(prev); setMsg(error.message.includes("UNPAID") ? "Favorites need an active paid plan." : "That didn't save. Try again."); }
    else setMsg(on ? "Saved to your favorites." : "Removed from your favorites.");
  }

  const maxVotes = account?.votes ?? tier.votes;
  const votesLeft = Math.max(0, maxVotes - voted.length);
  const tz = round?.timezone ?? stats?.timezone ?? "America/Toronto";
  const at = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" });

  async function vote(r: Row) {
    if (!user) { setMsg("Sign in to vote. It's free."); return; }
    if (r.owner_id === user.id) { setMsg("You can't vote for your own clip."); return; }
    if (voted.includes(r.id)) { setMsg("You've already voted for this clip. One vote per clip, for good."); return; }
    if (votesLeft <= 0) { setMsg(`You have 0 votes left this weekly round. Your votes reset ${round ? at(round.voting_closes_at) : "next Thursday at noon"}.`); return; }
    const prev = voted; setVoted([...prev, r.id]);
    const err = await castVote(r.id);
    if (err) {
      setVoted(prev);
      setMsg(err.includes("OUT_OF_VOTES") ? "You have 0 votes left this weekly round."
        : err.includes("ALREADY_VOTED") ? "You've already voted for this clip."
        : err.includes("VOTING_CLOSED") ? "Voting isn't open for this clip's round." : err);
      return;
    }
    setMsg(`Voted. You have ${votesLeft - 1} vote${votesLeft - 1 === 1 ? "" : "s"} left this weekly round.`);
  }

  async function download(r: Row) {
    if (!user) { setMsg("Sign in to download."); return; }
    const c = sb(); if (!c) { setMsg("Demo build: downloads need the live site."); return; }
    setMsg("Getting the file…");
    const token = (await c.auth.getSession()).data.session?.access_token;
    const res = await fetch("/api/download", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ clipId: r.id }) });
    const j = (await res.json().catch(() => ({}))) as { file?: string; checkout?: string; error?: string; external?: boolean };
    if (j.checkout) { location.href = j.checkout; return; }
    if (!j.file) { setMsg(j.error ?? (paying ? "Could not start the download." : `Downloads are for members, or ${exactMoney(DOWNLOAD.priceCents)} each.`)); return; }
    if (j.external) window.open(j.file, "_blank", "noopener"); else location.href = j.file;
    setOwned((o) => new Set(o).add(r.id));
    setMsg(r.owner_id !== user.id ? `Downloading. ${r.gamertag} gets their share.` : "Downloading.");
  }

  // Back from Stripe with a bought download: wait for the webhook, then hand it over.
  useEffect(() => {
    const id = q.get("downloaded"); if (!id || !user) return;
    history.replaceState(null, "", path);
    let tries = 0, stop = false;
    const go = async () => {
      if (stop) return;
      const token = (await sb()?.auth.getSession())?.data.session?.access_token;
      const res = await fetch("/api/download", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ clipId: id }) });
      const j = (await res.json().catch(() => ({}))) as { file?: string; checkout?: string; external?: boolean };
      if (j.file) { if (j.external) window.open(j.file, "_blank", "noopener"); else location.href = j.file; setMsg("Downloading. Thanks for paying the player."); return; }
      if (++tries < 8) setTimeout(go, 1500); else setMsg("Payment received. Open the clip and tap Download again in a moment — it won't charge twice.");
    };
    setMsg("Payment received. Getting your file…"); go();
    return () => { stop = true; };
  }, [q, user, path]);

  const card = (r: Row, wide = false) => (
    <ClipCard key={r.id} r={r} wide={wide} fav={favs.has(r.id)} voted={voted.includes(r.id)} mine={Boolean(user && r.owner_id === user.id)}
      showVote={cat === "week"} onOpen={() => setOpen(r)} onFav={() => toggleFav(r)} onVote={() => vote(r)} />
  );
  const heading = CATS.find(([k]) => k === cat)![1];

  return (
    <div className={`dash dash-${paying ? tier.id : "free"}`}>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs font-black uppercase tracking-[0.2em] text-haze">
          <Link href="/clips">Clips from Leonida</Link> <span aria-hidden>/</span> {heading}
        </nav>
        <div className="hub-head">
          <h1 className="display text-[clamp(2.6rem,8vw,5.4rem)] leading-[0.92]">Clips from Leonida</h1>
          <div role="tablist" aria-label="Clip categories" className="hub-tabs">
            {CATS.map(([k, label, href]) => (
              <Link key={k} role="tab" aria-selected={k === cat} href={href} className={k === cat ? "on" : ""}>{label}</Link>
            ))}
          </div>
        </div>

        {/* LED band: what's in this category right now. Views and counts only — never votes. */}
        <dl className="dash-stats hub-stats">
          {([
            ["Clips", stats ? num(stats.clips) : "—"],
            ["Views", stats ? num(stats.views) : "—"],
            ["Views · 24h", stats ? num(stats.views_24h) : "—"],
            ["New today", stats ? num(stats.new_today) : "—"],
          ] as const).map(([k, v]) => (
            <div key={k} className="dash-stat"><dt>{k}</dt><dd className="text-[clamp(1.5rem,5vw,2.3rem)]">{v}</dd></div>
          ))}
        </dl>

        {cat === "week" && (
          <div className="hub-round">
            {round ? (
              <>
                <span className="lower-third text-sm"><span className="tag"><span className="rec" />{round.state === "open" ? "Entries open" : "Voting only"}</span><span className="txt">{round.title}</span></span>
                <span>Entries close <b>{at(round.submissions_close_at)}</b></span>
                <span>Voting ends <b>{at(new Date(+new Date(round.voting_closes_at) - 6e4).toISOString())}</b></span>
                {user && <span className="hub-bal">You have <b>{votesLeft}</b> vote{votesLeft === 1 ? "" : "s"} left this weekly round.</span>}
              </>
            ) : <span className="text-haze">The next weekly round opens Thursday at noon ({tz.replace("_", " ")}).</span>}
          </div>
        )}

        <div className="hub-bar">
          <button className="btn btn-ghost !py-2" onClick={() => setFilterOpen(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            Filter{filtered ? ` · ${(sort ? 1 : 0) + tags.length}` : ""}
          </button>
          {sort && <span className="hub-chip">Sort: {sort === "views" ? "Most viewed" : "New"}<button aria-label="Remove sort" onClick={() => setQuery(null, tags)}>×</button></span>}
          {tags.map((t) => <span key={t} className="hub-chip">{tl(t)}<button aria-label={`Remove ${tl(t)}`} onClick={() => setQuery(sort, tags.filter((x) => x !== t))}>×</button></span>)}
          {filtered && <button className="text-sm font-bold text-gulf underline underline-offset-4" onClick={() => setQuery(null, [])}>Clear all</button>}
          {filtered && grid[0] && <span className="ml-auto text-sm font-bold text-haze">{grid[0].total} result{grid[0].total === 1 ? "" : "s"}{tags.length > 1 ? " · match any selected tag" : ""}</span>}
        </div>

        {msg && (
          <div role="status" className="hub-toast">
            <span>{msg}</span>
            {!user && <Link className="hub-toast-go" href="/login?next=/clips">Sign in</Link>}
            {user && !paying && msg.includes("Favorites") && <Link className="hub-toast-go" href="/pricing">See plans</Link>}
            <button type="button" aria-label="Dismiss" onClick={() => setMsg(null)}>×</button>
          </div>
        )}

        {state === "loading" && <div className="hub-grid mt-8" aria-busy>{Array.from({ length: 8 }, (_, i) => <div key={i} className="hub-skel" />)}</div>}
        {state === "error" && (
          <div className="hub-empty"><p className="display text-4xl">Couldn&apos;t load clips</p><button className="btn btn-hot mt-5" onClick={load}>Try again</button></div>
        )}
        {state === "ok" && (
          <>
            {!filtered && sections && (
              <>
                {sections.featured.length > 0 && <Shelf title="Featured" note="24-hour member spotlights from this round">{sections.featured.map((r) => card(r, true))}</Shelf>}
                {sections.trending.length > 0 && <Shelf title="Trending" note="Most watched in the last 24 hours">{sections.trending.map((r) => card(r))}</Shelf>}
                {sections.fresh.length > 0 && <Shelf title="New" note={`Published today · ${tz.replace("_", " ")}`}>{sections.fresh.map((r) => card(r))}</Shelf>}
                <h2 className="hub-h mt-12">{cat === "featured" ? "Live now" : cat === "week" ? "Every clip this round" : "Every clip"}</h2>
              </>
            )}
            {grid.length === 0 ? (
              <div className="hub-empty">
                <p className="display text-4xl">{filtered ? "No clips match" : cat === "featured" ? "Nothing featured right now" : "No clips here yet"}</p>
                {filtered ? <button className="btn btn-ghost mt-5" onClick={() => setQuery(null, [])}>Clear all</button>
                  : <Link href="/submit" className="btn btn-hot mt-5">Send a clip</Link>}
              </div>
            ) : (
              <div className="hub-grid mt-5">{grid.map((r) => card(r))}</div>
            )}
            {more && <div className="mt-8 text-center"><button className="btn btn-ghost" onClick={loadMore}>Load more</button></div>}
          </>
        )}

        <p className="mt-12 text-sm text-haze">
          One vote per clip, for good. Totals stay private. Views count once per viewer per hour.
          Downloads are {exactMoney(DOWNLOAD.priceCents)}, and most of it goes to the creator.
        </p>
      </div>

      {filterOpen && <FilterDialog stats={stats} sort={sort} tags={tags} onClose={() => setFilterOpen(false)}
        onApply={(s, t) => { setQuery(s, t); setFilterOpen(false); }} />}
      {open && <Player r={open} list={grid} fav={favs.has(open.id)} voted={voted.includes(open.id)} showVote={cat === "week"}
        mine={Boolean(user && open.owner_id === user.id)} onClose={() => setOpen(null)} onPick={setOpen}
        onFav={() => toggleFav(open)} onVote={() => vote(open)} onDownload={() => download(open)} downloaded={owned.has(open.id)} />}
    </div>
  );
}

function Shelf({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="mt-10" aria-label={title}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="hub-h">{title}<small>{note}</small></h2>
        <div className="flex gap-2">
          <button className="hub-arrow" aria-label={`Scroll ${title} back`} onClick={() => go(-1)}>‹</button>
          <button className="hub-arrow" aria-label={`Scroll ${title} on`} onClick={() => go(1)}>›</button>
        </div>
      </div>
      <div ref={ref} className="hub-shelf" tabIndex={0}>{children}</div>
    </section>
  );
}

function ClipCard({ r, wide, fav, voted, mine, showVote, onOpen, onFav, onVote }: {
  r: Row; wide?: boolean; fav: boolean; voted: boolean; mine: boolean; showVote: boolean;
  onOpen: () => void; onFav: () => void; onVote: () => void;
}) {
  const [img, setImg] = useState(true);
  const [frame, setFrame] = useState<string | null>(null);
  const t = thumbOf(r);
  // No saved cover (older clips): show the video's own first frame, like a
  // YouTube poster. Only the browser reads metadata, nothing is downloaded in full.
  useEffect(() => {
    if (t && img) return;
    let off = false; signFor(r).then((u) => { if (!off && u) setFrame(u); }).catch(() => {});
    return () => { off = true; };
  }, [t, img, r]);
  const hot = r.trending_until && new Date(r.trending_until) > new Date();
  return (
    <article className={`hub-card${wide ? " wide" : ""}`} onPointerEnter={() => warm(r)} onFocus={() => warm(r)}>
      <button className="hub-thumb" onClick={onOpen} aria-label={`Play ${r.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {t && img ? <img src={t} alt="" loading="lazy" onError={() => setImg(false)} /> : frame ? <video className="hub-frame" src={`${frame}#t=0.6`} preload="metadata" muted playsInline /> : <span className="hub-noimg">{r.gamertag.slice(0, 2).toUpperCase()}</span>}
        <span className="hub-play" aria-hidden><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
        {r.duration_seconds != null && <span className="hub-dur">{dur(r.duration_seconds)}</span>}
        {r.winner && <span className="hub-badge gold">★ Winner</span>}
        {!r.winner && r.featured_until && <span className="hub-badge feat">Featured</span>}
        {!r.winner && !r.featured_until && hot && <span className="hub-badge hot">Trending · Daily Drop</span>}
      </button>
      <div className="hub-meta">
        <span className="hub-av" aria-hidden>
          <CoinAvatar tier={((r.owner_tier ?? "free") as TierId)} path={r.owner_avatar} className="size-full" />
        </span>
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="hub-title">{r.title}</button>
          <p className="hub-by">{r.gamertag} · {platformName[r.platform]}</p>
          <p className="hub-by">{num(r.view_count)} view{r.view_count === 1 ? "" : "s"} · {ago(r.published_at)}</p>
          {r.tags.length > 0 && <ul className="hub-tags">{r.tags.slice(0, 3).map((x) => <li key={x} className={FLAGGED_SLUGS.has(x) ? "flag" : ""}>{tl(x)}</li>)}</ul>}
        </div>
        <button className={`hub-fav${fav ? " on" : ""}`} onClick={onFav} aria-pressed={fav} aria-label={fav ? "Remove from favorites" : "Add to favorites"}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" /></svg>
        </button>
      </div>
      {showVote && (
        <div className="hub-act">
          {mine ? <span className="text-xs font-bold text-haze">Your clip</span>
            : voted ? <span className="hub-voted">Voted ✓</span>
            : r.votable ? <button className="btn btn-hot !py-1.5 !px-4 text-sm" onClick={onVote}>Vote</button>
            : <span className="text-xs font-bold text-haze">Voting not open for this clip</span>}
        </div>
      )}
    </article>
  );
}

function FilterDialog({ stats, sort, tags, onClose, onApply }: {
  stats: Stats | null; sort: string | null; tags: string[]; onClose: () => void; onApply: (s: string | null, t: string[]) => void;
}) {
  const [tab, setTab] = useState<"sort" | "tags">("sort");
  const [s, setS] = useState<string | null>(sort);
  const [t, setT] = useState<string[]>(tags);
  const [find, setFind] = useState("");
  const counts = new Map((stats?.tags ?? []).map((x) => [x.tag, x.n]));
  const options = ALL_TAGS.map((label) => ({ slug: slugTag(label), label }))
    .filter((o) => !find || o.label.toLowerCase().includes(find.toLowerCase()))
    .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0) || a.label.localeCompare(b.label));
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="hub-scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="flt" className="hub-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 id="flt" className="display text-3xl">Filter</h2><button className="hub-arrow" aria-label="Close" onClick={onClose}>×</button></div>
        <div role="tablist" className="hub-tabs sm mt-4">
          <button role="tab" aria-selected={tab === "sort"} className={tab === "sort" ? "on" : ""} onClick={() => setTab("sort")}>Sort</button>
          <button role="tab" aria-selected={tab === "tags"} className={tab === "tags" ? "on" : ""} onClick={() => setTab("tags")}>Tags{t.length ? ` · ${t.length}` : ""}</button>
        </div>
        {tab === "sort" ? (
          <div className="mt-4 grid gap-2">
            {[["views", "Most viewed", "Highest view count first"], ["new", "New", "Most recently published first"]].map(([k, label, sub]) => (
              <label key={k} className={`round-opt${s === k ? " on" : ""}`}>
                <input type="radio" name="sort" checked={s === k} onChange={() => setS(k)} /><span><b>{label}</b><small>{sub}</small></span>
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <input className="field" placeholder="Search tags — Funny, NPC…" value={find} onChange={(e) => setFind(e.target.value)} aria-label="Search tags" />
            <p className="mt-2 text-xs font-bold text-haze">Match any selected tag</p>
            <div className="hub-taglist">
              {options.map((o) => {
                const on = t.includes(o.slug);
                return (
                  <button key={o.slug} aria-pressed={on} className={on ? "on" : ""} onClick={() => setT(on ? t.filter((x) => x !== o.slug) : [...t, o.slug])}>
                    {o.label}{counts.get(o.slug) ? <small>{counts.get(o.slug)}</small> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button className="btn btn-hot flex-1 justify-center" onClick={() => onApply(s, t)}>Show results</button>
          <button className="btn btn-ghost" onClick={() => { setS(null); setT([]); }}>Clear all</button>
        </div>
      </div>
    </div>
  );
}

function Player({ r, list, fav, voted, mine, showVote, onClose, onPick, onFav, onVote, onDownload, downloaded }: {
  downloaded: boolean;
  r: Row; list: Row[]; fav: boolean; voted: boolean; mine: boolean; showVote: boolean;
  onClose: () => void; onPick: (r: Row) => void; onFav: () => void; onVote: () => void; onDownload: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [views, setViews] = useState(r.view_count);
  const counted = useRef<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setUrl(null); setErr(""); setViews(r.view_count);
    const c = sb(); const path = r.watermark_path ?? r.storage_path;
    if (!c) { setErr("Demo build: playback needs the live site."); return; }
    if (!path) { if (r.source_url) setUrl(r.source_url); else setErr("This clip has no file to play."); return; }
    signFor(r).then((u) => (u ? setUrl(u) : setErr("That clip wouldn't load. Try again.")));
    // Line up the next one too.
    const n = list[list.findIndex((x) => x.id === r.id) + 1]; if (n) signFor(n);
  }, [r]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); document.body.style.overflow = "hidden"; return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; }; }, [onClose]);
  function counted1() {
    if (counted.current === r.id) return;
    counted.current = r.id;
    const c = sb(); if (!c) return;
    c.rpc("record_view", { p_clip: r.id, p_anon: anonKey() }).then(({ error }) => { if (!error) setViews((v) => v + 1); });
  }
  const isFile = Boolean(r.watermark_path ?? r.storage_path);
  const next = list.filter((x) => x.id !== r.id).slice(0, 8);
  return (
    <div className="hub-scrim theater" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={r.title} className="hub-theater" onClick={(e) => e.stopPropagation()}>
        <div className="hub-stage">
          <div ref={frame} className="clip-frame relative aspect-video bg-black">
            {url && isFile && (
              <video key={url} src={url} poster={thumbOf(r)} controls autoPlay playsInline preload="auto" onPlay={counted1}
                controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} className="h-full w-full object-contain" />
            )}
            {url && !isFile && <div className="grid h-full place-items-center"><a href={url} target="_blank" rel="noreferrer" onClick={counted1} className="btn btn-hot">Watch on the original site ↗</a></div>}
            {!url && !err && <div className="grid h-full place-items-center"><span className="block size-8 animate-spin rounded-full border-2 border-white border-t-transparent" /></div>}
            {err && <div className="grid h-full place-items-center p-6 text-center text-white/80">{err}</div>}
            {isFile && <div className="clip-mark" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/live-from-leonida-avatar-180.png" alt="" /><span><b>@{r.gamertag}</b><i>livefromleonida.com</i></span>
            </div>}
          </div>
          <div className="mt-4 flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold leading-snug">{r.title}</h2>
              <p className="hub-by mt-1">{r.gamertag} on {platformName[r.platform]} · {num(views)} view{views === 1 ? "" : "s"} · {ago(r.published_at)}</p>
              {r.tags.length > 0 && <ul className="hub-tags mt-2">{r.tags.map((x) => <li key={x}>{tl(x)}</li>)}</ul>}
            </div>
            <div className="flex gap-2">
              <button className={`btn ${fav ? "bg-gulf text-white" : "btn-ghost"} !py-2`} aria-pressed={fav} onClick={onFav}>{fav ? "♥ Saved" : "♡ Favorite"}</button>
              {showVote && !mine && (voted ? <span className="hub-voted self-center">Voted ✓</span>
                : r.votable && <button className="btn btn-hot !py-2" onClick={onVote}>Vote</button>)}
              <button className={`btn !py-2 ${downloaded ? "btn-dl-done" : "btn-ghost"}`} onClick={onDownload}
                title={downloaded ? "Already downloaded — get it again at no charge" : "Download this clip"}>{downloaded ? "✓ Downloaded" : "↓ Download"}</button>
              <button className="btn btn-ghost !py-2" onClick={onClose} aria-label="Close player">Close</button>
            </div>
          </div>
        </div>
        {next.length > 0 && (
          <aside className="hub-next" aria-label="Up next">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-haze">Up next</p>
            {next.map((x) => (
              <button key={x.id} onClick={() => onPick(x)} className="hub-nextrow">
                <span className="hub-nextthumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {thumbOf(x) ? <img src={thumbOf(x)} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : null}
                  {x.duration_seconds != null && <span className="hub-dur">{dur(x.duration_seconds)}</span>}
                </span>
                <span className="min-w-0 text-left"><b>{x.title}</b><small>{x.gamertag} · {num(x.view_count)} views</small></span>
              </button>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
