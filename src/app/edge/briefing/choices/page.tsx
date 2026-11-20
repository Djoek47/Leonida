"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { CHAPTERS } from "@/lib/missions";
import { ENDING_NOTE, FORKS, TREE_SOURCES, type Fork } from "@/lib/choiceTree";

/** The Road: GTA VI's choices as one night drive through Leonida.
 *
 *  Every fork splits the road. Pick a lane and it lights up; the others close behind you.
 *  Forks unlock in order, outcomes stay sealed until you've driven every fork in reach (or
 *  you flip Spoilers on), and the bridge at the end shows where your run lands. Without
 *  spoilers, chapters past the one you're on (from Mission Briefing) stay behind a roadblock. */

const KEY = "lfl-chapter";
const PICKS = "lfl-road";
const PROFILE = ["Psycho", "Violent", "Hardened", "Professional"];
const HEART = ["Running on Empty", "Not So Hot", "Crazy in Love", "Hot Together"];
const money = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US")}`;

export default function TheRoad() {
  const { profile, paying, tier, loading, user } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 1));
  const [reach, setReach] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [spoil, setSpoil] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(KEY)); if (Number.isInteger(v) && v >= 0) setReach(v);
      setPicks(JSON.parse(localStorage.getItem(PICKS) ?? "{}"));
    } catch {}
    setReady(true);
  }, []);
  const save = (p: Record<string, number>) => { setPicks(p); try { localStorage.setItem(PICKS, JSON.stringify(p)); } catch {} };

  const visible = useMemo(() => FORKS.filter((f) => spoil || f.ch <= reach), [spoil, reach]);
  const nextId = visible.find((f) => picks[f.id] === undefined)?.id ?? null;
  const done = visible.filter((f) => picks[f.id] !== undefined).length;
  const allDone = done === visible.length && visible.length > 0;
  const revealed = spoil || allDone;
  const reachedEnd = visible.some((f) => f.id === "bridge");

  const tally = useMemo(() => {
    let pro = 0, vio = 0, rel = 0, cash = 0; const gear: string[] = []; const log: { ch: number; text: string; big?: boolean }[] = [];
    for (const f of FORKS) {
      const i = picks[f.id]; if (i === undefined || !visible.includes(f)) continue;
      const fx = f.options[i].fx;
      pro += fx.pro ?? 0; vio += fx.vio ?? 0; rel += fx.rel ?? 0; cash += fx.cash ?? 0;
      if (fx.gear) gear.push(fx.gear);
      log.push({ ch: f.ch, text: fx.log, big: f.big });
    }
    const lean = pro + vio === 0 ? 2 : Math.max(0, Math.min(3, Math.round(((pro - vio) / (pro + vio) + 1) * 1.5)));
    const heart = Math.max(0, Math.min(3, 2 + Math.sign(rel) * (Math.abs(rel) >= 3 ? 1 : 0) - (rel < 0 ? 1 : 0)));
    return { pro, vio, rel, cash, gear, log, lean, heart };
  }, [picks, visible]);

  function choose(f: Fork, i: number) {
    if (f.id !== nextId) return;
    save({ ...picks, [f.id]: i });
  }
  function rewind(f: Fork) {
    const idx = FORKS.indexOf(f);
    const n = { ...picks }; FORKS.slice(idx).forEach((x) => { delete n[x.id]; });
    save(n);
  }

  if (loading || !ready) return <div className="road"><p className="road-wrap text-white/70 py-16">Starting the engine…</p></div>;

  return (
    <div className="road">
      <div className="road-stars" aria-hidden />
      <div className="road-wrap">
        <p className="road-kick"><Link href="/edge/briefing" className="underline underline-offset-4">Mission Briefing</Link> · Choice tree</p>
        <h1 className="road-title"><span>The</span> Road</h1>
        <p className="road-sub">Every choice in Jason and Lucia&apos;s story, as one drive through Leonida. Pick a lane at each fork: it lights up and the others close behind you. What each choice does stays sealed until you&apos;ve driven every fork, unless you flip spoilers on.</p>

        {!allowed ? (
          <div className="road-gate">
            <p className="font-extrabold text-lg">The Road comes with Street, Hustler and Kingpin.</p>
            <Link href={user ? "/pricing" : "/login?next=/edge/briefing/choices"} className="btn btn-hot mt-3">{user ? "See the plans" : "Sign in"}</Link>
          </div>
        ) : (
          <>
            <div className="road-dash" role="group" aria-label="Your drive">
              <div className="road-gauge"><span className="road-gauge-k">Forks driven</span><b>{done}<small>/{visible.length}</small></b></div>
              <div className="road-gauge"><span className="road-gauge-k">You&apos;re on</span><b className="text-base">{CHAPTERS[Math.min(reach, CHAPTERS.length - 1)].label}</b></div>
              <button className={`road-switch${spoil ? " is-on" : ""}`} onClick={() => setSpoil((v) => !v)} aria-pressed={spoil}>
                <span className="road-switch-track"><i /></span>
                <span><b>Spoilers {spoil ? "on" : "off"}</b><small>{spoil ? "Every chapter and outcome shown" : "Outcomes sealed · chapters past yours closed"}</small></span>
              </button>
              {done > 0 && <button className="road-reset" onClick={() => save({})}>Start over</button>}
            </div>

            <div className="road-track">
              <div className="road-spine" aria-hidden />
              {CHAPTERS.filter((c) => c.id >= 1).map((c) => {
                const forks = FORKS.filter((f) => f.ch === c.id);
                const closed = !spoil && c.id > reach;
                return (
                  <Fragment key={c.id}>
                    <div className={`road-exit${closed ? " is-closed" : ""}`}>
                      <span className="road-exit-n">EXIT {c.id}</span>
                      <span className="road-exit-t">{closed ? "Road closed" : c.title}</span>
                      <span className="road-exit-m">{closed ? `Reach ${c.label} or turn on spoilers` : `${forks.length} forks ahead`}</span>
                    </div>
                    {closed ? (
                      c.id === reach + 1 ? <div className="road-block" aria-hidden><i /><i /><i /></div> : null
                    ) : (
                      forks.map((f) => <ForkView key={f.id} f={f} pick={picks[f.id]} state={picks[f.id] !== undefined ? "done" : f.id === nextId ? "now" : "later"} revealed={revealed} onPick={(i) => choose(f, i)} onRewind={() => rewind(f)} />)
                    )}
                  </Fragment>
                );
              })}
            </div>

            <section className={`road-end${allDone ? " is-done" : ""}`} aria-live="polite">
              <p className="road-end-k">{allDone ? (reachedEnd ? "The end of your road" : "Your road so far") : "Finish the drive to unseal your story"}</p>
              {allDone || spoil ? (
                <>
                  {reachedEnd && picks.bridge !== undefined && (
                    <div className="road-ending">
                      <span className="road-ending-k">At the bridge you chose</span>
                      <b className="road-ending-t">{FORKS.find((f) => f.id === "bridge")!.options[picks.bridge].pick}</b>
                      <p>{FORKS.find((f) => f.id === "bridge")!.options[picks.bridge].outcome}</p>
                      <p className="road-ending-note">{ENDING_NOTE}</p>
                    </div>
                  )}
                  <div className="road-meters">
                    <div className="road-meter">
                      <span className="road-meter-k">Criminal Profile</span>
                      <div className="road-bar is-profile"><i style={{ left: `${(tally.lean / 3) * 100}%` }} /></div>
                      <div className="road-meter-ends"><span>Psycho</span><b>{PROFILE[tally.lean]}</b><span>Professional</span></div>
                    </div>
                    <div className="road-meter">
                      <span className="road-meter-k">Jason &amp; Lucia</span>
                      <div className="road-hearts">{[0, 1, 2, 3].map((k) => <i key={k} className={k <= tally.heart ? "on" : ""} aria-hidden>♥</i>)}</div>
                      <div className="road-meter-ends"><b>{HEART[tally.heart]}</b></div>
                    </div>
                    <div className="road-meter">
                      <span className="road-meter-k">Money your choices made</span>
                      <b className="road-cash">{money(tally.cash)}</b>
                    </div>
                    <div className="road-meter">
                      <span className="road-meter-k">Gear picked up</span>
                      <div className="road-gear">{tally.gear.length ? tally.gear.map((g) => <span key={g}>{g}</span>) : <span>Nothing extra</span>}</div>
                    </div>
                  </div>
                  {tally.log.length > 0 && (
                    <ol className="road-log">
                      {tally.log.map((l, k) => <li key={k} className={l.big ? "is-big" : ""}><span>Ch. {l.ch}</span>{l.text}</li>)}
                    </ol>
                  )}
                  <p className="road-fine">The profile and relationship readings are our estimate from these choices. The game also counts how you play between missions, so yours may differ.</p>
                </>
              ) : (
                <p className="road-sealed-msg">{visible.length - done} fork{visible.length - done === 1 ? "" : "s"} left in reach. Every outcome, your profile, your relationship and {reach >= 5 ? "your ending" : "your story log"} unlock when you reach the last one.</p>
              )}
            </section>

            <p className="road-src">Built from {TREE_SOURCES.map((s, i) => <span key={s.href}>{i ? ", " : ""}<a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}, rewritten by our team. Choices with no lasting effect are left out.</p>
          </>
        )}
      </div>
    </div>
  );
}

function ForkView({ f, pick, state, revealed, onPick, onRewind }: { f: Fork; pick?: number; state: "done" | "now" | "later"; revealed: boolean; onPick: (i: number) => void; onRewind: () => void }) {
  const n = f.options.length;
  const xs = f.options.map((_, i) => ((i + 0.5) / n) * 100);
  return (
    <div className={`fork is-${state}${f.big ? " is-big" : ""}`}>
      <div className="fork-node">
        <span className="fork-dot">{state === "now" && <Car />}</span>
        <span className="fork-mission">{f.big && <em>Key decision</em>}{f.mission}</span>
        <p className="fork-prompt">{f.prompt}</p>
      </div>
      <svg className="fork-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
        {xs.map((x, i) => <path key={i} d={`M50 0 C50 32, ${x} 26, ${x} 60`} className={pick === undefined ? "lane" : pick === i ? "lane is-lit" : "lane is-closed"} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="fork-opts" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {f.options.map((o, i) => {
          const chosen = pick === i, closed = pick !== undefined && !chosen;
          return (
            <button key={o.pick} onClick={() => onPick(i)} disabled={state !== "now"} aria-pressed={chosen}
              className={`fork-opt${chosen ? " is-chosen" : ""}${closed ? " is-closed" : ""}`}>
              <span className="fork-lane">Lane {String.fromCharCode(65 + i)}</span>
              <b>{o.pick}</b>
              {revealed
                ? <span className="fork-out">{o.outcome}</span>
                : <span className="fork-redact" aria-label="Outcome sealed"><i /><i /><i style={{ width: "55%" }} /></span>}
              {chosen && <span className="fork-stamp">Your road</span>}
              {closed && <span className="fork-closed"><span>Road closed</span></span>}
            </button>
          );
        })}
      </div>
      <svg className="fork-svg is-merge" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
        {xs.map((x, i) => <path key={i} d={`M${x} 0 C${x} 18, 50 18, 50 40`} className={pick === undefined ? "lane" : pick === i ? "lane is-lit" : "lane is-closed"} vectorEffect="non-scaling-stroke" />)}
      </svg>
      {state === "done" && <button className="fork-rewind" onClick={onRewind}>↺ Rewind to here</button>}
    </div>
  );
}

function Car() {
  return (
    <svg viewBox="0 0 40 24" className="fork-car" aria-label="You are here">
      <path d="M4 16 L8 8 Q10 5 14 5 H26 Q30 5 32 8 L36 16 Q38 16 38 18 V20 H2 V18 Q2 16 4 16 Z" />
      <circle cx="11" cy="20" r="3.2" /><circle cx="29" cy="20" r="3.2" />
    </svg>
  );
}
