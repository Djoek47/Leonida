"use client";
import { sb } from "./supabase";

export type Contest = {
  id: string; title: string; pool_cents: number; split: number[];
  submissions_close: string; voting_opens: string; voting_closes: string;
  youtube_url: string | null; status: string;
};
export type Clip = {
  id: string; contest_id: string | null; owner_id: string | null; title: string;
  platform: "ps5" | "xbox" | "pc"; gamertag: string; storage_path: string | null;
  source_url: string | null; edited_url: string | null; youtube_timestamp: number | null;
  status: string; votes: number | null; created_at: string; thumb?: string;
  duration_seconds?: number | null; for_contest?: boolean;
};
export type Winning = { id: string; contest_id: string; clip_id: string; place: number; amount_cents: number; status: string };

const day = 864e5, now = Date.now();
export const DEMO_CONTEST: Contest = {
  id: "demo-w1", title: "Week 1: Vice City getaways", pool_cents: 10000, split: [0.5, 0.3, 0.2],
  submissions_close: new Date(now - day).toISOString(), voting_opens: new Date(now - day).toISOString(),
  voting_closes: new Date(now + 3 * day).toISOString(), youtube_url: null, status: "voting",
};
const demo: [string, string, Clip["platform"], string, number][] = [
  ["Bridge jump into the Keys, cops still on the ramp", "KeysKingpin", "ps5", "places/leonida_keys_2", 412],
  ["Airboat chase through Grassrivers at night", "SwampSaint", "xbox", "places/grassrivers_3", 377],
  ["One-take bank exit, zero stars by the beach", "LuciaMain", "ps5", "people/jason_and_lucia_4", 301],
  ["Cheetah drift down Ocean Drive", "NeonDrifter", "xbox", "ultimate/grotti_cheetah_02", 254],
  ["Motel standoff, perfect timing", "PortGellhornPete", "ps5", "people/jason_and_lucia_7", 198],
  ["Mount Kalaga dirt-road escape", "KalagaGhost", "xbox", "places/mount_kalaga_national_park_4", 143],
  ["Squalo stunt off the marina", "MarinaMenace", "ps5", "ultimate/squalo_03", 120],
  ["Ambrosia refinery rooftop chase", "SugarRush305", "xbox", "places/ambrosia_2", 87],
];
export const DEMO_CLIPS: Clip[] = demo.map(([title, gamertag, platform, thumb, votes], i) => ({
  id: `demo-${i}`, contest_id: "demo-w1", owner_id: i === 3 ? "demo" : null, title, platform, gamertag,
  storage_path: null, source_url: null, edited_url: null, youtube_timestamp: i * 38, status: "approved",
  votes, created_at: new Date(now - (i + 2) * day).toISOString(), thumb: `/media/${thumb}.webp`,
}));

export async function currentContest(): Promise<Contest> {
  const c = sb();
  if (!c) return DEMO_CONTEST;
  const { data } = await c.from("contests").select("*").in("status", ["voting", "review", "submissions"])
    .order("voting_closes", { ascending: false }).limit(1).maybeSingle();
  return (data as Contest) ?? { ...DEMO_CONTEST, id: "none", title: "Season 1 opens at launch", status: "submissions" };
}

export async function contestClips(contestId: string): Promise<Clip[]> {
  const c = sb();
  if (!c) return DEMO_CLIPS;
  const { data } = await c.from("clip_scores").select("*").eq("contest_id", contestId)
    .in("status", ["approved", "featured"]).order("votes", { ascending: false });
  return (data as Clip[]) ?? [];
}

/** Clip ids this account has voted for in the round. Paying members hold several. */
export async function myVotes(contestId: string): Promise<string[]> {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from("votes").select("clip_id").eq("contest_id", contestId);
  return (data ?? []).map((v: { clip_id: string }) => v.clip_id);
}

export async function castVote(clipId: string): Promise<string | null> {
  const c = sb();
  if (!c) return null;
  const { error } = await c.rpc("cast_vote", { p_clip: clipId });
  return error?.message ?? null;
}

export const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export const platformName = { ps5: "PS5", xbox: "Xbox Series X|S", pc: "PC" } as const;

/** Seconds → YouTube deep link to that clip inside the compilation. */
export function ytAt(url: string | null, t: number | null) {
  if (!url || t == null) return null;
  return `${url}${url.includes("?") ? "&" : "?"}t=${t}s`;
}

export async function clearVote(clipId: string): Promise<string | null> {
  const c = sb(); if (!c) return null;
  const { error } = await c.rpc("clear_vote", { p_clip: clipId });
  return error?.message ?? null;
}

/** Paying members, and the pools that follow from the count. Public. */
export type Pool = { paying_users: number; weekly_cents: number; monthly_cents: number };
export async function poolNow(): Promise<Pool> {
  const c = sb();
  if (!c) return { paying_users: 0, weekly_cents: 2500, monthly_cents: 10000 };
  const { data } = await c.from("pool_now").select("*").maybeSingle();
  return (data as Pool) ?? { paying_users: 0, weekly_cents: 2500, monthly_cents: 10000 };
}

export type DownloadRow = {
  id: string; clip_id: string; credit_type: "credit" | "paid";
  charged_cents: number; creator_cents: number; created_at: string;
};

/** Spend one monthly credit. Throws NO_CREDITS when the allowance is gone. */
export async function downloadWithCredit(clipId: string): Promise<{ row?: DownloadRow; error?: string }> {
  const c = sb();
  if (!c) return { error: "DEMO" };
  const { data, error } = await c.rpc("download_with_credit", { p_clip: clipId });
  if (error) return { error: error.message.includes("NO_CREDITS") ? "NO_CREDITS" : error.message };
  return { row: data as DownloadRow };
}

/** Money a creator has earned from downloads and not yet been paid. */
export async function myEarnings(): Promise<{ pending_cents: number; downloads: number }> {
  const c = sb();
  if (!c) return { pending_cents: 1890, downloads: 27 };
  const { data } = await c.from("creator_balances").select("pending_cents,downloads").maybeSingle();
  return { pending_cents: data?.pending_cents ?? 0, downloads: data?.downloads ?? 0 };
}

export const exactMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
