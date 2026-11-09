"use client";
import { useCallback } from "react";
import { useFeed, useToken, dollars, DEMO_TOP, DEMO_ROUND, type TopRow, type Round } from "@/lib/overlay";

/** Top 10 standings for the stream.
 *  OBS → Sources → Browser → 1920 x 1080, URL:
 *    https://livefromleonida.com/overlay/top10?key=YOUR_TOKEN
 *  Optional: &side=left  &count=5  &title=0 */
export default function Top10() {
  const token = useToken();
  const q = typeof window !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
  const side = q.get("side") === "left" ? "left" : "right";
  const count = Math.max(3, Math.min(10, Number(q.get("count")) || 10));
  const showTitle = q.get("title") !== "0";

  const topFn = useCallback(async (c: NonNullable<ReturnType<typeof import("@/lib/supabase").sb>>) => {
    const { data } = await c.rpc("overlay_top", { p_token: token, p_limit: count });
    return (data ?? []) as TopRow[];
  }, [token, count]);
  const roundFn = useCallback(async (c: NonNullable<ReturnType<typeof import("@/lib/supabase").sb>>) => {
    const { data } = await c.rpc("overlay_round", { p_token: token });
    return (data ?? []) as Round[];
  }, [token]);

  const { rows } = useFeed<TopRow>(topFn, 12000, DEMO_TOP.slice(0, count));
  const { rows: round } = useFeed<Round>(roundFn, 60000, DEMO_ROUND);
  const r = round?.[0];

  if (!token) return <Setup />;
  if (!rows) return null;                 // never flash a spinner on air

  return (
    <div className="absolute top-[60px] w-[560px] max-h-[calc(100%-120px)]"
         style={{ [side]: "60px" } as React.CSSProperties}>
      <div className="ov-card p-6 flex flex-col">
        {showTitle && (
          <header className="pb-4 mb-4 border-b-2 border-[#c99a3a]/50">
            <p className="ov-tag text-[13px] tracking-widest">LIVE FROM LEONIDA</p>
            <h1 className="display text-[38px] leading-none text-white ov-shadow mt-1">
              {r?.title ?? "This week's clips"}
            </h1>
            {r && (
              <p className="led-text text-[15px] mt-2">
                {dollars(r.pool_cents)} POOL · {dollars(r.gold_cents)} TO WIN
              </p>
            )}
          </header>
        )}

        <ol className="flex flex-col gap-2.5 overflow-hidden">
          {rows.length === 0 && (
            <li className="text-white/70 text-[18px]">Nothing in the round yet.</li>
          )}
          {rows.map((c, i) => (
            <li key={c.clip_id} className="ov-row ov-enter flex items-center gap-4"
                style={{ animationDelay: `${i * 55}ms` }}>
              <span className={`ov-place ${c.place <= 3 ? `ov-place-${c.place}` : ""}`}>{c.place}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-white font-extrabold text-[20px] leading-tight truncate ov-shadow">
                  {c.gamertag}
                </span>
                <span className="block text-white/65 text-[15px] leading-tight truncate">{c.title}</span>
              </span>
              {c.trending && (
                <span className="rounded-full bg-flamingo px-2 py-0.5 text-[11px] font-black text-white">HOT</span>
              )}
              <span className="led-text text-[26px] leading-none tabular-nums">{c.votes}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Shown only when the URL has no key — so a mis-set source says so on screen
 *  instead of going silently blank mid-stream. */
function Setup() {
  return (
    <div className="absolute inset-0 grid place-items-center p-10">
      <div className="ov-card p-8 max-w-lg text-white">
        <h1 className="display text-4xl">Overlay needs its key</h1>
        <p className="mt-3 text-white/80">
          Add <code className="text-mango">?key=…</code> to the browser-source URL. The key is in the
          admin console under Staff and settings.
        </p>
      </div>
    </div>
  );
}
