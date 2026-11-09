"use client";
import { BRACKETS, bracketFor } from "@/lib/tiers";

const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

/** The Vault — the prize ladder as a tank that fills.
 *
 *  Ten brackets stacked widest-at-the-top, so the silhouette is a pyramid
 *  standing on its point: the money gets heavier the higher you climb. Every
 *  step the site has already reached is poured full of gold; the ones above
 *  are empty steel waiting. The surface of the gold sits on the live bracket,
 *  which is the whole point — you can see the level, and you can see how far
 *  the tank still has to go.
 *
 *  Width is the square root of the pool's share of the top pool. Linear made
 *  the first six steps identical slivers; sqrt keeps the pyramid honest and
 *  still leaves room to read the numbers.
 */
export function PrizeLadder({ payers }: { payers: number }) {
  const live = bracketFor(payers);
  const liveIdx = BRACKETS.indexOf(live);
  const top = BRACKETS[BRACKETS.length - 1].pool;
  const steps = [...BRACKETS].reverse();          // biggest at the top

  return (
    <div className="tank" role="img"
         aria-label={`Prize pool ladder. Currently ${live.label} paying members, ${usd(live.pool)} a week.`}>
      <p className="tank-cap">
        <span className="tank-cap-k">TOP OF THE VAULT</span>
        <span className="tank-cap-v">{usd(top)} a week</span>
      </p>

      <ol className="tank-steps">
        {steps.map((b) => {
          const i = BRACKETS.indexOf(b);
          const filled = i <= liveIdx;
          const surface = i === liveIdx;
          const next = i === liveIdx + 1;
          const toGo = next && b.upTo !== Infinity ? BRACKETS[i - 1].upTo - payers + 1 : 0;
          const width = 40 + Math.sqrt(b.pool / top) * 60;

          return (
            <li key={b.label}
                className={`tank-step ${filled ? "is-filled" : ""} ${surface ? "is-surface" : ""} ${next ? "is-next" : ""}`}
                style={{ width: `${width}%` }}>
              <span className="tank-members">{b.label}</span>

              <span className="tank-mid">
                {surface && <span className="tank-flag">We&apos;re here</span>}
                {next && toGo > 0 && <span className="tank-flag tank-flag-next">{toGo.toLocaleString()} to go</span>}
              </span>

              <span className="tank-right">
                <span className="tank-pool display">{usd(b.pool)}</span>
                <span className="tank-cuts">
                  <i className="cut-g" title={`Gold ${usd(b.gold)}`}>{usd(b.gold)}</i>
                  <i className="cut-s" title={`Silver ${usd(b.silver)}`}>{usd(b.silver)}</i>
                  <i className="cut-b" title={`Bronze ${usd(b.bronze)}`}>{usd(b.bronze)}</i>
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="tank-foot">
        Gold / Silver / Bronze on the right. The level rises with the number of paying members —
        and whatever the pool is when a round opens is locked in, so it can&apos;t shrink under you.
      </p>
    </div>
  );
}
