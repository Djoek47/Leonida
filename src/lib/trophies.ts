"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export type Trophy = {
  id: string; category: string; name: string; description: string; threshold: number; privacy: "public" | "private";
  progress: number; earned_at: string | null; seen_at: string | null;
};

/** The eight retention wings, in the order you walk past them. The Podium hall sits at the far end. */
export const WINGS = ["Audience", "Earnings", "Downloads", "Uploads", "Featuring", "Votes received", "Votes given", "Return participation"] as const;
/** Rooms of the museum: 0 is the entrance, 1–8 the wings, 9 the Podium hall. */
export const ROOMS = ["Entrance", ...WINGS, "Podium"] as const;
export const roomOf = (category: string) => (category === "Podium" ? 9 : WINGS.indexOf(category as (typeof WINGS)[number]) + 1);

export const HUE: Record<string, [string, string, string]> = {
  Podium: ["#fff3b0", "#f0b429", "#8a5a00"], Audience: ["#cfe8ff", "#3b8bd9", "#12365f"], Earnings: ["#b7f0cf", "#1f9d63", "#0b4a2d"],
  Downloads: ["#ffd9f0", "#d6409f", "#5c0d3d"], Uploads: ["#ffe2b8", "#e8871e", "#6b3a00"], Featuring: ["#fff6a8", "#e0c200", "#5c5000"],
  "Votes received": ["#e3d1ff", "#8a4fe0", "#2f1363"], "Votes given": ["#d1f5f0", "#14a89a", "#064a43"], "Return participation": ["#ffd1d1", "#d1263a", "#5c0a15"],
};
export const ACTION: Record<string, [string, string]> = {
  Audience: ["Send a clip", "/submit"], Uploads: ["Send a clip", "/submit"], Downloads: ["See your clips", "/dashboard"], Earnings: ["Send a clip", "/submit"],
  Featuring: ["See the plans", "/pricing"], "Votes received": ["Send a clip", "/submit"], "Votes given": ["Vote on this week's clips", "/clips/week"],
  "Return participation": ["Vote on this week's clips", "/clips/week"], Podium: ["Enter this week", "/submit"],
};
export const fmt = (t: Pick<Trophy, "id" | "category">, n: number) =>
  t.category === "Earnings" ? `$${(n / 100).toLocaleString("en-US", n % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {})}` : n.toLocaleString("en-US");
export const pct = (t: Trophy) => (t.earned_at ? 1 : Math.max(0, Math.min(1, t.progress / Math.max(1, t.threshold))));
export const tierOf = (t: Pick<Trophy, "id">) => (t.id.startsWith("podium") ? 0 : Number(t.id.slice(1)) || 1);

/** A short, plain line describing where a trophy stands. */
export const statusLine = (t: Trophy) =>
  t.earned_at
    ? `Unlocked ${new Date(t.earned_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : t.category === "Podium" ? "Not won yet" : `${fmt(t, t.progress)} / ${fmt(t, t.threshold)}`;

/* Dev-only sample so the museum can be previewed without an account (?preview). Never used in production. */
const SAMPLE: Record<string, [string, string]> = {
  Audience: ["V", "First Crowd:100|Neighborhood Buzz:500|Four-Digit Fame:1000|Local Legend:5000|Leonida Spotlight:10000|Citywide Signal:25000|Crowd Magnet:50000|Six-Figure Audience:100000|Statewide Sensation:500000|Million-View Monarch:1000000"],
  Earnings: ["E", "First Dollar:100|Five on the Board:500|Ten-Dollar Talent:1000|Quarter-Century Cash:2500|Fifty Earned:5000|Hundred Club:10000|Creator Payday:25000|Half-Grand Hustle:50000|Four-Figure Creator:100000|Five-Grand Legacy:500000"],
  Downloads: ["D", "First Takeaway:1|Five Worth Keeping:5|Download Decade:10|Saved Around Town:25|Pocket Collection:50|Hundred Keepsakes:100|Clip Collector's Choice:250|Five Hundred Saves:500|Thousand Downloads:1000|Leonida Essential:5000"],
  Uploads: ["U", "First Broadcast:1|Three-Clip Start:3|Five on Film:5|Ten Takes:10|Quarter-Reel Creator:25|Fifty Frames:50|Century Clipper:100|Leonida Archive:250|Five-Hundred Reel:500|Thousand-Clip Legacy:1000"],
  Featuring: ["F", "First Spotlight:1|Double Exposure:2|Triple Spotlight:3|Feature Regular:5|Ten in Lights:10|Spotlight Circuit:15|Featured Fixture:25|Fifty Features:50|Leonida Headliner:75|Spotlight Century:100"],
  "Votes received": ["R", "First Supporter:1|Five Cheers:5|Ten Voices:10|Community Spark:25|Fifty Backers:50|Hundred Cheers:100|Crowd Favorite:250|Five-Hundred Salute:500|Thousand Voices:1000|Leonida Acclaim:5000"],
  "Votes given": ["G", "First Say:1|Three Good Calls:3|Five Picks:5|Ten Selections:10|Talent Scout:25|Community Curator:50|Hundred Decisions:100|Leonida Tastemaker:250|Five-Hundred Picks:500|Thousand-Clip Judge:1000"],
  "Return participation": ["P", "First Week in Leonida:1|Back for More:2|Four-Week Familiar:4|Eight-Week Regular:8|Seasoned Local:12|Twenty-Week Citizen:20|Half-Year Contributor:26|Leonida Mainstay:39|Year of Contributions:52|Two-Year Legacy:104"],
};
function sample(): Trophy[] {
  const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
  const out: Trophy[] = [
    { id: "podium_weekly", category: "Podium", name: "Weekly Prize Winner", description: "Place in a weekly round.", threshold: 1, privacy: "public", progress: 1, earned_at: day(3), seen_at: null },
    { id: "podium_monthly", category: "Podium", name: "Monthly Prize Winner", description: "Place in a monthly round.", threshold: 1, privacy: "public", progress: 0, earned_at: null, seen_at: null },
    { id: "podium_yearly", category: "Podium", name: "Yearly Prize Winner", description: "Place in the yearly round.", threshold: 1, privacy: "public", progress: 0, earned_at: null, seen_at: null },
  ];
  const got: Record<string, number> = { Audience: 3, Earnings: 2, Downloads: 4, Uploads: 5, Featuring: 1, "Votes received": 3, "Votes given": 6, "Return participation": 2 };
  for (const cat of WINGS) {
    const [p, list] = SAMPLE[cat];
    list.split("|").forEach((s, i) => {
      const [name, th] = s.split(":"); const threshold = Number(th); const earned = i < got[cat];
      out.push({ id: `${p}${String(i + 1).padStart(2, "0")}`, category: cat, name, description: `Reach ${threshold.toLocaleString("en-US")} in ${cat.toLowerCase()}.`, threshold,
        privacy: ["Earnings", "Votes received", "Votes given"].includes(cat) ? "private" : "public",
        progress: earned ? threshold : i === got[cat] ? Math.round(threshold * 0.62) : 0, earned_at: earned ? day(40 - i * 4) : null, seen_at: earned && i === got[cat] - 1 && cat === "Uploads" ? null : day(1) });
    });
  }
  return out;
}
const previewing = () => process.env.NODE_ENV !== "production" && typeof location !== "undefined" && location.search.includes("preview");

/** The signed-in member's trophies, with progress. Marks newly unlocked ones as seen a few seconds after they're shown. */
export function useTrophies(): Trophy[] | null {
  const { user, demo, loading } = useUser();
  const [rows, setRows] = useState<Trophy[] | null>(null);
  useEffect(() => {
    if (previewing()) { setRows(sample()); return; }
    if (loading) return;
    if (!user || demo) { setRows([]); return; }
    const c = sb(); if (!c) { setRows([]); return; }
    let t: ReturnType<typeof setTimeout> | undefined;
    c.rpc("my_trophies").then(({ data }) => {
      const r = (data as Trophy[] | null) ?? [];
      setRows(r);
      if (r.some((x) => x.earned_at && !x.seen_at)) t = setTimeout(() => c.rpc("ack_trophies"), 4000);
    });
    return () => clearTimeout(t);
  }, [user, demo, loading]);
  return rows;
}
