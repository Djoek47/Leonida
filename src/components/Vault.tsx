"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRACKETS, bracketFor } from "@/lib/tiers";

/** The Vault.
 *
 *  The rack never grows past twenty-four bundles. What grows is the bundle:
 *  $25 a strap at the bottom of the ladder, $250 a strap at the top. The pile
 *  looks much the same at $500 and at $3,000 — the money just quietly gets
 *  denser. That is the joke, and it is also the honest way to draw it, because
 *  a hundred and twenty identical tokens read as wallpaper rather than money.
 */
const COLS = 4, DEPTH = 2, LAYERS = 3;        // 24 straps, stacked three high
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
  const pile = Math.floor(i / LAYERS);
  const layer = i % LAYERS;
  const col = pile % COLS;
  const row = Math.floor(pile / COLS);
  // Deterministic jitter — a real pile is never square, but it mustn't
  // reshuffle itself on every render either.
  const j = ((i * 2654435761) % 1000) / 1000;
  const k = ((i * 40503) % 997) / 997;
  return (
    <div
      className="vault-strap"
      style={{
        // @ts-expect-error custom properties
        "--x": `${(col - (cols - 1) / 2) * 78 + (j - 0.5) * 3}px`,
        "--y": `${(row - (rows - 1) / 2) * 42 + (k - 0.5) * 3}px`,
        "--z": `${layer * 20.5}px`,
        "--spin": `${(j - 0.5) * 3.4}deg`,
        "--dim": 0.14 - layer * 0.045,
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="vs-top"><i /><i /></span>
      <span className="vs-face">
        <b className="vs-oval" />
        <b className="vs-corner" />
        <i className="vs-band" />
      </span>
      <span className="vs-edge" />
    </div>
  );
}

export function Vault({ payers, pool, compact = false }: { payers: number; pool: number; compact?: boolean }) {
  const bracket = bracketFor(payers);
  const strap = strapFor(pool);
  const straps = Math.max(1, Math.min(MAX, Math.round(pool / strap)));

  const idx = BRACKETS.indexOf(bracket);
  const next = BRACKETS[idx + 1];
  const floor = idx === 0 ? 0 : BRACKETS[idx - 1].upTo;
  const toNext = next ? Math.max(0, bracket.upTo - payers + 1) : 0;
  const fill = next ? Math.min(1, Math.max(0.04, (payers - floor) / (bracket.upTo - floor))) : 1;

  // Straps that have just arrived drop in; the rest are already stacked.
  const prev = useRef(straps);
  const fresh = straps > prev.current ? prev.current : 0;
  useEffect(() => { prev.current = straps; }, [straps]);

  const list = useMemo(() => Array.from({ length: straps }, (_, i) => i), [straps]);
  const piles = Math.ceil(straps / LAYERS);
  const cols = Math.min(COLS, piles);
  const rows = Math.ceil(piles / COLS);
  // One strap adrift in a big empty stage looks like a mistake. Zoom in when
  // there is little money and pull back as the pallet fills.
  const zoom = [1.7, 1.7, 1.45, 1.25, 1.1][Math.min(4, piles)] ?? 1;

  return (
    <div className={`vault ${compact ? "vault-sm" : ""}`}>
      <div className="vault-stage" aria-hidden style={{ "--zoom": zoom } as React.CSSProperties}>
        <div className="vault-floor"
          style={{ "--fw": `${cols * 84 + 70}px`, "--fh": `${rows * 48 + 70}px` } as React.CSSProperties} />
        {list.map((i) => <Strap key={i} i={i} cols={cols} rows={rows} delay={i >= fresh ? (i - fresh) * 55 : 0} />)}
      </div>

      <p className="sr-only">
        This week&apos;s prize pool is {money(pool)}: {straps} strap{straps === 1 ? "" : "s"} of {money(strap)}.
        {next && ` ${toNext} more paying members takes it to ${money(next.pool)}.`}
      </p>

      <div className="vault-read led-board" role="group" aria-label="Prize pool">
        <div className="flex items-baseline justify-between gap-3">
          <span className="led-tag text-xs">ON THE RACK</span>
          <span className="led-tag text-xs">{payers.toLocaleString("en-US")} PAYING</span>
        </div>
        <p className="led-text vault-total"><Odometer value={pool} /></p>
        <div className="vault-gauge">
          <span className="vault-gauge-fill" style={{ width: `${fill * 100}%` }} />
          {Array.from({ length: 11 }, (_, i) => <i key={i} style={{ left: `${i * 10}%` }} />)}
        </div>
        <p className="led-tag vault-next flex flex-wrap justify-between gap-x-4">
          <span>{straps} &times; {money(strap)} STRAP{straps === 1 ? "" : "S"}</span>
          <span>{next ? <>+{toNext.toLocaleString("en-US")} MEMBERS &rarr; {money(next.pool)}</> : <>TOP OF THE LADDER</>}</span>
        </p>
      </div>
    </div>
  );
}
