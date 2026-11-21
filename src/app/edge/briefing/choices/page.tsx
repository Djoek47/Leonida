"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { CHAPTERS } from "@/lib/missions";
import { ENDING_NOTE, FORKS, saveFor, TREE_SOURCES, type Fork } from "@/lib/choiceTree";

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
/** Relationship level from the hearts your choices add (they start out together at level 2). */
const heartLevel = (rel: number) => (rel <= -3 ? 0 : rel < 4 ? 1 : rel < 9 ? 2 : 3);
/** Options a pick covers: one lane, or every ticked box on a checklist fork. */
const chosen = (f: Fork, v: number | undefined) => (v === undefined ? [] : f.multi ? f.options.map((_, i) => i).filter((i) => v & (1 << i)) : [v]);
const money = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US")}`;

export default function TheRoad() {
  const { profile, paying, tier, loading, user } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 1));
  const [reach, setReach] = useState(1); // the Prologue has no choices, so the road starts at Chapter 1
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [spoil, setSpoil] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(KEY)); if (Number.isInteger(v) && v >= 0) setReach(Math.max(1, v));
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
    let pro = 0, vio = 0, rel = 0, cash = 0; const gear: string[] = []; const log: { ch: number; text: string; big?: boolean; heart?: boolean }[] = [];
    for (const f of FORKS) {
      const v = picks[f.id]; if (v === undefined || !visible.includes(f)) continue;
      const opts = chosen(f, v);
      for (const i of opts) {
        const fx = f.options[i].fx;
        pro += fx.pro ?? 0; vio += fx.vio ?? 0; rel += fx.rel ?? 0; cash += fx.cash ?? 0;
        if (fx.gear) gear.push(fx.gear);
        log.push({ ch: f.ch, text: fx.log, big: f.big, heart: f.romance });
      }
      if (f.multi && !opts.length) log.push({ ch: f.ch, text: "Skipped every errand before Lucia came home", big: f.big, heart: true });
    }
    const lean = pro + vio === 0 ? 2 : Math.max(0, Math.min(3, Math.round(((pro - vio) / (pro + vio) + 1) * 1.5)));
    const heart = heartLevel(rel);
    return { pro, vio, rel, cash, gear, log, lean, heart };
  }, [picks, visible]);

  // Any lane you've reached can be changed later: the picks after it stay as they are.
  function choose(f: Fork, i: number) {
    if (picks[f.id] === undefined && f.id !== nextId) return;
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
        <p className="road-sub">Every choice in Jason and Lucia&apos;s story, the romance included, as one drive through Leonida. Pick a lane at each fork and it lights up. Changed your mind? Tap another lane on any fork you&apos;ve driven to switch. What each choice does stays sealed until you&apos;ve driven every fork, unless you flip spoilers on.</p>

        {!allowed ? (
          <div className="road-gate">
            <p className="font-extrabold text-lg">The Road comes with Street, Hustler and Kingpin.</p>
            <Link href={user ? "/pricing" : "/login?next=/edge/briefing/choices"} className="btn btn-hot mt-3">{user ? "See the plans" : "Sign in"}</Link>
          </div>
        ) : (
          <>
            <div className="road-dash" role="group" aria-label="Your drive">
              <div className="road-gauge"><span className="road-gauge-k">Forks driven</span><b>{done}<small>/{visible.length}</small></b></div>
              <div className="road-gauge is-heart"><span className="road-gauge-k">Romance moments</span><b>{visible.filter((f) => f.romance && picks[f.id] !== undefined).length}<small>/{visible.filter((f) => f.romance).length}</small></b></div>
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
                      <span className="road-exit-m">{closed ? `Reach ${c.label} or turn on spoilers` : `${forks.filter((f) => picks[f.id] !== undefined).length}/${forks.length} forks driven · ${forks.filter((f) => f.romance).length} ♥`}</span>
                    </div>
                    {closed ? (
                      c.id === reach + 1 ? <div className="road-block" aria-hidden><i /><i /><i /></div> : null
                    ) : (
                      forks.map((f) => {
                        const st = picks[f.id] !== undefined ? "done" : f.id === nextId ? "now" : "later";
                        const sv = saveFor(f.id);
                        const node = f.multi
                          ? <Checklist key={f.id} f={f} pick={picks[f.id]} state={st} revealed={revealed} onPick={(m) => save({ ...picks, [f.id]: m })} onRewind={() => rewind(f)} />
                          : <ForkView key={f.id} f={f} pick={picks[f.id]} state={st} revealed={revealed} onPick={(i) => choose(f, i)} onRewind={() => rewind(f)} />;
                        return sv ? (
                          <Fragment key={f.id}>
                            <div className={`road-save${sv.key ? " is-key" : ""}`}>
                              <span className="road-save-disk" aria-hidden>💾</span>
                              <span><b>Save point · slot {sv.slot} of 15</b><small>Save before <i>{sv.before}</i>. {sv.why}</small></span>
                            </div>
                            {node}
                          </Fragment>
                        ) : node;
                      })
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
                      <small className="road-meter-note">{tally.rel >= 0 ? `+${tally.rel}` : tally.rel} hearts from your choices. Hot Together unlocks their most intimate scenes.</small>
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
                      {tally.log.map((l, k) => <li key={k} className={`${l.big ? "is-big" : ""}${l.heart ? " is-heart" : ""}`}><span>{l.heart ? "♥ " : ""}Ch. {l.ch}</span>{l.text}</li>)}
                    </ol>
                  )}
                  <p className="road-fine">The profile and relationship readings are our estimate from these choices. The game counts every small thing too (holding hands, greetings, gifts, texts), so yours may differ. The romance is optional: Jason and Lucia stay partners in crime at every level.</p>
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
    <div className={`fork is-${state}${f.big ? " is-big" : ""}${f.romance ? " is-heart" : ""}`}>
      <div className="fork-node">
        <span className="fork-dot">{state === "now" ? <Car /> : f.romance ? "♥" : null}</span>
        <span className="fork-mission">{f.romance && <em className="is-heart">♥ Jason &amp; Lucia</em>}{f.big && !f.romance && <em>Key decision</em>}{f.mission}</span>
        <p className="fork-prompt">{f.prompt}</p>
      </div>
      <svg className="fork-svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
        {xs.map((x, i) => <path key={i} d={`M50 0 C50 32, ${x} 26, ${x} 60`} className={pick === undefined ? "lane" : pick === i ? "lane is-lit" : "lane is-closed"} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div className="fork-opts" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {f.options.map((o, i) => {
          const chosen = pick === i, closed = pick !== undefined && !chosen;
          return (
            <button key={o.pick} onClick={() => !chosen && onPick(i)} disabled={state === "later"} aria-pressed={chosen} title={closed ? "Switch to this lane" : undefined}
              className={`fork-opt${chosen ? " is-chosen" : ""}${closed ? " is-closed" : ""}`}>
              <span className="fork-lane">Lane {String.fromCharCode(65 + i)}</span>
              <b>{o.pick}</b>
              {revealed
                ? <span className="fork-out">{o.outcome}</span>
                : <span className="fork-redact" aria-label="Outcome sealed"><i /><i /><i style={{ width: "55%" }} /></span>}
              {chosen && <span className="fork-stamp">Your road</span>}
              {closed && <span className="fork-closed"><span className="fork-closed-a">Road closed</span><span className="fork-closed-b">↪ Switch lane</span></span>}
            </button>
          );
        })}
      </div>
      <svg className="fork-svg is-merge" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
        {xs.map((x, i) => <path key={i} d={`M${x} 0 C${x} 18, 50 18, 50 40`} className={pick === undefined ? "lane" : pick === i ? "lane is-lit" : "lane is-closed"} vectorEffect="non-scaling-stroke" />)}
      </svg>
      {state === "done" && <button className="fork-rewind" onClick={onRewind}>↺ Clear from here</button>}
    </div>
  );
}

/** A checklist fork: tick any mix, then drive on. Ticks stay editable afterwards. */
function Checklist({ f, pick, state, revealed, onPick, onRewind }: { f: Fork; pick?: number; state: "done" | "now" | "later"; revealed: boolean; onPick: (mask: number) => void; onRewind: () => void }) {
  const [draft, setDraft] = useState(0);
  const mask = pick ?? draft;
  const n = f.options.filter((_, i) => mask & (1 << i)).length;
  const toggle = (i: number) => { const m = mask ^ (1 << i); if (pick === undefined) setDraft(m); else onPick(m); };
  return (
    <div className={`fork is-${state} is-heart is-multi${f.big ? " is-big" : ""}`}>
      <div className="fork-node">
        <span className="fork-dot">{state === "now" ? <Car /> : "♥"}</span>
        <span className="fork-mission"><em className="is-heart">♥ Jason &amp; Lucia · tick any</em>{f.mission}</span>
        <p className="fork-prompt">{f.prompt}</p>
      </div>
      <div className="fork-check">
        {f.options.map((o, i) => {
          const on = Boolean(mask & (1 << i));
          return (
            <button key={o.pick} className={`fork-tick${on ? " is-on" : ""}`} onClick={() => toggle(i)} disabled={state === "later"} aria-pressed={on}>
              <span className="fork-tick-box" aria-hidden>{on ? "♥" : ""}</span>
              <b>{o.pick}</b>
              {revealed ? <span className="fork-out">{o.outcome}</span> : <span className="fork-redact" aria-label="Outcome sealed"><i /><i style={{ width: "60%" }} /></span>}
            </button>
          );
        })}
      </div>
      <div className="fork-check-foot">
        <span>{n}/{f.options.length} done</span>
        {pick === undefined
          ? <button className="fork-go" disabled={state !== "now"} onClick={() => onPick(draft)}>Pick her up →</button>
          : <button className="fork-rewind !static" onClick={onRewind}>↺ Clear from here</button>}
      </div>
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
