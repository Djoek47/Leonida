"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRACKETS, bracketFor } from "@/lib/tiers";

/** The Vault.
 *
 *  Money stacks up, it does not spread out. Straps land on a 2x2 footprint and
 *  the tower rises a layer at a time, so the pile gets taller as the pool
 *  grows rather than creeping across the floor.
 *
 *  It never passes twenty-four straps. What grows instead is the strap: $25 at
 *  the bottom of the ladder, $250 at the top. The stack looks much the same at
 *  $500 and at $3,000 — the money just quietly gets denser. That is the joke,
 *  and it is also the honest way to draw it, because a hundred identical
 *  tokens read as wallpaper rather than as money.
 */
const COLS = 2, DEPTH = 2, LAYERS = 6;        // a 2x2 tower, six straps high
const MAX = COLS * DEPTH * LAYERS;

/** Denomination ladder. Chosen so the count always lands between 1 and 20. */
export function strapFor(pool: number): number {
  if (pool <= 600) return 25;
  if (pool <= 2000) return 100;
  return 250;
}

const money = (n: number) => "$" + n.toLocaleString("en-US");

/** Rolling odometer, so the number counts up instead of snapping. */
function Odometer({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    const start = performance.now(), a = from.current, b = value, ms = 900;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setShown(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{money(shown)}</span>;
}

function Strap({ i, delay, cols, rows }: { i: number; delay: number; cols: number; rows: number }) {
  // Layer by layer, so the stack visibly gains height with every new strap
  // instead of finishing one tower before starting the next.
  const perLayer = COLS * DEPTH;
  const layer = Math.floor(i / perLayer);
  const slot = i % perLayer;
  const col = slot % COLS;
  const row = Math.floor(slot / COLS);
  // Deterministic jitter — a real pile is never square, but it mustn't
  // reshuffle itself on every render either.
  const j = ((i * 2654435761) % 1000) / 1000;
  const k = ((i * 40503) % 997) / 997;
  return (
    <div
      className="vault-strap"
      style={{
        // @ts-expect-error custom properties
        "--x": `${(col - (cols - 1) / 2) * 79 + (j - 0.5) * 3.4}px`,
        "--y": `${(row - (rows - 1) / 2) * 36 + (k - 0.5) * 3.4}px`,
        "--z": `${layer * 11.6}px`,
        "--spin": `${(j - 0.5) * 5}deg`,
        "--dim": 0.17 - layer * 0.026,
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="vs-top"><i /><i /></span>
      <span className="vs-face"><i className="vs-band" /></span>
      <span className="vs-edge" />
    </div>
  );
}

/** Where a payer count sits on the whole ladder, 0 → 1, continuous inside each
 *  rung. Every visual (straps, gauge, percentage) reads from this one number,
 *  so nothing can jump ahead of anything else. */
function ladderPos(payers: number): number {
  const n = BRACKETS.length;
  const b = bracketFor(payers), i = BRACKETS.indexOf(b);
  if (i === n - 1) return 1;
  const floor = i === 0 ? 0 : BRACKETS[i - 1].upTo;
  const within = Math.min(1, Math.max(0, (payers - floor) / (b.upTo - floor)));
  return (i + within) / (n - 1);
}
/** The payer count at a ladder position (inverse of ladderPos). */
function payersAt(pos: number): number {
  const n = BRACKETS.length, x = Math.min(1, Math.max(0, pos)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x)), f = x - i;
  const floor = i === 0 ? 0 : BRACKETS[i - 1].upTo;
  return pos >= 1 ? BRACKETS[n - 2].upTo + 1 : Math.round(floor + f * (BRACKETS[i].upTo - floor));
}
const ease = (k: number) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function Vault({ payers, pool, compact = false, cycle = false, aim = null }:
  { payers: number; pool: number; compact?: boolean; cycle?: boolean; aim?: number | null }) {
  // Cycling sweeps smoothly from the live figure up the whole ladder, holds at
  // the top, then the stack clears and settles back on the live figure.
  const live = ladderPos(payers);
  const [pos, setPos] = useState(live);
  const [phase, setPhase] = useState<"live" | "rise" | "top" | "clear">("live");
  const [held, setHold] = useState(false);
  const posRef = useRef(live);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { if (phase === "live") setPos(live); }, [live, phase]);

  useEffect(() => {
    if (!cycle || held) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, t0 = 0, dead = false;
    const RISE = 9000, TOP = 2600, CLEAR = 700, REST = 3200;
    const run = () => {
      setPhase("live"); setPos(live);
      const wait = setTimeout(() => {
        if (dead) return;
        setPhase("rise"); t0 = performance.now();
        const step = (t: number) => {
          if (dead) return;
          const k = Math.min(1, (t - t0) / RISE);
          setPos(live + (1 - live) * ease(k));
          if (k < 1) { raf = requestAnimationFrame(step); return; }
          setPhase("top");
          setTimeout(() => { if (dead) return; setPhase("clear");
            setTimeout(() => { if (!dead) run(); }, CLEAR); }, TOP);
        };
        raf = requestAnimationFrame(step);
      }, REST);
      return wait;
    };
    const w = run();
    return () => { dead = true; cancelAnimationFrame(raf); clearTimeout(w); setPhase("live"); };
  }, [cycle, held, live]);

  // Pointing at a rung of the pyramid: the stack glides to that rung and back.
  useEffect(() => {
    if (cycle) return;
    const target = aim == null ? live : (aim >= BRACKETS.length - 1 ? 1 : ladderPos((aim === 0 ? 0 : BRACKETS[aim - 1].upTo) + 1));
    let raf = 0; const t0 = performance.now(); const from = posRef.current;
    setPhase(aim == null ? "live" : "rise");
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setPos(from + (target - from) * ease(k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [aim, cycle, live]);

  const previewing = phase !== "live" && Math.abs(pos - live) > 0.001;
  const shownPayers = previewing ? payersAt(pos) : payers;
  const shownPool = previewing ? bracketFor(shownPayers).pool : pool;

  return <VaultBody payers={shownPayers} pool={shownPool} pos={pos} compact={compact}
    previewing={previewing} clearing={phase === "clear"} onHold={setHold} />;
}

function VaultBody({ payers, pool, pos, compact, previewing, clearing, onHold }:
  { payers: number; pool: number; pos: number; compact: boolean; previewing: boolean; clearing: boolean;
    onHold: (v: boolean) => void }) {
  const bracket = bracketFor(payers);
  // One strap per 1/24th of the ladder: they arrive one at a time, never in clumps.
  const straps = Math.max(1, Math.min(MAX, Math.ceil(MAX * Math.max(0.001, pos))));

  const idx = BRACKETS.indexOf(bracket);
  const next = BRACKETS[idx + 1];
  const toNext = next ? Math.max(0, bracket.upTo - payers + 1) : 0;
  const fill = Math.max(0.02, pos);

  // Straps that have just arrived drop in; the rest are already stacked.
  const prev = useRef(straps);
  const fresh = straps > prev.current ? prev.current : straps;
  useEffect(() => { prev.current = straps; }, [straps]);

  const list = useMemo(() => Array.from({ length: straps }, (_, i) => i), [straps]);
  const cols = Math.min(COLS, straps);
  const rows = Math.min(DEPTH, Math.ceil(straps / COLS));
  const layers = Math.ceil(straps / (COLS * DEPTH));
  const zoom = [2, 2, 1.8, 1.6, 1.45, 1.3, 1.2][Math.min(6, layers)] ?? 1;

  return (
    <div className={`vault ${compact ? "vault-sm" : ""}${clearing ? " vault-clearing" : ""}${pos >= 1 ? " vault-full" : ""}`}
         onMouseEnter={() => onHold(true)} onMouseLeave={() => onHold(false)}
         onFocusCapture={() => onHold(true)} onBlurCapture={() => onHold(false)}>
      <div className="vault-frame"><div className="vault-stage" aria-hidden style={{ "--zoom": zoom } as React.CSSProperties}>
        <div className="vault-floor"
          style={{ "--fw": `${cols * 84 + 76}px`, "--fh": `${rows * 48 + 76}px` } as React.CSSProperties} />
        {list.map((i) => <Strap key={i} i={i} cols={cols} rows={rows} delay={i >= fresh ? (i - fresh) * 90 : 0} />)}
        <div className="vault-shine" />
      </div></div>

      <p className="sr-only">
        This week&apos;s prize pool is {money(pool)}.
        {next && ` ${toNext} more paying members takes it to ${money(next.pool)}.`}
      </p>

      <div className="vault-read led-board" role="group" aria-label="Prize pool">
        <div className="flex items-baseline justify-between gap-3">
          <span className="led-tag text-xs">{previewing ? "IF WE REACH" : "ON THE STACK"}</span>
          <span key={payers > 0 ? "p" : "z"} className="led-tag vault-paying tabular-nums"><b>{payers.toLocaleString("en-US")}</b> PAYING</span>
        </div>
        <p className="led-text vault-total"><Odometer value={pool} /></p>
        <div className="vault-gauge">
          <span className="vault-gauge-fill" style={{ transform: `scaleX(${fill})` }} />
          {Array.from({ length: 11 }, (_, i) => <i key={i} style={{ left: `${i * 10}%` }} />)}
        </div>
        <p className="led-tag vault-next flex flex-wrap justify-between gap-x-4">
          <span className="tabular-nums">{Math.floor(pos * 100)}% TO THE TOP PRIZE</span>
          <span>{next ? <>+{toNext.toLocaleString("en-US")} MEMBERS &rarr; {money(next.pool)}</> : <>TOP OF THE LADDER</>}</span>
        </p>
      </div>
    </div>
  );
}
