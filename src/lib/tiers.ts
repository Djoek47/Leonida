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
  weeklySubmissions: number;  // clips per upload week (Thursday 12:00 p.m. Eastern to the next), one shared allowance
  adFree: boolean;
  badge?: string;               // the one recommendation label on a card; never two on one card
  perks: string[];
};

export const TIERS: Tier[] = [
  {
    id: "free", label: "Free", rank: 0,
    monthlyCents: 0, annualCents: 0, votes: 1, creditsPerMonth: 0,
    weeklySubmissions: 2, adFree: false,
    perks: [
      "Submit up to 2 clips per week",
      "Access to all clips",
    ],
  },
  {
    id: "street", label: "Street", rank: 1,
    monthlyCents: 800, annualCents: 7500, votes: 2, creditsPerMonth: 3,
    weeklySubmissions: 4, adFree: true,
    badge: "BEST FOR REGULAR",
    perks: [
      "Submit up to 4 clips per week",
      "3 clip downloads a month",
      "No ads",
      "Mission Briefing",
      "Members all chat access",
    ],
  },
  {
    id: "hustler", label: "Hustler", rank: 2,
    monthlyCents: 2000, annualCents: 19200, votes: 4, creditsPerMonth: 8,
    weeklySubmissions: 8, adFree: true,
    badge: "BEST FOR GAMERS",
    perks: [
      "Submit up to 8 clips per week",
      "8 clip downloads a month",
      "Leonida Economist",
      "Feature 1 clip",
      "Everything in Street",
    ],
  },
  {
    id: "kingpin", label: "Kingpin", rank: 3,
    monthlyCents: 4500, annualCents: 43200, votes: 6, creditsPerMonth: 20,
    weeklySubmissions: 12, adFree: true,
    badge: "BEST FOR CLIPPERS",
    perks: [
      "Submit up to 12 clips per week",
      "20 clip downloads a month",
      "Feature 3 clips",
      "Clip Analytics TBD",
      "Everything in Hustler",
    ],
  },
];

/** The short explanation behind a perk. Hidden until hovered, focused or tapped. */
export const PERK_TIPS: Record<string, string> = {
  "Submit up to 4 clips per week": "Increase your chances to win",
  "3 clip downloads a month": "Download 3 clips from other members for free",
  "Mission Briefing": "Get all insights into GTA VI Missions, don’t miss a thing.",
  "Submit up to 8 clips per week": "More Submissions, Increase your chances to win",
  "8 clip downloads a month": "Download 8 clips from other members for free",
  "Leonida Economist": "Access every scheme to make money in Leonida",
  "Feature 1 clip": "Featured Clips get more visibility to win Weekly Prizes",
  "Submit up to 12 clips per week": "More Submissions, Increase your chances to win",
  "20 clip downloads a month": "Download 20 clips from other members for free",
  "Feature 3 clips": "Featured Clips get more visibility to win Weekly Prizes",
};

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
  { upTo: 99,     label: "0 – 99",         pool: 25,   gold: 15,   silver: 6.25,   bronze: 3.75 },
  { upTo: 199,    label: "100 – 199",      pool: 50,   gold: 30,   silver: 12.5,   bronze: 7.5 },
  { upTo: 399,    label: "200 – 399",      pool: 100,  gold: 60,   silver: 25,     bronze: 15 },
  { upTo: 799,    label: "400 – 799",      pool: 200,  gold: 120,  silver: 50,     bronze: 30 },
  { upTo: 1199,   label: "800 – 1,199",    pool: 300,  gold: 180,  silver: 75,     bronze: 45 },
  { upTo: 1999,   label: "1,200 – 1,999",  pool: 500,  gold: 300,  silver: 125,    bronze: 75 },
  { upTo: 3999,   label: "2,000 – 3,999",  pool: 1000, gold: 600,  silver: 250,    bronze: 150 },
  { upTo: 5999,   label: "4,000 – 5,999",  pool: 1500, gold: 900,  silver: 375,    bronze: 225 },
  { upTo: 9999,   label: "6,000 – 9,999",  pool: 1750, gold: 1050, silver: 437.5,  bronze: 262.5 },
  { upTo: Infinity, label: "10,000+",      pool: 2000, gold: 1200, silver: 500,    bronze: 300 },
];

export const bracketFor = (payers: number): Bracket =>
  BRACKETS.find((b) => payers <= b.upTo) ?? BRACKETS[BRACKETS.length - 1];

/** Clip of the Month runs at four times the week; Clip of the Year at twenty. */
/** Clip of the Month prize, one total for now. Mirrors public.site_settings.monthly_prize_cents. */
export const MONTHLY_PRIZE_CENTS = 5000;

export const PERIOD_MULTIPLE = { week: 1, month: 4, year: 20 } as const;

/** One star fills every four months subscribed; all six at two years. */
export const STAR_MONTHS = 4;
export const MAX_STARS = 6;
export const starsFor = (monthsSubscribed: number) =>
  Math.max(0, Math.min(MAX_STARS, Math.floor(monthsSubscribed / STAR_MONTHS)));
