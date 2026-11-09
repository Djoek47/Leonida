"use client";
import { useCallback, useEffect, useState } from "react";
import { useFeed, useToken, dollars, DEMO_ROUND, type Round } from "@/lib/overlay";

/** The corner bug: what's in the pot and how long is left.
 *    /overlay/pool?key=TOKEN&side=left */
export default function PoolBug() {
  const token = useToken();
  const [side, setSide] = useState<"left" | "right">("left");
  const [left, setLeft] = useState("");

  useEffect(() => {
    setSide(new URLSearchParams(location.search).get("side") === "right" ? "right" : "left");
  }, []);

  const roundFn = useCallback(async (c: NonNullable<ReturnType<typeof import("@/lib/supabase").sb>>) => {
    const { data } = await c.rpc("overlay_round", { p_token: token });
    return (data ?? []) as Round[];
  }, [token]);
  const { rows } = useFeed<Round>(roundFn, 30000, DEMO_ROUND);
  const r = rows?.[0];

  // Counts down on screen rather than only on each refetch, so the clock
  // doesn't visibly jump every thirty seconds.
  useEffect(() => {
    if (!r?.voting_closes) return;
    const tick = () => {
      const ms = new Date(r.voting_closes).getTime() - Date.now();
      if (ms <= 0) { setLeft("CLOSED"); return; }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      setLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [r?.voting_closes]);

  if (!r) return null;

  return (
    <div className="absolute top-[60px] ov-enter" style={{ [side]: "60px" } as React.CSSProperties}>
      <div className="ov-card px-7 py-5 text-center">
        <p className="ov-tag text-[12px] tracking-[0.25em]">ON THE STACK</p>
        <p className="led-text display text-[56px] leading-none my-1">{dollars(r.pool_cents)}</p>
        <p className="text-white/75 text-[15px] font-bold">
          {r.paying_users.toLocaleString()} members{left ? ` · ${left} left` : ""}
        </p>
      </div>
    </div>
  );
}
