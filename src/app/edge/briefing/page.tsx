"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { CHAPTERS, MISSION_SOURCES, WHO, type Chapter, type Mission } from "@/lib/missions";

type Brief = { id: string; title: string; mission: string | null; summary: string | null; body: string; published_at: string | null; sources?: string[] };
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const KEY = "lfl-chapter";
const PEEK = 2; // mission names shown from the next chapter

/** Mission Briefing: every GTA VI mission, chapter by chapter, without spoilers.
 *  The member says which chapter they're on. Chapters up to that one open in full; the next
 *  one shows its first two mission names only; everything after stays locked, titles included.
 *  Street, Hustler and Kingpin read it; everyone else sees the opening chapters' names. */
export default function MissionBriefing() {
  const { user, profile, paying, tier, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 1));
  const [rows, setRows] = useState<Brief[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [cur, setCur] = useState<number | null>(null);

  useEffect(() => {
    try { const v = Number(localStorage.getItem(KEY)); setCur(Number.isInteger(v) && v >= 0 && v < CHAPTERS.length ? v : 0); } catch { setCur(0); }
  }, []);
  const pick = (c: number) => {
    setCur(c);
    try { localStorage.setItem(KEY, String(c)); } catch {}
  };

  useEffect(() => {
    if (loading) return;
    const c = sb(); if (!c) return;
    if (allowed) {
      c.from("mission_briefings").select("id, title, mission, summary, body, published_at, sources").eq("published", true).order("published_at", { ascending: false })
        .then(({ data }) => setRows((data ?? []) as Brief[]));
    }
  }, [allowed, loading]);

  const known = useMemo(() => new Set(CHAPTERS.flatMap((c) => [...c.missions.map((m) => m.name.toLowerCase()), ...c.strangers.map((x) => x.name.toLowerCase())])), []);
  const byMission = useMemo(() => {
    const m = new Map<string, Brief>();
    for (const b of rows) if (b.mission && known.has(b.mission.toLowerCase()) && !m.has(b.mission.toLowerCase())) m.set(b.mission.toLowerCase(), b);
    return m;
  }, [rows, known]);
  const loose = rows.filter((b) => !b.mission || byMission.get(b.mission.toLowerCase())?.id !== b.id);
  const total = useMemo(() => CHAPTERS.reduce((n, c) => n + c.missions.length + c.strangers.length, 0), []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 [&>*]:min-w-0">
      <p className="dash-kicker"><Link href="/edge" className="underline underline-offset-4">The Edge</Link> · Street, Hustler and Kingpin</p>
      <h1 className="display text-5xl md:text-6xl mt-1">Mission Briefing</h1>
      <p className="mt-2 text-haze max-w-2xl">Every GTA VI mission, chapter by chapter. Tell us where you are and we only show you what you&apos;ve reached. No spoilers.</p>

      {loading || cur === null ? (
        <p className="mt-10 text-haze font-semibold" role="status">Loading the briefings…</p>
      ) : !allowed ? (
        <>
          <section className="brief-locked mt-8">
            <div className="brief-lock-head">
              <span className="brief-lock-ico" aria-hidden>🔒</span>
              <div>
                <p className="font-extrabold text-lg">Mission Briefing comes with Street, Hustler and Kingpin.</p>
                <p className="text-haze text-sm">{total} missions across the prologue and 5 chapters: objectives, who you play, missables, heist prep and money tips. {user ? "Upgrade your plan to open them." : "Sign in with a Street, Hustler or Kingpin plan to open them."}</p>
              </div>
              <Link href={user ? "/pricing" : "/login?next=/edge/briefing"} className="btn btn-hot ml-auto">{user ? "See the plans" : "Sign in"}</Link>
            </div>
            <ul className="brief-teasers" aria-label="Opening missions">
              {CHAPTERS[1].missions.filter((m) => !m.optional).slice(0, 6).map((m) => <li key={m.name}><b>{m.name}</b><span>Chapter 1</span></li>)}
            </ul>
          </section>
        </>
      ) : (
        <>
          <section className="mb-picker mt-8" aria-label="Which chapter are you on?">
            <p className="font-extrabold">Where are you in the story?</p>
            <div className="mb-chips" role="radiogroup">
              {CHAPTERS.map((c) => (
                <button key={c.id} role="radio" aria-checked={cur === c.id} className={`mb-chip${cur === c.id ? " is-on" : ""}`} onClick={() => pick(c.id)}>{c.label}</button>
              ))}
            </div>
            <p className="text-haze text-sm mt-2">Saved on this device. Move it forward whenever you finish a chapter.</p>
          </section>

          <div className="mt-6 grid gap-6">
            {CHAPTERS.map((c) => <ChapterBlock key={c.id} c={c} team={byMission} state={c.id <= cur ? "open" : c.id === cur + 1 ? "peek" : "locked"} />)}
          </div>

          {loose.length > 0 && (
            <section className="mt-12">
              <h2 className="display text-3xl">From the team</h2>
              <ul className="mt-4 grid gap-3">
                {loose.map((b) => {
                  const on = open === b.id;
                  return (
                    <li key={b.id} className={`brief${on ? " is-open" : ""}`}>
                      <button className="brief-head" onClick={() => setOpen(on ? null : b.id)} aria-expanded={on}>
                        <span className="min-w-0">
                          {b.mission && <span className="brief-mission">{b.mission}</span>}
                          <span className="brief-title">{b.title}</span>
                          {b.summary && <span className="brief-sum">{b.summary}</span>}
                        </span>
                        <span className="brief-date">{day(b.published_at)}</span>
                      </button>
                      {on && <div className="brief-body">{b.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <p className="mt-10 text-xs text-haze">
            Mission list compiled from community guides and rewritten by our team:{" "}
            {MISSION_SOURCES.map((s, i) => <span key={s.href}>{i ? ", " : ""}<a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{s.label}</a></span>)}.
            Some details are still being confirmed.
          </p>
        </>
      )}
    </div>
  );
}

function ChapterBlock({ c, state, team }: { c: Chapter; state: "open" | "peek" | "locked"; team: Map<string, Brief> }) {
  const [side, setSide] = useState(false);
  const story = c.missions.filter((m) => !m.optional);
  const head = (
    <header className="mb-ch-head">
      <span className="mb-ch-num">{c.label}</span>
      <h2 className="display text-3xl md:text-4xl">{state === "open" || c.id === 0 ? c.title : state === "peek" ? "Up next" : "Locked"}</h2>
      <span className="mb-ch-count">{story.length} story · {c.missions.length - story.length + c.strangers.length} side</span>
    </header>
  );

  if (state === "locked") {
    return (
      <section className="mb-ch is-locked">
        {head}
        <p className="mb-lockline"><span aria-hidden>🔒</span> Reach the chapter before this one to see what&apos;s here.</p>
      </section>
    );
  }

  if (state === "peek") {
    return (
      <section className="mb-ch is-peek">
        {head}
        <p className="text-haze text-sm px-5 pt-3">The first two missions, in case you&apos;re curious. The rest opens when you get here.</p>
        <ol className="mb-peek">
          {story.slice(0, PEEK).map((m) => <li key={m.name}><span className="mb-n">{m.n}</span><b>{m.name}</b></li>)}
          {Array.from({ length: Math.min(3, story.length - PEEK) }, (_, i) => <li key={i} className="is-hidden" aria-hidden><span className="mb-n">?</span><b>██████ ████</b></li>)}
        </ol>
        <p className="mb-lockline"><span aria-hidden>🔒</span> {story.length - PEEK} more story missions hidden</p>
      </section>
    );
  }

  return (
    <section className="mb-ch">
      {head}
      {c.tips.length > 0 && (
        <aside className="mb-tips" aria-label={`${c.label} briefing notes`}>
          <p className="mb-tips-k">Briefing notes</p>
          <ul>{c.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        </aside>
      )}
      <ol className="mb-grid">{c.missions.map((m) => <MissionCard key={m.name} m={m} brief={team.get(m.name.toLowerCase())} />)}</ol>
      {c.strangers.length > 0 && (
        <div className="mb-side">
          <button className="mb-side-btn" onClick={() => setSide((v) => !v)} aria-expanded={side}>
            Strangers &amp; side jobs ({c.strangers.length}) <i aria-hidden>{side ? "−" : "+"}</i>
          </button>
          {side && (
            <ol className="mb-grid">
              {c.strangers.map((s) => (
                <li key={s.name} className="mb-card is-stranger">
                  <div className="mb-card-top"><span className="mb-tag">Stranger · {s.giver}</span>{s.where && <span className="mb-where">{s.where}</span>}</div>
                  <b className="mb-name">{s.name}</b>
                  <p className="mb-goal">{s.goal}</p>
                  <TeamBrief b={team.get(s.name.toLowerCase())} />
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function MissionCard({ m, brief }: { m: Mission; brief?: Brief }) {
  return (
    <li className={`mb-card${m.heist ? " is-heist" : ""}${m.optional ? " is-opt" : ""}`}>
      <div className="mb-card-top">
        <span className="mb-n">{m.n ?? "+"}</span>
        <span className={`mb-who who-${m.who || "x"}`}>{WHO[m.who]}</span>
      </div>
      <b className="mb-name">{m.name}</b>
      <p className="mb-goal">{m.goal}</p>
      <TeamBrief b={brief} />
      {(m.optional || m.missable || m.heist) && (
        <div className="mb-flags">
          {m.heist && <span className="mb-flag f-heist">Heist</span>}
          {m.optional && <span className="mb-flag">Optional</span>}
          {m.missable && <span className="mb-flag f-miss">Missable</span>}
        </div>
      )}
    </li>
  );
}

/** A team-written briefing attached to one mission card. */
function TeamBrief({ b }: { b?: Brief }) {
  const [on, setOn] = useState(false);
  if (!b) return null;
  return (
    <div className="mb-team">
      <button onClick={() => setOn((v) => !v)} aria-expanded={on} className="mb-team-btn">★ Team briefing <i aria-hidden>{on ? "−" : "+"}</i></button>
      {on && (
        <div className="mb-team-body">
          {b.summary && <p className="font-bold">{b.summary}</p>}
          {b.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          {b.sources && b.sources.length > 0 && <p className="text-xs text-haze">Sources: {b.sources.map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="underline mr-2">{u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</a>)}</p>}
        </div>
      )}
    </div>
  );
}
