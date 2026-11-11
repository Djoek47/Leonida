/** Tier table, mirrored from public.tiers so the UI can render without a round trip.
 *  The database is the source of truth for anything that moves money. */

export type TierId = "free" | "street" | "hustler" | "kingpin";

export type Tier = {
  id: TierId;
  label: string;
  rank: number;
  monthlyCents: number;
  annualCents: number;
  votes: number;              // private weekly allowance; never shown on pricing
  creditsPerMonth: number;    // free download credits each cycle, they don't roll over
  dailySubmissions: number;
  adFree: boolean;
  pitch: string;
  perks: string[];
};

export const TIERS: Tier[] = [
  {
    id: "free", label: "Free", rank: 0,
    monthlyCents: 0, annualCents: 0, votes: 1, creditsPerMonth: 0,
    dailySubmissions: 2, adFree: false,
    pitch: "Upload, compete and win. No card needed.",
    perks: [
      "Send 2 clips a day",
      "Eligible for every prize: Week, Month and Year",
      "Stream every clip",
      "Daily Drop challenges",
      "The Lobby, Clip talk and Trending chat",
    ],
  },
  {
    id: "street", label: "Street", rank: 1,
    monthlyCents: 800, annualCents: 7500, votes: 2, creditsPerMonth: 3,
    dailySubmissions: 4, adFree: true,
    pitch: "For the regular. More shots on goal.",
    perks: [
      "Upload up to 4 clips a day.",
      "3 clip downloads a month",
      "No ads",
      "Members chat access.",
    ],
  },
  {
    id: "hustler", label: "Hustler", rank: 2,
    monthlyCents: 2000, annualCents: 19200, votes: 4, creditsPerMonth: 8,
    dailySubmissions: 6, adFree: true,
    pitch: "The working creator's plan. Know what's about to trend.",
    perks: [
      "Upload up to 6 clips a day.",
      "8 clip downloads a month",
      "Leonida Economist: live trends and money-making methods",
      "Weekly Meta Brief",
      "Feature 1 clip.",
      "Everything in Street",
    ],
  },
  {
    id: "kingpin", label: "Kingpin", rank: 3,
    monthlyCents: 2500, annualCents: 24000, votes: 6, creditsPerMonth: 20,
    dailySubmissions: 8, adFree: true,
    pitch: "Top of the food chain.",
    perks: [
      "Upload up to 8 clips a day.",
      "20 clip downloads a month",
      "Feature 3 clips a month, 24 hours each",
      "Everything in Hustler",
    ],
  },
];

export const tierById = (id: string | null | undefined): Tier =>
  TIERS.find((t) => t.id === id) ?? TIERS[0];

/** $0.99 a download. The creator who made the clip is paid on every one. */
export const DOWNLOAD = { priceCents: 99, creatorCents: 70, platformCents: 29 };

/** Months free when paying for a year instead of twelve months. */
export function annualSaving(t: Tier): number {
  if (!t.monthlyCents) return 0;
  return Math.round(((t.monthlyCents * 12 - t.annualCents) / (t.monthlyCents * 12)) * 100);
}

/** Clip of the Week pool, split Gold 60 / Silver 25 / Bronze 15, by paying members.
 *  Mirrors public.prize_brackets. */
export type Bracket = { upTo: number; label: string; pool: number; gold: number; silver: number; bronze: number };

export const BRACKETS: Bracket[] = [
  { upTo: 100,    label: "0 – 100",        pool: 25,   gold: 15,   silver: 6.25, bronze: 3.75 },
  { upTo: 200,    label: "100 – 200",      pool: 50,   gold: 30,   silver: 12.5, bronze: 7.5 },
  { upTo: 400,    label: "200 – 400",      pool: 100,  gold: 60,   silver: 25,   bronze: 15 },
  { upTo: 800,    label: "400 – 800",      pool: 200,  gold: 120,  silver: 50,   bronze: 30 },
  { upTo: 1200,   label: "800 – 1,200",    pool: 300,  gold: 180,  silver: 75,   bronze: 45 },
  { upTo: 2000,   label: "1,200 – 2,000",  pool: 500,  gold: 300,  silver: 125,  bronze: 75 },
  { upTo: 4000,   label: "2,000 – 4,000",  pool: 1000, gold: 600,  silver: 250,  bronze: 150 },
  { upTo: 6000,   label: "4,000 – 6,000",  pool: 1500, gold: 900,  silver: 375,  bronze: 225 },
  { upTo: 10000,  label: "6,000 – 10,000", pool: 2500, gold: 1500, silver: 625,  bronze: 375 },
  { upTo: Infinity, label: "10,000+",      pool: 3000, gold: 1800, silver: 750,  bronze: 450 },
];

export const bracketFor = (payers: number): Bracket =>
  BRACKETS.find((b) => payers <= b.upTo) ?? BRACKETS[BRACKETS.length - 1];

/** Clip of the Month runs at four times the week; Clip of the Year at twenty. */
export const PERIOD_MULTIPLE = { week: 1, month: 4, year: 20 } as const;

/** One star fills every four months subscribed; all six at two years. */
export const STAR_MONTHS = 4;
export const MAX_STARS = 6;
export const starsFor = (monthsSubscribed: number) =>
  Math.max(0, Math.min(MAX_STARS, Math.floor(monthsSubscribed / STAR_MONTHS)));
