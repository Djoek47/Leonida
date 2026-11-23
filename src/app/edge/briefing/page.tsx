"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { ART, img, shotFor } from "@/lib/briefingArt";
import { SaveGuide } from "@/components/SaveGuide";
import { lockScroll } from "@/lib/scrollLock";
import { CHAPTERS, MISSION_SOURCES, WHO, type Chapter, type Mission } from "@/lib/missions";
import { INTEL, MONEY_ROUTE, intelSource, type ChoiceTag, type Intel } from "@/lib/missionIntel";

/** Mission Briefing: a play-along tracker for the GTA VI story.
 *
 *  Pick where you are, open a mission, tick off each objective as you play it, collect the
 *  payout, hit Next. Progress and the chapter you're on live in this browser. Spoilers stay
 *  shut: chapters up to yours open in full, the next shows two mission names, the rest is
 *  locked. Street, Hustler and Kingpin read it; everyone else sees a locked preview. */

type Brief = { id: string; title: string; mission: string | null; summary: string | null; body: string; published_at: string | null; sources?: string[] };
type Progress = { done: string[]; steps: Record<string, number[]> };
const KEY = "lfl-chapter";
const PKEY = "lfl-mb-progress";
const PEEK = 2;

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const TAG: Record<ChoiceTag, string> = { pro: "Professional", violent: "Violent", rel: "Relationship", money: "Money", item: "Gear", story: "Story", none: "No effect" };

function loadProgress(): Progress {
  try { const p = JSON.parse(localStorage.getItem(PKEY) ?? "") as Progress; if (Array.isArray(p.done)) return { done: p.done, steps: p.steps ?? {} }; } catch {}
  return { done: [], steps: {} };
}

export default function MissionBriefing() {
  const { user, profile, paying, tier, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 1));
  const [rows, setRows] = useState<Brief[]>([]);
  const [cur, setCur] = useState<number | null>(null);
  const [view, setView] = useState<number>(1);
  const [prog, setProg] = useState<Progress>({ done: [], steps: {} });
  const [open, setOpen] = useState<{ ch: number; i: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let c = 0;
    try { const v = Number(localStorage.getItem(KEY)); c = Number.isInteger(v) && v >= 0 && v < CHAPTERS.length ? v : 0; } catch {}
    setCur(c); setView(c); setProg(loadProgress());
  }, []);
  const saveCur = useCallback((c: number) => { setCur(c); try { localStorage.setItem(KEY, String(c)); } catch {} }, []);
  const saveProg = useCallback((p: Progress) => { setProg(p); try { localStorage.setItem(PKEY, JSON.stringify(p)); localStorage.setItem("lfl-mb-at", String(Date.now())); } catch {} }, []);

  useEffect(() => {
    if (loading || !allowed) return;
    const c = sb(); if (!c) return;
    c.from("mission_briefings").select("id, title, mission, summary, body, published_at, sources").eq("published", true).order("published_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Brief[]));
  }, [allowed, loading]);

  const team = useMemo(() => {
    const m = new Map<string, Brief>();
    for (const b of rows) if (b.mission && !m.has(b.mission.toLowerCase())) m.set(b.mission.toLowerCase(), b);
    return m;
  }, [rows]);

  const done = useMemo(() => new Set(prog.done), [prog.done]);
  const reach = cur ?? 0;
  const storyTotal = useMemo(() => CHAPTERS.reduce((n, c) => n + c.missions.filter((m) => !m.optional).length, 0), []);
  const storyDone = useMemo(() => CHAPTERS.reduce((n, c) => n + c.missions.filter((m) => !m.optional && done.has(m.name)).length, 0), [done]);
  const earned = useMemo(() => CHAPTERS.filter((c) => c.id <= reach).reduce((s, c) => s + c.missions.reduce((t, m) => t + (done.has(m.name) ? INTEL[m.name]?.cash ?? 0 : 0), 0), 0), [done, reach]);
  const next = useMemo(() => {
    for (const c of CHAPTERS) {
      if (c.id > reach) break;
      const i = c.missions.findIndex((m) => !m.optional && !done.has(m.name));
      if (i >= 0) return { ch: c.id, i };
    }
    return null;
  }, [done, reach]);

  function toggleStep(name: string, k: number) {
    const s = new Set(prog.steps[name] ?? []);
    if (s.has(k)) s.delete(k); else s.add(k);
    saveProg({ ...prog, steps: { ...prog.steps, [name]: [...s] } });
  }
  function setDone(c: Chapter, m: Mission, on: boolean) {
    const d = new Set(prog.done);
    if (on) d.add(m.name); else d.delete(m.name);
    const steps = { ...prog.steps };
    if (on && INTEL[m.name]) steps[m.name] = INTEL[m.name].steps.map((_, k) => k);
    saveProg({ done: [...d], steps });
    if (!on) return;
    const cleared = c.missions.filter((x) => !x.optional).every((x) => d.has(x.name));
    if (cleared && c.id === reach && c.id < CHAPTERS.length - 1) {
      saveCur(c.id + 1);
      setToast(`${c.label} cleared · ${CHAPTERS[c.id + 1].label} unlocked`);
    } else {
      const cash = INTEL[m.name]?.cash;
      setToast(cash ? `Mission complete · +${money(cash)}` : "Mission complete");
    }
    setTimeout(() => setToast(null), 2800);
  }
  function goNext(from: { ch: number; i: number }) {
    const c = CHAPTERS[from.ch];
    for (let i = from.i + 1; i < c.missions.length; i++) if (!c.missions[i].optional) { setOpen({ ch: from.ch, i }); return; }
    const nc = CHAPTERS[from.ch + 1];
    if (nc && nc.id <= (cur ?? 0)) { setView(nc.id); setOpen({ ch: nc.id, i: 0 }); return; }
    setOpen(null);
  }

  if (loading || cur === null) return <div className="mx-auto max-w-6xl px-4 py-12"><p className="text-haze font-semibold" role="status">Loading the briefing…</p></div>;
  if (!allowed) return <Locked signedIn={Boolean(user)} />;

  const ch = CHAPTERS[view];
  const state: "open" | "peek" | "locked" = view <= reach ? "open" : view === reach + 1 ? "peek" : "locked";
  const pct = Math.round((storyDone / storyTotal) * 100);
  const openM = open ? CHAPTERS[open.ch].missions[open.i] : null;
  const nextM = next ? CHAPTERS[next.ch].missions[next.i] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 [&>*]:min-w-0">
      <p className="dash-kicker"><Link href="/edge" className="underline underline-offset-4">The Edge</Link> · Street, Hustler and Kingpin</p>
      <h1 className="display text-5xl md:text-6xl mt-1">Mission Briefing</h1>
      <p className="mt-2 text-haze max-w-2xl">Play along. Open the mission you&apos;re on, tick each objective as you do it, grab the payout, hit next. Nothing past your chapter is shown.</p>

      <section className="mx-hud mt-7" aria-label="Your campaign">
        <div className="mx-ring" style={{ "--p": pct } as React.CSSProperties} role="img" aria-label={`${pct}% of the story done`}>
          <span><b>{pct}</b><small>%</small></span>
        </div>
        <dl className="mx-stats">
          <div><dt>Story missions</dt><dd>{storyDone}<small>/{storyTotal}</small></dd></div>
          <div><dt>Mission cash earned</dt><dd>{money(earned)}</dd></div>
          <div><dt>You&apos;re on</dt><dd>{CHAPTERS[reach].label}</dd></div>
        </dl>
        {next && nextM ? (
          <button className="mx-next" onClick={() => { setView(next.ch); setOpen(next); }}>
            <span className="mx-next-k">▶ Up next</span>
            <span className="mx-next-n">{nextM.n ? <i>#{String(nextM.n).padStart(2, "0")}</i> : null}{nextM.name}</span>
            <span className="mx-next-go">Open briefing</span>
          </button>
        ) : (
          <div className="mx-next is-done"><span className="mx-next-k">All caught up</span><span className="mx-next-n">Move your chapter on when you get there</span></div>
        )}
      </section>

      <nav className="mx-levels mt-6" aria-label="Chapters">
        {CHAPTERS.map((c) => {
          const s = c.missions.filter((m) => !m.optional);
          const d = s.filter((m) => done.has(m.name)).length;
          const lock = c.id > reach + 1;
          const clear = c.id <= reach && d === s.length;
          return (
            <button key={c.id} onClick={() => setView(c.id)} aria-current={view === c.id ? "page" : undefined}
              className={`mx-level${view === c.id ? " is-on" : ""}${lock ? " is-lock" : ""}${clear ? " is-clear" : ""}`}>
              <span className="mx-level-k">{c.id === 0 ? "Intro" : `Chapter ${c.id}`}{clear ? " ✓" : ""}</span>
              <span className="mx-level-t">{c.id <= reach ? c.title : lock ? "🔒 Locked" : "Up next"}</span>
              <span className="mx-level-bar"><i style={{ width: `${c.id <= reach ? (d / s.length) * 100 : 0}%` }} /></span>
            </button>
          );
        })}
      </nav>
      <div className="mx-where mt-3">
        <label htmlFor="mx-cur" className="font-bold">I&apos;m on</label>
        <select id="mx-cur" value={reach} onChange={(e) => { const v = Number(e.target.value); saveCur(v); setView(v); }} className="field !py-1.5 text-sm" style={{ width: "auto" }}>
          {CHAPTERS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <span className="text-haze">Saved on this device. Clearing a chapter moves you on by itself.</span>
        <Link href="/edge/briefing/choices" className="mx-road-link">🛣 The Road: choice tree →</Link>
      </div>

      <ChapterView c={ch} state={state} done={done} prog={prog} onOpen={(i) => setOpen({ ch: ch.id, i })} />

      <p className="mt-12 text-xs text-haze">
        Built from community walkthroughs and money guides, rewritten by our team:{" "}
        {MISSION_SOURCES.map((s, i) => <span key={s.href}>{i ? ", " : ""}<a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{s.label}</a></span>)},{" "}
        <a href="https://www.powerpyx.com/?p=370489" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">PowerPyx money guide</a>,{" "}
        <a href="https://alcasthq.com/?p=87542" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">AlcastHQ money guide</a>.
        Payouts are what the guides report and can vary a little in game.
      </p>

      {open && openM && (
        <Dossier c={CHAPTERS[open.ch]} i={open.i} m={openM} intel={INTEL[openM.name]} brief={team.get(openM.name.toLowerCase())}
          ticked={new Set(prog.steps[openM.name] ?? [])} isDone={done.has(openM.name)}
          onStep={(k) => toggleStep(openM.name, k)} onDone={(v) => setDone(CHAPTERS[open.ch], openM, v)}
          onNext={() => goNext(open)} onClose={() => setOpen(null)} />
      )}
      {toast && <div className="mx-toast" role="status">{toast}</div>}
    </div>
  );
}

/* ───────────── Chapter ───────────── */

function ChapterView({ c, state, done, prog, onOpen }: { c: Chapter; state: "open" | "peek" | "locked"; done: Set<string>; prog: Progress; onOpen: (i: number) => void }) {
  const story = c.missions.filter((m) => !m.optional);
  const d = story.filter((m) => done.has(m.name)).length;
  const cash = c.missions.reduce((s, m) => s + (INTEL[m.name]?.cash ?? 0), 0);
  const [side, setSide] = useState(false);
  const route = MONEY_ROUTE[c.id];

  if (state === "locked") {
    return (
      <section className="mx-locked mt-8">
        <span className="mx-locked-ico" aria-hidden>🔒</span>
        <p className="display text-3xl">{c.label} is locked</p>
        <p className="text-haze mt-1">{story.length} story missions are waiting. Reach the chapter before it and they open up, spoiler-free.</p>
      </section>
    );
  }

  if (state === "peek") {
    return (
      <section className="mt-8">
        <header className="mx-banner" style={{ backgroundImage: `url(${img(ART[c.id].banner)})` }}>
          <div className="mx-banner-in">
            <span className="mx-banner-k">{c.label} · Up next</span>
            <h2 className="display">Coming up</h2>
            <p className="mx-banner-p">{story.length} story missions. Here are the first two, in case you&apos;re curious.</p>
          </div>
        </header>
        <ol className="mx-grid mt-5">
          {story.slice(0, PEEK).map((m, i) => (
            <li key={m.name}>
              <div className="mx-tile is-peek" style={{ backgroundImage: `url(${img(shotFor(c.id, i))})` }}>
                <span className="mx-tile-n">{m.n}</span>
                <span className="mx-tile-plate"><b className="mx-tile-name display">{m.name}</b><span className="mx-tile-meta">Opens when you reach {c.label}</span></span>
              </div>
            </li>
          ))}
          {Array.from({ length: Math.min(4, story.length - PEEK) }, (_, i) => (
            <li key={i} aria-hidden><div className="mx-tile is-hidden"><span className="mx-tile-n">??</span><span className="mx-tile-plate"><b className="mx-tile-name display">Classified</b></span></div></li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <header className="mx-banner" style={{ backgroundImage: `url(${img(ART[c.id].banner)})` }}>
        <div className="mx-banner-in">
          <span className="mx-banner-k">{c.label}</span>
          <h2 className="display">{c.title}</h2>
          <div className="mx-banner-row">
            <span><b>{d}</b>/{story.length} cleared</span>
            {cash > 0 && <span><b>{money(cash)}</b> in mission payouts</span>}
            <span><b>{c.missions.length - story.length + c.strangers.length}</b> side jobs</span>
          </div>
          <span className="mx-banner-bar"><i style={{ width: `${(d / story.length) * 100}%` }} /></span>
        </div>
      </header>

      <div className="mx-two mt-5">
        {route && (
          <aside className="mx-route" aria-label={`${c.label} money route`}>
            <p className="mx-panel-k">💰 Money route</p>
            <p className="mx-route-h display">{route.headline}</p>
            <p className="mx-route-r">{route.rule}</p>
            <ol className="mx-route-list">
              {route.earners.map((e, i) => (
                <li key={e.name} className={e.best ? "is-best" : ""}>
                  <span className="mx-route-rank">{i + 1}</span>
                  <span className="min-w-0">
                    <b>{e.name}</b>
                    <span className="mx-route-how">{e.how}</span>
                    <span className="mx-route-un">Opens: {e.unlock}</span>
                  </span>
                  <span className="mx-route-pay">{e.pay}{e.per && <small>{e.per}</small>}</span>
                </li>
              ))}
            </ol>
          </aside>
        )}
        {c.tips.length > 0 && (
          <aside className="mx-notes" aria-label={`${c.label} briefing notes`}>
            <p className="mx-panel-k">⚠ Before you play</p>
            <ul>{c.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          </aside>
        )}
      </div>

      <SaveGuide ch={c.id} />

      <h3 className="mx-h3">Story missions</h3>
      <ol className="mx-grid">
        {c.missions.map((m, i) => m.optional ? null : <MissionTile key={m.name} m={m} shot={shotFor(c.id, i)} done={done.has(m.name)} ticks={(prog.steps[m.name] ?? []).length} onOpen={() => onOpen(i)} />)}
      </ol>

      {c.missions.some((m) => m.optional) && (
        <>
          <h3 className="mx-h3">Optional and missable</h3>
          <ol className="mx-grid is-small">
            {c.missions.map((m, i) => m.optional ? <MissionTile key={m.name} m={m} shot={shotFor(c.id, i + 3)} done={done.has(m.name)} ticks={(prog.steps[m.name] ?? []).length} onOpen={() => onOpen(i)} /> : null)}
          </ol>
        </>
      )}

      {c.strangers.length > 0 && (
        <div className="mt-8">
          <button className="mb-side-btn" onClick={() => setSide((v) => !v)} aria-expanded={side}>Strangers &amp; side jobs ({c.strangers.length}) <i aria-hidden>{side ? "−" : "+"}</i></button>
          {side && (
            <ol className="mb-grid !px-0">
              {c.strangers.map((s) => (
                <li key={s.name} className="mb-card is-stranger">
                  <div className="mb-card-top"><span className="mb-tag">Stranger · {s.giver}</span>{s.where && <span className="mb-where">{s.where}</span>}</div>
                  <b className="mb-name">{s.name}</b>
                  <p className="mb-goal">{s.goal}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function MissionTile({ m, shot, done, ticks, onOpen }: { m: Mission; shot: string; done: boolean; ticks: number; onOpen: () => void }) {
  const intel = INTEL[m.name];
  const total = intel?.steps.length ?? 0;
  const got = done ? total : Math.min(ticks, total);
  return (
    <li>
      <button onClick={onOpen} className={`mx-tile${done ? " is-done" : ""}${m.heist ? " is-heist" : ""}`} style={{ backgroundImage: `url(${img(shot)})` }} aria-haspopup="dialog">
        <span className="mx-tile-n">{m.n ? String(m.n).padStart(2, "0") : "+"}</span>
        <span className="mx-tile-flags">
          {m.heist && <span className="f-heist">Heist</span>}
          {m.missable && <span className="f-miss">Missable</span>}
          {intel?.missable && !m.missable && <span className="f-warn">Careful</span>}
          {intel?.choices?.length ? <span className="f-choice">Choice</span> : null}
        </span>
        {done && <span className="mx-tile-clear">✓ Cleared</span>}
        <span className="mx-tile-plate">
          <span className={`mx-who who-${m.who || "x"}`}>{WHO[m.who]}</span>
          <b className="mx-tile-name display">{m.name}</b>
          <span className="mx-tile-meta">
            {intel?.cash ? <em>{money(intel.cash)}</em> : null}
            {total ? <span>{got}/{total} objectives</span> : <span>Intel pending</span>}
          </span>
          {total > 0 && <span className="mx-tile-bar"><i style={{ width: `${(got / total) * 100}%` }} /></span>}
        </span>
      </button>
    </li>
  );
}

/* ───────────── Dossier ───────────── */

function Dossier({ c, i, m, intel, brief, ticked, isDone, onStep, onDone, onNext, onClose }: {
  c: Chapter; i: number; m: Mission; intel?: Intel; brief?: Brief; ticked: Set<number>; isDone: boolean;
  onStep: (k: number) => void; onDone: (v: boolean) => void; onNext: () => void; onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => { removeEventListener("keydown", onKey); unlock(); };
  }, [onClose]);
  useEffect(() => { box.current?.scrollTo({ top: 0 }); box.current?.focus(); }, [m.name]);

  const steps = intel?.steps ?? [m.goal];
  const got = isDone ? steps.length : steps.filter((_, k) => ticked.has(k)).length;
  const pct = Math.round((got / steps.length) * 100);
  const warn = [...(intel?.missable ?? []), ...(intel?.fail ?? [])];
  const src = intelSource(intel?.slug);

  return (
    <div className="pop-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Briefing: ${m.name}`} className="mx-dossier">
        <header className="mx-d-hero" style={{ backgroundImage: `url(${img(shotFor(c.id, i))})` }}>
          <button onClick={onClose} className="mx-d-x" aria-label="Close">✕</button>
          <div className="mx-d-hero-in">
            <span className="mx-d-k">{c.label} · {m.n ? `Mission ${String(m.n).padStart(2, "0")}` : "Optional"}{m.heist ? " · Heist" : ""}</span>
            <h2 className="display">{m.name}</h2>
            <div className="mx-d-tags">
              <span className={`mx-who who-${m.who || "x"}`}>{WHO[m.who]}</span>
              {intel?.where && <span className="mx-d-where">📍 {intel.where}</span>}
              {m.missable && <span className="mx-d-miss">Missable</span>}
              {isDone && <span className="mx-d-done">✓ Cleared</span>}
            </div>
            <p className="mx-d-goal">{m.goal}</p>
          </div>
        </header>

        <div className="mx-d-body">
          <section className="mx-d-obj">
            <div className="mx-d-obj-h">
              <p className="mx-panel-k">Objectives</p>
              <span className="mx-d-pct">{got}/{steps.length}</span>
            </div>
            <span className="mx-d-bar"><i style={{ width: `${pct}%` }} /></span>
            <ol className="mx-steps">
              {steps.map((s, k) => {
                const on = isDone || ticked.has(k);
                return (
                  <li key={k} className={on ? "is-on" : ""}>
                    <button onClick={() => !isDone && onStep(k)} disabled={isDone} aria-pressed={on}>
                      <span className="mx-step-n">{on ? "✓" : k + 1}</span>
                      <span className="mx-step-t">{s}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {!intel && <p className="text-xs text-haze mt-3">Full walkthrough pending. We add the step-by-step as soon as it&apos;s confirmed.</p>}
          </section>

          <div className="mx-d-side">
            {intel?.cash || intel?.loot?.length ? (
              <section className="mx-loot">
                <p className="mx-panel-k">Rewards</p>
                {intel?.cash ? <p className="mx-loot-cash">{money(intel.cash)}</p> : null}
                {intel?.loot && <ul>{intel.loot.map((l) => <li key={l}>{l}</li>)}</ul>}
              </section>
            ) : null}
            {warn.length > 0 && (
              <section className="mx-warn">
                <p className="mx-panel-k">⚠ Watch out</p>
                <ul>{warn.map((w) => <li key={w}>{w}</li>)}</ul>
              </section>
            )}
            {intel?.tips && intel.tips.length > 0 && (
              <section className="mx-intel">
                <p className="mx-panel-k">Intel</p>
                <ul>{intel.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </section>
            )}
          </div>

          {intel?.choices && intel.choices.length > 0 && (
            <section className="mx-choices">
              <p className="mx-panel-k">Your choices</p>
              <ul>
                {intel.choices.map((x) => (
                  <li key={x.at + x.pick} className={`t-${x.tag}`}>
                    <span className="mx-ch-at">{x.at}</span>
                    <b>{x.pick}</b>
                    <span className="mx-ch-then"><i aria-hidden>→</i> {x.then}</span>
                    <span className="mx-ch-tag">{TAG[x.tag]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {brief && (
            <section className="mx-team">
              <p className="mx-panel-k">★ Team briefing</p>
              {brief.summary && <p className="font-bold">{brief.summary}</p>}
              {brief.body.split(/\n{2,}/).map((p, k) => <p key={k}>{p}</p>)}
            </section>
          )}

          <footer className="mx-d-foot">
            {isDone
              ? <button className="btn btn-ghost" onClick={() => onDone(false)}>Undo complete</button>
              : <button className="btn btn-hot" onClick={() => onDone(true)}>✓ Mission complete</button>}
            <button className="btn mx-d-next" onClick={onNext}>Next mission ▶</button>
            {src && <a href={src} target="_blank" rel="noopener noreferrer" className="mx-d-src">Source walkthrough</a>}
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Locked preview ───────────── */

function Locked({ signedIn }: { signedIn: boolean }) {
  const story = CHAPTERS[1].missions.filter((m) => !m.optional).slice(0, 8);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 [&>*]:min-w-0">
      <p className="dash-kicker"><Link href="/edge" className="underline underline-offset-4">The Edge</Link> · Street, Hustler and Kingpin</p>
      <h1 className="display text-5xl md:text-6xl mt-1">Mission Briefing</h1>
      <p className="mt-2 text-haze max-w-2xl">A play-along tracker for every GTA VI mission: step-by-step objectives you tick off, payouts, missables, the choices that matter, and the fastest money route for each chapter. No spoilers past where you are.</p>
      <section className="brief-locked mt-8">
        <div className="brief-lock-head">
          <span className="brief-lock-ico" aria-hidden>🔒</span>
          <div>
            <p className="font-extrabold text-lg">Mission Briefing comes with Street, Hustler and Kingpin.</p>
            <p className="text-haze text-sm">{signedIn ? "Upgrade your plan to start tracking." : "Sign in with a Street, Hustler or Kingpin plan to start tracking."}</p>
          </div>
          <Link href={signedIn ? "/pricing" : "/login?next=/edge/briefing"} className="btn btn-hot ml-auto">{signedIn ? "See the plans" : "Sign in"}</Link>
        </div>
      </section>
      <ol className="mx-grid mt-6" aria-label="Chapter 1 preview">
        {story.map((m, i) => (
          <li key={m.name}>
            <div className="mx-tile is-peek" style={{ backgroundImage: `url(${img(shotFor(1, i))})` }}>
              <span className="mx-tile-n">{String(m.n).padStart(2, "0")}</span>
              <span className="mx-tile-plate"><b className="mx-tile-name display">{m.name}</b><span className="mx-tile-meta">🔒 Briefing locked</span></span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
