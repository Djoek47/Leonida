"use client";
import { useCallback, useEffect, useState } from "react";
import { useFeed, useToken, DEMO_TOP, type TopRow } from "@/lib/overlay";

/** The lower third: whose clip is on screen, with the site's mark on it.
 *  OBS → Browser source → 1920 x 1080:
 *    /overlay/nameplate?key=TOKEN&place=1
 *  Drive it from the stream by changing `place` (1-10), or leave it off and
 *  pass &name=SomeTag&title=Bridge+jump to caption anything at all. */
export default function Nameplate() {
  const token = useToken();
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => { setQ(new URLSearchParams(location.search)); }, []);

  const place = Number(q?.get("place") ?? 0);
  const manualName = q?.get("name") ?? null;
  const manualTitle = q?.get("title") ?? null;

  const topFn = useCallback(async (c: NonNullable<ReturnType<typeof import("@/lib/supabase").sb>>) => {
    const { data } = await c.rpc("overlay_top", { p_token: token, p_limit: 10 });
    return (data ?? []) as TopRow[];
  }, [token]);
  const { rows } = useFeed<TopRow>(topFn, 12000, DEMO_TOP);

  const pick = manualName ? null : rows?.find((r) => r.place === place);
  const name = manualName ?? pick?.gamertag;
  const caption = manualTitle ?? pick?.title;

  if (!q) return null;
  if (!name) return null;      // nothing to say: paint nothing, not an empty box

  return (
    <div className="absolute left-[70px] bottom-[80px] ov-enter">
      <div className="ov-card flex items-stretch overflow-hidden">
        <div className="bg-flamingo grid place-items-center px-4">
          <span className="rec" aria-hidden />
        </div>
        <div className="px-6 py-4 pr-10">
          <p className="ov-tag text-[12px] tracking-[0.2em]">CLIP BY</p>
          <p className="display text-[46px] leading-none text-white ov-shadow">{name}</p>
          {caption && <p className="text-white/70 text-[17px] mt-1 max-w-[42ch] truncate">{caption}</p>}
        </div>
        <div className="self-stretch w-[3px] bg-[#c99a3a]/60" />
        <div className="grid place-items-center px-5">
          <p className="display text-[20px] leading-[1.05] text-[#e9d49a] text-center">
            LIVE<br />FROM<br />LEONIDA
          </p>
        </div>
      </div>
    </div>
  );
}
