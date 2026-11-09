"use client";
import { BRACKETS, bracketFor } from "@/lib/tiers";

const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

/** The prize ladder.
 *
 *  This was a five-column table, which is accurate and says nothing. The point
 *  of the ladder is the climb: every rung is drawn at its true share of the
 *  top pool, so the jump from $25 to $3,000 is something you see rather than
 *  something you have to read off ten rows of figures.
 *
 *  Rungs already passed are dimmed; the one above is marked, because that is
 *  the only number anyone can actually do something about.
 */
export function PrizeLadder({ payers }: { payers: number }) {
  const live = bracketFor(payers);
  const liveIdx = BRACKETS.indexOf(live);
  const top = BRACKETS[BRACKETS.length - 1].pool;

  return (
    <ol className="ladder">
      {BRACKETS.map((b, i) => {
        const here = i === liveIdx;
        const next = i === liveIdx + 1;
        const past = i < liveIdx;
        const toGo = next ? b.upTo === Infinity ? 0 : (BRACKETS[i - 1].upTo - payers + 1) : 0;
        return (
          <li key={b.label}
              className={`rung ${here ? "rung-here" : ""} ${next ? "rung-next" : ""} ${past ? "rung-past" : ""}`}>
            <div className="rung-bar" style={{ width: `${Math.max(4, (b.pool / top) * 100)}%` }} aria-hidden />

            <div className="rung-body">
              <div className="min-w-0">
                <p className="rung-members">
                  {b.label}
                  {here && <span className="rung-flag rung-flag-here">We&apos;re here</span>}
                  {next && toGo > 0 && (
                    <span className="rung-flag rung-flag-next">{toGo.toLocaleString()} more to go</span>
                  )}
                </p>
                <p className="rung-pool display">{usd(b.pool)}<span className="rung-week"> a week</span></p>
              </div>

              <dl className="rung-cuts">
                {([["Gold", b.gold, "g"], ["Silver", b.silver, "s"], ["Bronze", b.bronze, "b"]] as const).map(
                  ([k, v, c]) => (
                    <div key={k} className={`cut cut-${c}`}>
                      <dt>{k}</dt>
                      <dd>{usd(v)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
