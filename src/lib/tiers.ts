/** Tier table, mirrored from public.tiers so the UI can render without a round trip.
 *  The database is the source of truth for anything that moves money. */

export type TierId = "street" | "hustler" | "kingpin" | "cartel";

export type Tier = {
  id: TierId;
  label: string;
  rank: number;
  monthlyCents: number;
  annualCents: number;
  creditsPerMonth: number;
  voteWeight: number;
  extraVotes: number;
  dailySubmissions: number;
  adFree: boolean;
  pitch: string;
  perks: string[];
};

export const TIERS: Tier[] = [
  {
    id: "street", label: "Street", rank: 0,
    monthlyCents: 0, annualCents: 0, creditsPerMonth: 0,
    voteWeight: 1, extraVotes: 0, dailySubmissions: 2, adFree: false,
    pitch: "Upload, compete and win. No card needed.",
    perks: [
      "Send 2 clips a day",
      "Eligible for Clip of the Week and Clip of the Month",
      "One vote a round",
      "Stream every clip",
      "The Lobby, Clip talk and Versus chat",
    ],
  },
  {
    id: "hustler", label: "Hustler", rank: 1,
    monthlyCents: 800, annualCents: 7500, creditsPerMonth: 3,
    voteWeight: 3, extraVotes: 3, dailySubmissions: 10, adFree: true,
    pitch: "For the regular. More shots on goal, a real say in who wins.",
    perks: [
      "10 clips a day",
      "4 votes a round, each worth 3",
      "See every vote total and the live ranking",
      "3 clip downloads a month",
      "No ads",
      "Members chat",
    ],
  },
  {
    id: "kingpin", label: "Kingpin", rank: 2,
    monthlyCents: 2000, annualCents: 19200, creditsPerMonth: 8,
    voteWeight: 5, extraVotes: 3, dailySubmissions: 25, adFree: true,
    pitch: "Heavier vote, more downloads, the back room.",
    perks: [
      "25 clips a day",
      "4 votes a round, each worth 5",
      "8 clip downloads a month",
      "The Back Room chat",
      "First call for Versus matches",
      "Everything in Hustler",
    ],
  },
  {
    id: "cartel", label: "Cartel", rank: 3,
    monthlyCents: 4500, annualCents: 43000, creditsPerMonth: 20,
    voteWeight: 8, extraVotes: 3, dailySubmissions: 100, adFree: true,
    pitch: "Top of the food chain. The heaviest vote on the site.",
    perks: [
      "100 clips a day",
      "4 votes a round, each worth 8",
      "20 clip downloads a month",
      "Priority in the staff review queue",
      "Everything in Kingpin",
    ],
  },
];

export const tierById = (id: string | null | undefined): Tier =>
  TIERS.find((t) => t.id === id) ?? TIERS[0];

/** $0.99 a download: $0.70 to the creator who made the clip, $0.29 to the site. */
export const DOWNLOAD = { priceCents: 99, creatorCents: 70, platformCents: 29 };

/** Months free when paying for a year instead of twelve months. */
export function annualSaving(t: Tier): number {
  if (!t.monthlyCents) return 0;
  return Math.round(((t.monthlyCents * 12 - t.annualCents) / (t.monthlyCents * 12)) * 100);
}

/** Weekly pool by paying-member count. Mirrors public.weekly_pool_cents(). */
export function weeklyPoolCents(payers: number): number {
  if (payers < 200) return 2500;
  if (payers < 500) return 10000;
  if (payers < 2500) return 25000;
  return payers * 10;
}

export const POOL_LADDER: [string, string, string][] = [
  ["0 – 199", "$25", "We cover it"],
  ["200 – 499", "$100", "We cover it"],
  ["500 – 2,499", "$250", "We cover any shortfall"],
  ["2,500+", "10¢ a member", "Funded by the community"],
];
