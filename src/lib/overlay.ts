"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

export type TopRow = {
  place: number; clip_id: string; title: string; gamertag: string;
  platform: "ps5" | "xbox" | "pc"; votes: number; trending: boolean;
};
export type Round = {
  title: string; pool_cents: number; gold_cents: number;
  paying_users: number; voting_closes: string; status: string;
};

/** The token comes off the URL. OBS has no session, so this stands in for one;
 *  it is checked in the database, not here. */
export function useToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(new URLSearchParams(location.search).get("key")); }, []);
  return token;
}

/** Overlays sit on a stream for hours, so they re-read on a timer rather than
 *  holding a socket open, and they never show a spinner — a half-drawn overlay
 *  on air looks worse than a stale one. */
export function useFeed<T>(
  fn: (c: NonNullable<ReturnType<typeof sb>>) => Promise<T[]>,
  everyMs = 15000,
  demo?: T[],
) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [err, setErr] = useState(false);
  const read = useCallback(async () => {
    const c = sb();
    if (!c) { setRows(demo ?? []); setErr(true); return; }   // preview without a project
    try { setRows(await fn(c)); setErr(false); } catch { setErr(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn]);
  useEffect(() => {
    read();
    const id = setInterval(read, everyMs);
    return () => clearInterval(id);
  }, [read, everyMs]);
  return { rows, err };
}

export const dollars = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 ? 2 : 0 });


/** Stand-ins so an overlay can be positioned in OBS, and reviewed here, before
 *  a round has any clips in it. */
export const DEMO_TOP: TopRow[] = [
  ["KeysKingpin", "Bridge jump into the Keys, cops still on the ramp", 412, true],
  ["SwampSaint", "Airboat chase through Grassrivers at night", 377, false],
  ["LuciaMain", "One-take bank exit, zero stars by the beach", 301, false],
  ["NeonDrifter", "Cheetah drift down Ocean Drive", 254, false],
  ["PortGellhornPete", "Motel standoff, perfect timing", 198, false],
  ["KalagaGhost", "Mount Kalaga dirt-road escape", 143, false],
  ["MarinaMenace", "Squalo stunt off the marina", 120, false],
  ["SugarRush305", "Ambrosia refinery rooftop chase", 87, false],
  ["VicePointVic", "Six-star escape through the storm drain", 64, false],
  ["LeonidaLola", "Hurricane landing on the causeway", 41, false],
].map(([gamertag, title, votes, trending], i) => ({
  place: i + 1, clip_id: `demo-${i}`, title: title as string, gamertag: gamertag as string,
  platform: (i % 2 ? "xbox" : "ps5") as TopRow["platform"],
  votes: votes as number, trending: trending as boolean,
}));

export const DEMO_ROUND: Round[] = [{
  title: "Week 1: Vice City getaways", pool_cents: 2500, gold_cents: 1500,
  paying_users: 0, voting_closes: new Date(Date.now() + 2 * 864e5).toISOString(), status: "voting",
}];
