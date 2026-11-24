"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { lockScroll } from "@/lib/scrollLock";
import { CHAPTERS } from "@/lib/missions";
import { MONEY_ROUTE } from "@/lib/missionIntel";
import { CASH_RULES, CHAPTER_ALERTS, ECONOMY_SOURCES, ENGINES, FENCES, KIND_LABEL, SAVINGS, type Engine, type EngineKind } from "@/lib/economy";

/** Leonida Economist v2: the money side of GTA VI as an expanding machine.
 *
 *  Money methods don't belong to a chapter: once one opens it stays open. So the page shows
 *  earning power stacking up chapter by chapter (the skyline), every money engine as a card with
 *  a full dossier, the fastest route for the chapter you're looking at, where to sell, and how to
 *  keep it. Uses the same "which chapter are you on" setting as Mission Briefing. Spoilers: your
 *  chapter and earlier open in full, the next shows two names, the rest stays dark. */

const KEY = "lfl-chapter";
const PEEK = 2;
const LAST = 5;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const HEAT = ["No heat", "Low heat", "Medium heat", "High heat"];
const BANNER: Record<number, string> = { 1: "art/leonida_keys_landscape", 2: "art/port_gellhorn_landscape", 3: "art/vice_city_landscape", 4: "art/jason_and_lucia_beach_landscape", 5: "art/jason_and_lucia_lock_and_load_landscape" };
const ART: Record<EngineKind, string[]> = {
  robbery: ["people/masked_duo_rifles", "places/vice_city_3", "places/port_gellhorn_3"],
  cars: ["places/car_wash_cab", "places/ricardo_tires_gas_night", "places/vice_city_9"],
  heist: ["people/masked_duo_rifles", "places/vice_city_night", "places/palm_tower"],
  story: ["people/jason_duval_1", "people/lucia_caminos_1", "places/rusty_anchor_bar", "people/boobie_ike_1"],
  side: ["places/seaplane_keys_bridge", "places/leonida_keys_4", "people/jason_seaplane"],
  passive: ["people/lucia_jason_home", "people/jason_lucia_balcony"],
};
const artFor = (e: Engine) => { const p = ART[e.kind]; return `/media/${p[ENGINES.indexOf(e) % p.length]}.webp`; };
const FILTERS: { id: "all" | "repeat" | EngineKind; label: string }[] = [
  { id: "all", label: "Everything" }, { id: "repeat", label: "↻ Repeatable" }, { id: "heist", label: "Heists" },
  { id: "robbery", label: "Robberies" }, { id: "cars", label: "Cars" }, { id: "side", label: "Side jobs" }, { id: "story", label: "Story payouts" }, { id: "passive", label: "Savings" },
];

/** Earning power at a chapter: everything opened up to and including it. */
function power(ch: number) {
  const open = ENGINES.filter((e) => e.ch <= ch);
  const fresh = ENGINES.filter((e) => e.ch === ch);
  const top = open.reduce((m, e) => Math.max(m, e.top ?? 0), 0);
  const rep = open.filter((e) => e.repeat);
  const bestRep = rep.reduce<Engine | null>((b, e) => (!b || (e.top ?? 0) > (b.top ?? 0) ? e : b), null);
  return { open, fresh, top, rep, bestRep };
}

function useCount(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(target); from.current = target; return; }
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3);
      setV(a + (target - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const TOUR_KEY = "lfl-eco-tour";
const STEPS = [
  { id: "eco-ch", t: "Pick your chapter", s: "The page follows your story", tip: "Tap the chapter you're on. Only what you can actually do right now shows up, so nothing spoils the story." },
  { id: "eco-make", t: "Make money", s: "Best earners, in order", tip: "This is your to-do list. Number 1 is the best money for the time. Tap any card further down for the full breakdown." },
  { id: "eco-sell", t: "Sell it", s: "Find the right fence", tip: "Loot only turns into cash at a fence. Each one pays best for different goods, so check before you drive across the map." },
  { id: "eco-keep", t: "Keep it", s: "Bank it so you can't lose it", tip: "Deposit at any ATM, then move it into Family Savings. Type your savings to see how far up the BuckMe ladder you are." },
] as const;

export default function Economist() {
  const { user, profile, paying, tier, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 2));
  const [cur, setCur] = useState<number | null>(null);
  const [view, setView] = useState(1);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<Engine | null>(null);
  const [burst, setBurst] = useState(0);
  const [tour, setTour] = useState<number | null>(null);
  useEffect(() => { try { if (!localStorage.getItem(TOUR_KEY)) setTour(0); } catch {} }, []);
  const endTour = () => { setTour(null); try { localStorage.setItem(TOUR_KEY, "1"); } catch {} };
  useEffect(() => { if (tour !== null) document.getElementById(STEPS[tour].id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [tour]);

  useEffect(() => {
    let c = 1;
    try { const v = Number(localStorage.getItem(KEY)); if (Number.isInteger(v) && v >= 0 && v < CHAPTERS.length) c = v; } catch {}
    setCur(c); setView(Math.max(1, Math.min(LAST, c)));
  }, []);
  const setChapter = (c: number) => { setCur(c); setView(Math.max(1, Math.min(LAST, c))); setBurst((b) => b + 1); try { localStorage.setItem(KEY, String(c)); } catch {} };
  const look = (c: number) => { if (c !== view) { setView(c); setBurst((b) => b + 1); } };

  const reach = Math.max(1, cur ?? 1);
  const p = useMemo(() => power(view), [view]);
  const prev = useMemo(() => power(view - 1), [view]);
  const topN = useCount(p.top);
  const openN = useCount(p.open.length, 600);

  const shown = ENGINES.filter((e) => filter === "all" || (filter === "repeat" ? e.repeat : e.kind === filter));
  const visible = shown.filter((e) => e.ch <= view).sort((a, b) => (b.ch === view ? 1 : 0) - (a.ch === view ? 1 : 0) || (b.top ?? 0) - (a.top ?? 0));
  const peek = view < LAST ? shown.filter((e) => e.ch === view + 1) : [];
  const dark = shown.filter((e) => e.ch > view + 1).length;
  const route = MONEY_ROUTE[view];

  if (loading || cur === null) return <div className="ec"><p className="ec-wrap py-16 text-white/70 font-semibold" role="status">Opening the books…</p></div>;

  return (
    <div className="ec">
      <div className="ec-wrap">
        <p className="ec-kick"><Link href="/edge" className="underline underline-offset-4">The Edge</Link> · Hustler and Kingpin</p>
        <h1 className="ec-title">Leonida <span>Economist</span></h1>
        <p className="ec-sub">Tell us your chapter. We show you the fastest money right now, where to sell what you steal, and how to keep it.</p>

        {!allowed ? (
          <section className="ec-gate">
            <span className="ec-gate-ico" aria-hidden>🔒</span>
            <div>
              <p className="font-extrabold text-lg">Leonida Economist comes with Hustler and Kingpin.</p>
              <p className="text-sm text-white/70">{ENGINES.length} money engines with full dossiers, all {FENCES.length} fences, the fastest route for every chapter and the BuckMe savings ladder.</p>
            </div>
            <Link href={user ? "/pricing" : "/login?next=/edge/economist"} className="btn btn-hot">{user ? "See the plans" : "Sign in"}</Link>
          </section>
        ) : (
          <>
            <nav className="ec-steps" aria-label="How the Economist works">
              {STEPS.map((st, i) => (
                <a key={st.id} href={`#${st.id}`} className="ec-stepcard"><span className="ec-n">{i + 1}</span><span><b>{st.t}</b><small>{st.s}</small></span></a>
              ))}
              <button className="ec-tourbtn" onClick={() => setTour(0)}>▶ 30-second tour</button>
            </nav>

            {/* Where you are: shared with Mission Briefing */}
            <div id="eco-ch" className="ec-h ec-anchor"><h2><span className="ec-n">1</span>Which chapter are you on?</h2><p>Everything below changes to match. Same setting as Mission Briefing.</p></div>
            <div className="ec-levels" role="radiogroup" aria-label="Which chapter are you on?">
              {[1, 2, 3, 4, 5].map((c) => {
                const locked = c > reach + 1;
                return (
                  <button key={c} role="radio" aria-checked={reach === c} disabled={locked} onClick={() => setChapter(c)}
                    className={`ec-level${reach === c ? " is-on" : ""}${c < reach ? " is-past" : ""}${locked ? " is-locked" : ""}`}>
                    <span>Chapter {c}</span><b>{locked ? "🔒" : CHAPTERS[c].title}</b>
                  </button>
                );
              })}
            </div>
            <p className="ec-levels-note">You&apos;re on <b>Chapter {reach}</b>. Locked chapters open as you play.</p>

            {/* HUD */}
            <section className="ec-hud" style={{ backgroundImage: `url(/media/${BANNER[view]}.webp)` }} aria-label="Earning power">
              <div className="ec-rain" key={burst} aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.09}s` }}>$</i>)}</div>
              <div className="ec-hud-in">
                <div className="ec-hud-main">
                  <span className="ec-k">Biggest single score open · Chapter {view}</span>
                  <b className="ec-big">{usd(topN)}</b>
                  {view > 1 && prev.top > 0 && <span className="ec-up">▲ {Math.round(p.top / prev.top)}× Chapter {view - 1}</span>}
                </div>
                <div className="ec-hud-stats">
                  <div><span className="ec-k">Money engines open</span><b>{Math.round(openN)}</b>{p.fresh.length > 0 && view > 1 && <small>+{p.fresh.length} new this chapter</small>}</div>
                  <div><span className="ec-k">You can repeat</span><b>{p.rep.length}</b><small>{p.bestRep ? `Best: ${p.bestRep.name}` : ""}</small></div>
                  <div><span className="ec-k">Pocket cash cap</span><b>$20,000</b><small>Bank the rest</small></div>
                </div>
              </div>
            </section>

            {/* Alerts for this chapter */}
            {CHAPTER_ALERTS.filter((a) => a.ch === view).map((a) => (
              <aside key={a.text} className="ec-alert" role="note"><b>Chapter {a.ch} money alert</b><p>{a.text}</p></aside>
            ))}

            {/* Fastest route */}
            {route && (
              <>
              <div id="eco-make" className="ec-h ec-anchor"><h2><span className="ec-n">2</span>Make money</h2><p>Start at the top of this list. Number 1 pays best for the time it takes.</p></div>
              <section className="ec-route" aria-label="Fastest money this chapter">
                <div className="ec-route-head">
                  <span className="ec-k">Fastest money in Chapter {view}</span>
                  <p className="ec-route-h">{route.headline}</p>
                  <p className="ec-route-r">{route.rule}</p>
                </div>
                <ol className="ec-route-list">
                  {route.earners.map((e, i) => (
                    <li key={e.name} className={e.best ? "is-best" : ""}>
                      <span className="ec-rank">{i + 1}</span>
                      <div><b>{e.name}</b><span>{e.how}</span><em>Unlock: {e.unlock}</em></div>
                      <span className="ec-route-pay">{e.pay}{e.per && <small>{e.per}</small>}</span>
                    </li>
                  ))}
                </ol>
              </section>
              </>
            )}

            {/* Engines */}
            <section aria-label="Money engines">
              <div className="ec-h"><h3 className="ec-h3">Every way to earn so far</h3><p>Tap a card for how it works, what it pays and the risk.</p></div>
              <div className="ec-filters" role="tablist">{FILTERS.map((f) => <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? "is-on" : ""} onClick={() => setFilter(f.id)}>{f.label}</button>)}</div>
              <ul className="ec-grid">
                {visible.map((e) => (
                  <li key={e.id}>
                    <button className={`ec-card k-${e.kind}${e.best ? " is-best" : ""}`} onClick={() => setOpen(e)} style={{ backgroundImage: `url(${artFor(e)})` }}>
                      <span className="ec-card-flags">
                        <span className="ec-chip">{KIND_LABEL[e.kind]}</span>
                        {e.repeat && <span className="ec-chip is-rep">↻ Repeat</span>}
                        {e.ch === view && view > 1 && <span className="ec-chip is-new">New</span>}
                      </span>
                      <span className="ec-card-pay">{e.pay}{e.per && <small>{e.per}</small>}</span>
                      <b className="ec-card-name">{e.name}</b>
                      <span className="ec-card-meta"><span className={`ec-heat h${e.heat}`}>{[1, 2, 3].map((k) => <i key={k} className={k <= e.heat ? "on" : ""} />)}</span>{HEAT[e.heat]} · Ch. {e.ch}</span>
                    </button>
                  </li>
                ))}
                {peek.slice(0, PEEK).map((e) => (
                  <li key={e.id}><div className="ec-card is-peek"><span className="ec-chip">Opens in Chapter {e.ch}</span><b className="ec-card-name">{e.name}</b><span className="ec-card-meta">Details unlock when you get there</span></div></li>
                ))}
                {peek.length > PEEK && <li><div className="ec-card is-peek"><b className="ec-card-name">+{peek.length - PEEK} more in Chapter {view + 1}</b></div></li>}
                {dark > 0 && <li><div className="ec-card is-dark"><span className="ec-lock" aria-hidden>🔒</span><b className="ec-card-name">{dark} engine{dark === 1 ? "" : "s"} further down the road</b><span className="ec-card-meta">Kept dark so nothing spoils the story</span></div></li>}
              </ul>
            </section>

            {/* Pipeline: take → fence → bank */}
            <section className="ec-pipe-wrap" aria-label="From loot to money in the bank">
              <div id="eco-sell" className="ec-h ec-anchor"><h2><span className="ec-n">3</span>Sell it</h2><p>Stolen goods aren&apos;t money until a fence buys them. Pick the fence that pays best for what you&apos;re carrying.</p></div>
              <ol className="ec-pipe">
                {[["🎒", "Take", "Store, safe, car, vault"], ["🚗", "Stash", "Bag in the trunk, lose the cops"], ["🤝", "Fence", "Sell to the right buyer"], ["🏧", "Checking", "Deposit at any ATM"], ["🏦", "Family Savings", "Can't be lost or withdrawn"]].map(([ico, t, s], i) => (
                  <li key={t} style={{ animationDelay: `${i * 0.12}s` }}><span className="ec-pipe-ico" aria-hidden>{ico}</span><b>{t}</b><small>{s}</small></li>
                ))}
              </ol>
              <ul className="ec-fences">
                {FENCES.map((f) => f.ch <= view ? (
                  <li key={f.name} className={/Best/.test(f.rate) ? "is-best" : ""}>
                    <div className="ec-fence-top"><b>{f.name}</b><span>{f.area}</span></div>
                    <p className="ec-fence-buys">{f.buys}</p>
                    <span className="ec-fence-rate">{f.rate}</span>
                    <small>Opens after {f.unlock} (Ch. {f.ch})</small>
                  </li>
                ) : (
                  <li key={f.name} className="is-locked"><b>🔒 Fence</b><small>Opens in Chapter {f.ch}</small></li>
                ))}
              </ul>
            </section>

            <div id="eco-keep" className="ec-h ec-anchor"><h2><span className="ec-n">4</span>Keep it</h2><p>Cash in your pocket can be lost. Bank it, then move it to Family Savings where nobody can touch it.</p></div>
            <PocketBank />
            <Ladder />

            <section className="ec-rules" aria-label="Cash rules">
              <div className="ec-h"><h3 className="ec-h3">Cash rules to remember</h3></div>
              <ul>{CASH_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>

            {/* Skyline: earning power stacks chapter on chapter */}
            <section className="ec-sky-wrap" aria-label="How earning power grows">
              <div className="ec-h"><h2><span className="ec-n is-x">+</span>How your money grows</h2><p>One tower per chapter. Taller means bigger scores. Nothing ever closes, so it only grows. Tap a tower to look ahead.</p></div>
              <div className="ec-sky">
                {[1, 2, 3, 4, 5].map((c) => {
                  const pc = power(c), hidden = c > reach;
                  const h = hidden ? 26 : 16 + (Math.log10(Math.max(pc.top, 1000)) - 3) / (Math.log10(260000) - 3) * 84;
                  return (
                    <button key={c} className={`ec-tower${view === c ? " is-on" : ""}${hidden ? " is-dark" : ""}`} onClick={() => !hidden && look(c)} disabled={hidden} aria-label={hidden ? `Chapter ${c}, locked` : `Chapter ${c}: ${usd(pc.top)}, ${pc.open.length} engines`}>
                      <span className="ec-tower-top">{hidden ? "?" : usd(pc.top)}</span>
                      <span className="ec-tower-body" style={{ height: `${h}%` }}>
                        {!hidden && pc.open.map((e) => <i key={e.id} className={`k-${e.kind}${e.ch === c && c > 1 ? " is-new" : ""}`} title={e.name} />)}
                      </span>
                      <span className="ec-tower-ch">Ch. {c}</span>
                      <span className="ec-tower-n">{hidden ? "Keep playing" : `${pc.open.length} engines${pc.fresh.length && c > 1 ? ` · +${pc.fresh.length}` : ""}`}</span>
                    </button>
                  );
                })}
              </div>
              <div className="ec-legend">{(Object.keys(KIND_LABEL) as EngineKind[]).map((k) => <span key={k}><i className={`k-${k}`} />{KIND_LABEL[k]}</span>)}</div>
            </section>

            <p className="ec-src">
              Compiled from community guides and rewritten by our team:{" "}
              {ECONOMY_SOURCES.map((s, i) => <span key={s.href}>{i ? ", " : ""}<a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}, plus the PowerPyx and Dork walkthroughs. Payouts are what guides report; the in-game map shows the estimate for each target.
            </p>
          </>
        )}
      </div>
      {open && <Dossier e={open} onClose={() => setOpen(null)} />}
      {tour !== null && allowed && (
        <div className="ec-tour" role="dialog" aria-label="Economist tour">
          <p className="ec-k">Step {tour + 1} of {STEPS.length}</p>
          <p className="ec-tour-h">{STEPS[tour].t}</p>
          <p className="ec-tour-p">{STEPS[tour].tip}</p>
          <div className="ec-tour-dots" aria-hidden>{STEPS.map((_, i) => <i key={i} className={i === tour ? "on" : ""} />)}</div>
          <div className="ec-tour-btns">
            <button onClick={endTour} className="ec-tour-skip">Skip</button>
            {tour < STEPS.length - 1 ? <button className="btn btn-hot" onClick={() => setTour(tour + 1)}>Next →</button> : <button className="btn btn-hot" onClick={endTour}>Got it</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Dossier({ e, onClose }: { e: Engine; onClose: () => void }) {
  useEffect(() => {
    const undo = lockScroll();
    const k = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); undo(); };
  }, [onClose]);
  const pay = useCount(e.top ?? 0, 800);
  return (
    <div className="ec-modal" role="dialog" aria-modal="true" aria-label={e.name} onClick={onClose}>
      <div className="ec-dossier" onClick={(ev) => ev.stopPropagation()}>
        <div className="ec-d-hero" style={{ backgroundImage: `url(${artFor(e)})` }}>
          <button className="ec-d-x" onClick={onClose} aria-label="Close">✕</button>
          <div className="ec-d-hero-in">
            <span className="ec-card-flags"><span className="ec-chip">{KIND_LABEL[e.kind]}</span>{e.repeat && <span className="ec-chip is-rep">↻ Repeatable</span>}{e.best && <span className="ec-chip is-new">Top earner</span>}</span>
            <h3>{e.name}</h3>
            <p>Opens in Chapter {e.ch} · {e.unlock}{e.who ? ` · ${e.who === "Both" ? "Jason or Lucia" : e.who}` : ""}</p>
          </div>
        </div>
        <div className="ec-d-body">
          <div className="ec-d-stats">
            <div className="ec-d-pay"><span className="ec-k">Pays</span><b>{e.top ? usd(pay) : e.pay}</b><small>{e.top ? e.pay : ""}{e.per ? ` · ${e.per}` : ""}</small></div>
            <div><span className="ec-k">Heat</span><span className={`ec-heat big h${e.heat}`}>{[1, 2, 3].map((k) => <i key={k} className={k <= e.heat ? "on" : ""} />)}</span><small>{HEAT[e.heat]}</small></div>
            <div><span className="ec-k">Runs</span><b className="text-lg">{e.repeat ? "Again and again" : "Once"}</b></div>
          </div>
          <h4>How to run it</h4>
          <ol className="ec-d-steps">{e.steps.map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}</ol>
          {e.sell && <div className="ec-d-sell"><span className="ec-k">Sell to</span><p>{e.sell}</p></div>}
          {e.tips.length > 0 && <><h4>Tips</h4><ul className="ec-d-tips">{e.tips.map((t) => <li key={t}>{t}</li>)}</ul></>}
        </div>
      </div>
    </div>
  );
}

/** BuckMe ladder: type what's saved, see your goal, your checking limit and the next rung. */
function Ladder() {
  const [saved, setSaved] = useState("");
  const amount = Number(saved.replace(/[^0-9.]/g, "")) || 0;
  const num = (s: string) => Number(s.replace(/[^0-9]/g, ""));
  const at = SAVINGS.reduce((i, g, k) => (amount >= num(g.saved) ? k : i), -1);
  const next = SAVINGS[at + 1];
  return (
    <section className="ec-ladder-wrap" aria-label="BuckMe savings ladder">
      <div className="ec-h"><h2>Climb the BuckMe ladder</h2><p>Every savings goal raises your checking limit. Hit the limit and new pay waits until you spend or save. Type what&apos;s in Family Savings.</p></div>
      <div className="ec-ladder-in">
        <label className="ec-saved">
          <span className="ec-k">Family Savings</span>
          <span className="ec-saved-box"><i>$</i><input inputMode="numeric" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" aria-label="Amount in Family Savings" /></span>
          <small>{next ? `${usd(Math.max(0, num(next.saved) - amount))} to ${next.goal}` : "Top of the ladder"}</small>
        </label>
        <ol className="ec-ladder">
          {[...SAVINGS].reverse().map((g) => {
            const k = SAVINGS.indexOf(g), on = k <= at, here = k === at;
            return (
              <li key={g.goal} className={`${on ? "is-on" : ""}${here ? " is-here" : ""}`}>
                <span className="ec-rung">{here ? "You" : on ? "✓" : ""}</span>
                <div><b>{g.goal}</b><small>Save {g.saved} · checking limit {g.limit}</small></div>
                <em>{g.perk === "None" ? "" : g.perk}</em>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** Pocket vs bank, from the Economist promo: bank your cash, then see what getting busted costs. */
function PocketBank() {
  const [pocket, setPocket] = useState(18400);
  const [bank, setBank] = useState(6200);
  const [busted, setBusted] = useState(false);
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  return (
    <div className="ec-pb" aria-label="Pocket cash versus bank, a quick demo">
      <div className={`ec-pb-acct is-pocket${busted ? " is-busted" : ""}`}>
        <span className="ec-pb-k">👖 Pocket cash · can be lost</span><b>{fmt(pocket)}</b>
        {busted && <span className="ec-pb-stamp">Busted</span>}
      </div>
      <div className="ec-pb-acct is-bank"><span className="ec-pb-k">🏦 BuckMe bank · safe</span><b>{fmt(bank)}</b></div>
      <div className="ec-pb-btns">
        <button className="btn btn-hot" disabled={!pocket} onClick={() => { setBank(bank + pocket); setPocket(0); setBusted(false); }}>Bank it at an ATM</button>
        <button className="ec-pb-bust" onClick={() => { setBusted(true); setPocket(0); }}>Get busted</button>
        <button className="ec-pb-reset" onClick={() => { setPocket(18400); setBank(6200); setBusted(false); }}>↺ Reset</button>
      </div>
      <p className="ec-pb-note">{busted ? (bank > 6200 ? "Busted, but you'd banked it: nothing lost except a small BuckMe fee." : "Busted with cash in your pocket: all of it is gone.") : "Try it: get busted first, then reset and bank it first."}</p>
    </div>
  );
}
