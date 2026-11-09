"use client";
import { BRACKETS, bracketFor } from "@/lib/tiers";

const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

/** The pyramid.
 *
 *  Ten brackets stacked the way a pyramid stands: a broad base of small pools
 *  everybody starts on, narrowing course by course to the $3,000 capstone.
 *  The top of the pyramid is the top prize, which is the whole metaphor.
 *
 *  Gold is laid from the base upward, one course per bracket the site has
 *  reached, and the course it's currently laying glints. Everything above is
 *  bare stone waiting. You can see the level, and how far there is to climb.
 *
 *  Courses step in evenly so the silhouette is a true pyramid; the pool
 *  figures carry the real proportions.
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
        <span className="tank-cap-k">THE CAPSTONE</span>
        <span className="tank-cap-v">{usd(top)} a week</span>
      </p>

      <ol className="tank-steps">
        {steps.map((b) => {
          const i = BRACKETS.indexOf(b);
          const filled = i <= liveIdx;
          const surface = i === liveIdx;
          const next = i === liveIdx + 1;
          const toGo = next && b.upTo !== Infinity ? BRACKETS[i - 1].upTo - payers + 1 : 0;
          const width = 100 - (i / (BRACKETS.length - 1)) * 50;   // base 100%, capstone 50%
          const apex = i === BRACKETS.length - 1;

          return (
            <li key={b.label}
                className={`tank-step ${filled ? "is-filled" : ""} ${surface ? "is-surface" : ""} ${next ? "is-next" : ""} ${apex ? "is-apex" : ""}`}
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
        Gold rises a course for every bracket the site reaches. A round&apos;s pool locks when it opens.
      </p>
    </div>
  );
}
