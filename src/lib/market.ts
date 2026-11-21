/** Clip Market: shared types, tags, card themes and the fee preview (mirrors public.market_fee). */
export type MarketTag = "driving" | "funny" | "npc" | "dangerous" | "scary" | "money" | "action" | "shootout" | "chase" | "heist" | "stunt" | "scenic";
export type MarketTheme = "vice_city" | "leonida_keys" | "grassrivers" | "port_gellhorn" | "ambrosia" | "mount_kalaga_national_park";

export const TAGS: { id: MarketTag; label: string; blurb: string }[] = [
  { id: "action", label: "Action", blurb: "Non-stop" },
  { id: "shootout", label: "Shootout", blurb: "Guns out" },
  { id: "chase", label: "Chase", blurb: "Cops on your tail" },
  { id: "heist", label: "Heist", blurb: "The big score" },
  { id: "driving", label: "Driving", blurb: "Behind the wheel" },
  { id: "stunt", label: "Stunt", blurb: "Airtime" },
  { id: "funny", label: "Funny", blurb: "Made us laugh" },
  { id: "npc", label: "NPC", blurb: "Leonida locals" },
  { id: "dangerous", label: "Dangerous", blurb: "Should not have survived" },
  { id: "scary", label: "Scary", blurb: "Gators, storms, nights" },
  { id: "money", label: "Money", blurb: "Cash moves" },
  { id: "scenic", label: "Scenic", blurb: "Leonida looking good" },
];
export const tagLabel = (t: string) => TAGS.find((x) => x.id === t)?.label ?? t;

/** Card colours: the region palette from the Leonida guide. */
export const THEMES: { id: MarketTheme; name: string; tone: string; img: string }[] = [
  { id: "vice_city", name: "Vice City", tone: "#c7248a", img: "places/vice_city_2" },
  { id: "leonida_keys", name: "Leonida Keys", tone: "#047a8a", img: "places/leonida_keys_2" },
  { id: "grassrivers", name: "Grassrivers", tone: "#587c1d", img: "places/grassrivers_2" },
  { id: "port_gellhorn", name: "Port Gellhorn", tone: "#e50622", img: "places/port_gellhorn_2" },
  { id: "ambrosia", name: "Ambrosia", tone: "#be3f2d", img: "places/ambrosia_2" },
  { id: "mount_kalaga_national_park", name: "Mount Kalaga", tone: "#69741b", img: "places/mount_kalaga_national_park_2" },
];
export const themeOf = (t: string) => THEMES.find((x) => x.id === t) ?? THEMES[0];

export const PRICE_MIN = 100, PRICE_MAX = 2000, MAX_BYTES = 5 * 1024 ** 3, SHOTS = 5;
/** Our cut: 20% with a 50¢ floor, never more than the price. The database has the final say. */
export const feeFor = (cents: number, bps = 2000, floor = 50) => Math.min(cents, Math.max(floor, Math.round((cents * bps) / 10000)));

export type Listing = {
  id: string; seller_id: string; title: string; description: string; highlights: string[]; tags: MarketTag[];
  emblem: MarketTag; theme: MarketTheme; price_cents: number; duration_s: number | null; size_bytes: number | null;
  width: number | null; height: number | null; shots: string[]; status: string; review_note: string | null;
  sales_count: number; created_at: string; approved_at: string | null;
};
export const LISTING_COLS = "id, seller_id, title, description, highlights, tags, emblem, theme, price_cents, duration_s, size_bytes, width, height, shots, status, review_note, sales_count, created_at, approved_at";
export type Seller = { id: string; name: string; verified: boolean | null; avatar_path: string | null; sales: number };

export const usd = (c: number) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
export const mmss = (s: number | null) => (s == null ? "—" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);
export const size = (b: number | null) => (b == null ? "—" : b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(1)} GB` : `${Math.round(b / 1024 ** 2)} MB`);
export const quality = (w: number | null, h: number | null) => (!w || !h ? "—" : h >= 2160 ? "4K" : h >= 1440 ? "1440p" : h >= 1080 ? "1080p" : h >= 720 ? "720p" : `${h}p`);
export const shotUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/market-shots/${path}`;
