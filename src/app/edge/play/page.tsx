"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { CHAPTERS, WHO, type Mission } from "@/lib/missions";
import { INTEL, MONEY_ROUTE } from "@/lib/missionIntel";
import { type Fork } from "@/lib/choiceTree";
import { img, shotFor } from "@/lib/briefingArt";
import { EconPanel } from "./EconPanel";
import {
  forksFor, loadAll, markTour, nextUp, perfectPick, picked, resetAll, saveBefore, savePerfect, savePicks,
  saveProg, saveReach, story, tourSeen, type Picks, type Progress,
} from "@/lib/perfectPlay";

/** Perfect Play: Mission Briefing and The Road in one light, phone-first screen.
 *  Opens on your next mission. Tap Done, log the choice you made, and it rolls on.
 *  Same device storage as the full Briefing and The Road, so all three stay in sync. */
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const SAVES = "lfl-saves";
const TOUR = [
  { t: "Your chapters", p: "The strip up top is your story. Rings fill as you clear missions. Tap a chapter to see its list and tick anything you've already done." },
  { t: "Your next mission", p: "The card is what to play now: one line on what to do, the pay, and a save reminder when a big choice is coming." },
  { t: "Choices", p: "When a mission has a choice, log what you picked. Switch on ★ Perfect play to see the pick that leads to the best ending." },
  { t: "Done, next", p: "Finished it? Tap Mission done. Clearing a chapter opens the next one by itself. Everything saves on this device." },
];

export default function PerfectPlay() {
  const { user, profile, paying, tier, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 1));
  const [boot, setBoot] = useState(true);
  const [prog, setProg] = useState<Progress>({ done: [], steps: {} });
  const [reach, setReach] = useState(0);
  const [picks, setPicks] = useState<Picks>({});
  const [perfect, setPerfect] = useState(false);
  // The Economist side panel: off unless the player opens it; remembered on this device.
  const [econ, setEcon] = useState(false);
  useEffect(() => { try { setEcon(localStorage.getItem("lfl-pp-econ") === "1"); } catch {} }, []);
  const toggleEcon = (on?: boolean) => setEcon((v) => { const n = on ?? !v; try { localStorage.setItem("lfl-pp-econ", n ? "1" : "0"); } catch {} return n; });
  const [saves, setSaves] = useState<number[]>([]);
  const [sheet, setSheet] = useState<null | { kind: "chapter"; ch: number } | { kind: "ask"; m: Mission; ch: number } | { kind: "menu" } | { kind: "reset" }>(null);
  const [steps, setSteps] = useState(false);
  const [tour, setTour] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const a = loadAll();
    setProg(a.prog); setReach(a.reach); setPicks(a.picks); setPerfect(a.perfect);
    try { setSaves(JSON.parse(localStorage.getItem(SAVES) ?? "[]")); } catch {}
    const t = setTimeout(() => { setBoot(false); if (!tourSeen()) setTour(0); }, 1400);
    return () => clearTimeout(t);
  }, []);

  const done = useMemo(() => new Set(prog.done), [prog.done]);
  const now = useMemo(() => nextUp(done, reach), [done, reach]);
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(null), 2400); };

  const setPick = useCallback((f: Fork, i: number) => {
    const cur = picks[f.id];
    const v = f.multi ? ((cur ?? 0) ^ (1 << i)) : i;
    const n = { ...picks, [f.id]: v }; setPicks(n); savePicks(n);
  }, [picks]);

  const toggleSave = (slot: number) => {
    const n = saves.includes(slot) ? saves.filter((s) => s !== slot) : [...saves, slot];
    setSaves(n); try { localStorage.setItem(SAVES, JSON.stringify(n)); } catch {}
  };

  function setDone(ch: number, m: Mission, on: boolean) {
    const d = new Set(prog.done);
    if (on) d.add(m.name); else d.delete(m.name);
    const st = { ...prog.steps };
    if (on && INTEL[m.name]) st[m.name] = INTEL[m.name].steps.map((_, k) => k);
    const p = { done: [...d], steps: st }; setProg(p); saveProg(p);
    if (!on) return;
    const cleared = story(ch).every((x) => d.has(x.name));
    if (cleared && ch === reach && ch < CHAPTERS.length - 1) {
      setReach(ch + 1); saveReach(ch + 1); flash(`${CHAPTERS[ch].label} cleared · ${CHAPTERS[ch + 1].label} open`);
    } else {
      const cash = INTEL[m.name]?.cash; flash(cash ? `Mission done · +${money(cash)}` : "Mission done");
    }
    setSteps(false);
  }
  function finish(ch: number, m: Mission) {
    const open = forksFor(m).filter((f) => picks[f.id] === undefined && !f.multi);
    if (open.length) { setSheet({ kind: "ask", m, ch }); return; }
    setDone(ch, m, true);
  }

  if (loading) return <Frame><Splash /></Frame>;
  if (!allowed) return <Frame><Locked signedIn={Boolean(user)} /></Frame>;
  if (boot) return <Frame><Splash /></Frame>;

  const nowIdx = now ? CHAPTERS[now.ch].missions.findIndex((x) => x.name === now.m.name) : -1;
  const storyN = now ? story(now.ch) : [];
  const pos = now ? storyN.findIndex((x) => x.name === now.m.name) + 1 : 0;
  const intel = now ? INTEL[now.m.name] : undefined;
  const save = now ? saveBefore(now.m) : undefined;
  const forks = now ? forksFor(now.m) : [];
  const upNext = now ? storyN.slice(pos, pos + 3) : [];
  const route = MONEY_ROUTE[reach];

  const econCh = now?.ch ?? reach;
  return (
    <Frame split={econ} side={econ ? <EconPanel ch={econCh} missionName={now?.m.name} missionCash={intel?.cash} onClose={() => toggleEcon(false)} /> : null}>
      <header className="pp-top">
        <Link href="/edge/briefing" className="pp-icon" aria-label="Back to the full briefing">←</Link>
        <p className="pp-brand"><img src="/brand/live-from-leonida-avatar-180.png" alt="" /> Perfect Play</p>
        <button className={`pp-star${perfect ? " is-on" : ""}`} onClick={() => { setPerfect(!perfect); savePerfect(!perfect); }} aria-pressed={perfect} title="Show the perfect-play picks">★</button>
        <button className={`pp-icon pp-econ-btn${econ ? " is-on" : ""}`} onClick={() => toggleEcon()} aria-pressed={econ} title={econ ? "Hide the Economist" : "Show the Economist beside your missions"} aria-label="Economist">💰</button>
        <button className="pp-icon" onClick={() => setSheet({ kind: "menu" })} aria-label="Menu">⋯</button>
      </header>

      <nav className="pp-chapters" aria-label="Chapters">
        {CHAPTERS.map((c) => {
          const s = story(c.id), n = s.filter((x) => done.has(x.name)).length, pct = s.length ? n / s.length : 0;
          const lock = c.id > reach;
          return (
            <button key={c.id} className={`pp-ch${now?.ch === c.id ? " is-now" : ""}${lock ? " is-lock" : ""}${pct === 1 ? " is-full" : ""}`}
              onClick={() => setSheet({ kind: "chapter", ch: c.id })} aria-label={`${c.label}: ${n} of ${s.length} done`}>
              <svg viewBox="0 0 36 36" aria-hidden><circle cx="18" cy="18" r="15" className="pp-ring-bg" /><circle cx="18" cy="18" r="15" className="pp-ring" strokeDasharray={`${pct * 94.2} 94.2`} /></svg>
              <b>{lock ? "🔒" : c.id === 0 ? "P" : c.id}</b>
              <small>{c.id === 0 ? "Prologue" : `Ch ${c.id}`}</small>
            </button>
          );
        })}
      </nav>

      <main className="pp-main">
        {!now ? (
          <section className="pp-card pp-end">
            <p className="pp-k">{reach >= CHAPTERS.length - 1 ? "Story complete" : "All caught up"}</p>
            <h2>{reach >= CHAPTERS.length - 1 ? "You made it to the end of the road." : "Nothing left in the chapters you've reached."}</h2>
            <p>Side missions and strangers are in the full briefing.</p>
            <Link href="/edge/briefing" className="pp-btn">Open the full briefing</Link>
          </section>
        ) : (
          <section className="pp-card" key={now.m.name}>
            <div className="pp-shot" style={{ backgroundImage: `url(${img(shotFor(now.ch, nowIdx))})` }}>
              <span className="pp-k">{CHAPTERS[now.ch].label} · {pos} of {storyN.length}</span>
              {now.m.who && <span className={`pp-who who-${now.m.who}`}>{WHO[now.m.who]}</span>}
            </div>
            <div className="pp-body">
              <h2>{now.m.name}</h2>
              <p className="pp-goal">{now.m.goal}</p>
              <div className="pp-chips">
                {intel?.cash ? <span className="pp-chip is-cash">💵 {money(intel.cash)}</span> : null}
                {now.m.heist && <span className="pp-chip">🎯 Heist</span>}
                {intel?.missable?.length ? <span className="pp-chip is-warn">⚠ Missable</span> : null}
              </div>

              {save && (
                <button className={`pp-save${saves.includes(save.slot) ? " is-on" : ""}`} onClick={() => toggleSave(save.slot)}>
                  <span aria-hidden>💾</span>
                  <span><b>{saves.includes(save.slot) ? `Saved in slot ${save.slot}` : `Save to slot ${save.slot} first`}</b><small>{save.why}</small></span>
                  <i aria-hidden>{saves.includes(save.slot) ? "✓" : ""}</i>
                </button>
              )}

              {forks.map((f) => {
                const mine = picked(f, picks[f.id]), best = perfect ? perfectPick(f) : [];
                return (
                  <div key={f.id} className={`pp-fork${f.big ? " is-big" : ""}`}>
                    <p className="pp-fork-q">{f.romance ? "♥ " : ""}{f.prompt}{f.multi ? <small> · pick any</small> : null}</p>
                    <div className="pp-opts">
                      {f.options.map((o, i) => (
                        <button key={i} onClick={() => setPick(f, i)} className={`pp-opt${mine.includes(i) ? " is-on" : ""}${best.includes(i) ? " is-best" : ""}`} aria-pressed={mine.includes(i)}>
                          {best.includes(i) && <span className="pp-best">★</span>}{o.pick}
                        </button>
                      ))}
                    </div>
                    {perfect && best.length === 0 && <p className="pp-out is-even">★ Either is fine: this one doesn&apos;t move the ending.</p>}
                    {mine.length > 0 && !f.multi && <p className="pp-out">{f.options[mine[0]].outcome}</p>}
                  </div>
                );
              })}

              {intel?.steps?.length ? (
                <div className="pp-steps">
                  <button onClick={() => setSteps(!steps)} aria-expanded={steps}>{steps ? "Hide the steps" : `Show the steps (${intel.steps.length})`}</button>
                  {steps && <ol>{intel.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>}
                </div>
              ) : null}

              <button className="pp-done" onClick={() => finish(now.ch, now.m)}>✓ Mission done</button>
            </div>
          </section>
        )}

        {upNext.length > 0 && (
          <section className="pp-next">
            <p className="pp-k">Up next</p>
            <ol>{upNext.map((m) => <li key={m.name}><b>{m.name}</b>{forksFor(m).length ? <span className="pp-tag">Choice</span> : null}{saveBefore(m) ? <span className="pp-tag is-save">Save</span> : null}</li>)}</ol>
          </section>
        )}

        {route && !econ && (
          <button type="button" onClick={() => toggleEcon(true)} className="pp-money">
            <span aria-hidden>💰</span><span><b>{route.headline}</b><small>Best money right now · open the Economist here</small></span><i aria-hidden>→</i>
          </button>
        )}
      </main>

      {toast && <p className="pp-toast" role="status">{toast}</p>}

      {sheet && (
        <div className="pp-sheet-bg" onClick={() => setSheet(null)}>
          <div className="pp-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <span className="pp-grab" aria-hidden />
            {sheet.kind === "chapter" && <ChapterSheet ch={sheet.ch} reach={reach} done={done} onToggle={(m, on) => setDone(sheet.ch, m, on)} />}
            {sheet.kind === "ask" && (
              <>
                <p className="pp-k">{sheet.m.name}</p>
                <h3>What did you pick?</h3>
                {forksFor(sheet.m).filter((f) => !f.multi).map((f) => {
                  const best = perfect ? perfectPick(f) : [];
                  return (
                    <div key={f.id} className="pp-fork">
                      <p className="pp-fork-q">{f.prompt}</p>
                      <div className="pp-opts">{f.options.map((o, i) => (
                        <button key={i} className={`pp-opt${picks[f.id] === i ? " is-on" : ""}${best.includes(i) ? " is-best" : ""}`} onClick={() => setPick(f, i)}>{best.includes(i) && <span className="pp-best">★</span>}{o.pick}</button>
                      ))}</div>
                    </div>
                  );
                })}
                <div className="pp-row">
                  <button className="pp-ghost" onClick={() => { const s = sheet; setSheet(null); setDone(s.ch, s.m, true); }}>Skip</button>
                  <button className="pp-btn" onClick={() => { const s = sheet; setSheet(null); setDone(s.ch, s.m, true); }}>Done, next mission</button>
                </div>
              </>
            )}
            {sheet.kind === "menu" && (
              <div className="pp-menu">
                <button onClick={() => { setPerfect(!perfect); savePerfect(!perfect); }}><span>★</span>Perfect play picks<em>{perfect ? "On" : "Off"}</em></button>
                <p className="pp-note">Perfect play marks the pick that pushes toward the best ending: a strong relationship, a Professional profile and more savings. It&apos;s our read of the guides; the game doesn&apos;t publish exact rules.</p>
                <button onClick={() => { setSheet(null); setTour(0); }}><span>?</span>How it works</button>
                <Link href="/edge/briefing"><span>📖</span>Full Mission Briefing</Link>
                <Link href="/edge/briefing/choices"><span>🛣</span>The Road (every choice)</Link>
                <button className="is-danger" onClick={() => setSheet({ kind: "reset" })}><span>↺</span>Reset my playthrough</button>
              </div>
            )}
            {sheet.kind === "reset" && (
              <>
                <h3>Start over?</h3>
                <p className="pp-note">This clears every mission you ticked, your logged choices and save slots on this device, here and in the full briefing. It can&apos;t be undone.</p>
                <div className="pp-row">
                  <button className="pp-ghost" onClick={() => setSheet(null)}>Keep my progress</button>
                  <button className="pp-btn is-danger" onClick={() => { resetAll(); try { localStorage.removeItem(SAVES); } catch {} setProg({ done: [], steps: {} }); setReach(0); setPicks({}); setSaves([]); setSheet(null); flash("Fresh start · Prologue"); }}>Reset</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tour !== null && (
        <div className="pp-tour" role="dialog" aria-label="How Perfect Play works">
          <div className="pp-tour-card">
            <p className="pp-k">Step {tour + 1} of {TOUR.length}</p>
            <h3>{TOUR[tour].t}</h3>
            <p>{TOUR[tour].p}</p>
            <div className="pp-dots" aria-hidden>{TOUR.map((_, i) => <i key={i} className={i === tour ? "on" : ""} />)}</div>
            <div className="pp-row">
              <button className="pp-ghost" onClick={() => { setTour(null); markTour(); }}>Skip</button>
              {tour < TOUR.length - 1
                ? <button className="pp-btn" onClick={() => setTour(tour + 1)}>Next</button>
                : <button className="pp-btn" onClick={() => { setTour(null); markTour(); }}>Let&apos;s play</button>}
            </div>
          </div>
        </div>
      )}
    </Frame>
  );
}

function ChapterSheet({ ch, reach, done, onToggle }: { ch: number; reach: number; done: Set<string>; onToggle: (m: Mission, on: boolean) => void }) {
  const c = CHAPTERS[ch];
  const [side, setSide] = useState(false);
  if (ch > reach) return (
    <>
      <p className="pp-k">{c.label}</p><h3>{c.title}</h3>
      <p className="pp-note">🔒 Clear {CHAPTERS[ch - 1].label} to open it. No spoilers until then.</p>
    </>
  );
  const s = c.missions.filter((m) => !m.optional), o = c.missions.filter((m) => m.optional);
  return (
    <>
      <p className="pp-k">{c.label} · {s.filter((m) => done.has(m.name)).length} of {s.length}</p>
      <h3>{c.title}</h3>
      <ul className="pp-list">{s.map((m) => <Row key={m.name} m={m} on={done.has(m.name)} onToggle={onToggle} />)}</ul>
      {o.length > 0 && (
        <>
          <button className="pp-side" onClick={() => setSide(!side)} aria-expanded={side}>{side ? "Hide" : "Show"} side missions ({o.length})</button>
          {side && <ul className="pp-list">{o.map((m) => <Row key={m.name} m={m} on={done.has(m.name)} onToggle={onToggle} />)}</ul>}
        </>
      )}
    </>
  );
}
function Row({ m, on, onToggle }: { m: Mission; on: boolean; onToggle: (m: Mission, on: boolean) => void }) {
  return (
    <li><button className={`pp-li${on ? " is-on" : ""}`} onClick={() => onToggle(m, !on)} aria-pressed={on}>
      <i aria-hidden>{on ? "✓" : ""}</i><span>{m.name}</span>{forksFor(m).length ? <em className="pp-tag">Choice</em> : null}
    </button></li>
  );
}

function Frame({ children, split, side }: { children: React.ReactNode; split?: boolean; side?: React.ReactNode }) {
  useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = o; }; }, []);
  if (!split) return <div className="pp-wrap"><div className="pp-app">{children}</div></div>;
  // Split: missions on one side, the Economist on the other (stacked top/bottom on phones).
  return <div className="pp-wrap"><div className="pp-split"><div className="pp-app">{children}</div>{side}</div></div>;
}
function Splash() {
  return (
    <div className="pp-splash" role="status" aria-label="Loading Perfect Play">
      <img src="/brand/live-from-leonida-avatar-400.png" alt="" />
      <p>Perfect Play</p>
      <small>Picking up where you left off…</small>
    </div>
  );
}
function Locked({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="pp-splash is-lock">
      <img src="/brand/live-from-leonida-avatar-400.png" alt="" />
      <p>Perfect Play</p>
      <small>Your mission-by-mission companion, for Street, Hustler and Kingpin members.</small>
      <Link href={signedIn ? "/pricing" : "/login?next=/edge/play"} className="pp-btn">{signedIn ? "See the plans" : "Sign in"}</Link>
    </div>
  );
}
