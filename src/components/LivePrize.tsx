"use client";
import { useEffect, useState } from "react";
import { poolNow } from "@/lib/api";
import { bracketFor } from "@/lib/tiers";

/** This week's prize, from the live paying-member count (same ladder as the Earn page). */
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
function useLive() {
  const [payers, setPayers] = useState<number | null>(null);
  useEffect(() => { poolNow().then((p) => setPayers(p.paying_users)); }, []);
  return payers == null ? null : bracketFor(payers);
}

export function LivePrizeAmount() {
  const b = useLive();
  return <span className="sunset-text">{b ? usd(b.pool) : " "}</span>;
}

export function LivePrizePodium() {
  const b = useLive() ?? bracketFor(0);
  const rows: [string, number, string][] = [["2nd", b.silver, "60%"], ["1st", b.gold, "100%"], ["3rd", b.bronze, "42%"]];
  return (
    <div className="flex items-end gap-3 h-56" aria-label={`Prize split: first ${usd(b.gold)}, second ${usd(b.silver)}, third ${usd(b.bronze)}`}>
      {rows.map(([p, v, h]) => (
        <div key={p} className="flex-1 flex flex-col justify-end h-full">
          <span className="display text-4xl md:text-5xl mb-2">{usd(v)}</span>
          <div className={`${p === "1st" ? "bg-gulf text-white" : "bg-ink-2"} rounded-t-lg p-3 font-bold`} style={{ height: h }}>{p}</div>
        </div>
      ))}
    </div>
  );
}
