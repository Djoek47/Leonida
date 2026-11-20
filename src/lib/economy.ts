/** Leonida Economist: every way to make, move and protect money in GTA VI story mode.
 *
 *  Compiled from community guides (GTABase money, heists, fences and BuckMe guides, Nov 2026)
 *  and rewritten in our own words. `ch` is the chapter where a scheme opens; the page hides the
 *  details of anything past the member's chapter so nothing spoils the story. */

export type Scheme = { name: string; ch: number; pay: string; risk: 1 | 2 | 3; how: string; tips: string[] };
export type Fence = { name: string; area: string; ch: number; unlock: string; buys: string; rate: string };

export const SCHEMES: Scheme[] = [
  {
    name: "Store stick-ups", ch: 1, pay: "Up to a couple of thousand", risk: 1,
    how: "Almost any store you can walk into can be robbed. No marker or mission needed.",
    tips: ["Staff and customers react on their own, so watch for a hero.", "Cameras can identify you. Mask up or keep it quick.", "Bank your pocket cash before you start."],
  },
  {
    name: "Smash 'n' grabs", ch: 2, pay: "Shown on the map", risk: 2,
    how: "Jewelry stores and pawn shops. Hover a target on the map's Robberies tab to see the estimated take before you commit.",
    tips: ["Loot goes in a stash bag. It's worth nothing until a fence buys it.", "Put the bag in your trunk before the drive to the fence."],
  },
  {
    name: "Payday Loans and banks", ch: 3, pay: "Biggest free-roam scores", risk: 3,
    how: "Larger targets with higher heat. The map shows an estimated value for each one.",
    tips: ["The take comes as marked bills. You need the Dye Pack Jammer before a fence will touch them.", "Lose the police before heading to a buyer, or the bag can be lost."],
  },
  {
    name: "Illegal operation raids", ch: 1, pay: "Cash, drugs, valuables", risk: 3,
    how: "Gang compounds and hideouts, found through tips, story events or just exploring. The map groups them by gang.",
    tips: ["Hold narcotics for the fence that pays best for them; early fences pay low.", "Clear the compound before you start looting."],
  },
  {
    name: "Safes and towable ATMs", ch: 1, pay: "Varies", risk: 2,
    how: "Marked around Leonida. Store safes can be cracked mid-robbery, sometimes with a combination you find from clues or locals.",
    tips: ["Towable ATMs need a vehicle that can drag them.", "Look around the store for the combination before forcing it."],
  },
  {
    name: "Steal and flip cars", ch: 2, pay: "Depends on the car", risk: 2,
    how: "Scan a car with the WAiNK app first. It shows value, security level, tracker status and registration cost.",
    tips: ["Clean cars with no tracker pay best. Damage cuts the price.", "Trackered cars go to a Pay 'n' Spray to sell or register.", "Don't steal close to Moses's garage. He'll refuse the car."],
  },
  {
    name: "Story heists", ch: 3, pay: "The biggest money in the game", risk: 3,
    how: "Two big story scores with prep missions before each. They're part of the story, so they can't be repeated.",
    tips: ["Save manually before the heist itself. There is no mission replay.", "Do the prep missions properly. They shape how the job plays out."],
  },
];

export const FENCES: Fence[] = [
  { name: "Brian", area: "Key Lento", ch: 1, unlock: "Lab Fees", buys: "Narcotics, jewelry, marked bills", rate: "Low" },
  { name: "Donnie", area: "Key Lento", ch: 1, unlock: "Clean Up After Donnie", buys: "Narcotics, jewelry, marked bills", rate: "Low" },
  { name: "Dunk", area: "Port Gellhorn", ch: 2, unlock: "Slam Dunk", buys: "Narcotics, jewelry, marked bills", rate: "Low" },
  { name: "Moses", area: "Port Gellhorn", ch: 2, unlock: "Moses", buys: "Cars only, no trackers", rate: "Cars" },
  { name: "Tyrone", area: "La Perle, Vice City", ch: 3, unlock: "Here, Kitty Kitty", buys: "Narcotics", rate: "Best for narcotics" },
  { name: "Yasmani", area: "Little Cuba, Vice City", ch: 3, unlock: "Boobie Time", buys: "Jewelry, marked bills", rate: "Best for jewelry and bills" },
  { name: "Randy", area: "Balsero, Vice City", ch: 3, unlock: "Steal the Zorrusso for Randy", buys: "High-end cars", rate: "Cars" },
];

export const SAVINGS = [
  { goal: "Buckin' Broke", saved: "$5,000", limit: "$15,000", perk: "None" },
  { goal: "BuckeDry", saved: "$10,000", limit: "$100,000", perk: "20% off RydeMe rides" },
  { goal: "BuckMe Gold", saved: "$100,000", limit: "$500,000", perk: "20% off garage purchases" },
  { goal: "BuckMe Premium", saved: "$500,000", limit: "$2,000,000", perk: "10% off liveries" },
  { goal: "Rich as Buck", saved: "$1,000,000", limit: "$2,000,000", perk: "None" },
];

export const CASH_RULES = [
  "Only pocket cash can be lost. Wasted or busted, you drop all of it plus a small BuckMe fee.",
  "Each character can carry up to $20,000 in pocket cash.",
  "Deposit at any ATM. The BuckMe app's ATM Finder shows the closest one.",
  "Shops take pocket cash up to $999. Anything bigger comes out of BuckMe on its own.",
  "Family Savings is shared by Jason and Lucia. You can't withdraw it, but you can't lose it either.",
  "Every savings goal raises your checking limit. Hit the limit and new pay waits until you spend or save.",
];

/** Warnings tied to a chapter. Hidden past the member's chapter like everything else. */
export const CHAPTER_ALERTS: { ch: number; text: string }[] = [
  { ch: 1, text: "Before Recalibration, move up to $5,000 into Family Savings. From there on you lose pocket cash, checking, the floorboard stash, the house and your cars. Family Savings (up to $5,000) is all that carries over, and it pays $2,000 interest at Coffee Break." },
  { ch: 2, text: "From Coffee Break you can rob as a couple. It's quicker, and the in-game help says it improves the relationship. Threats don't hurt your Criminal Profile; needless violence does." },
  { ch: 3, text: "Once Yasmani is a fence you can drop loot at your garage and pick which fence buys it." },
  { ch: 4, text: "BuckMe Premium is handed to you when Chapter 4 starts: $2,000,000 checking limit." },
  { ch: 5, text: "Finishing the story unlocks the $250,000 money cheat." },
];

export const ECONOMY_SOURCES = [
  { label: "GTABase: money-making guide", href: "https://www.gtabase.com/articles/gta-6/how-to-make-money-in-gta-6-full-money-making-guide" },
  { label: "GTABase: heists guide", href: "https://www.gtabase.com/articles/gta-6/gta-6-heists-explained-every-big-score-confirmed-so-far" },
  { label: "GTABase: fence locations", href: "https://www.gtabase.com/gta-6/articles/gta-6-fence-locations-all-fences-what-they-buy" },
  { label: "GTABase: BuckMe & Family Savings", href: "https://www.gtabase.com/gta-6/articles/how-to-keep-your-money-safe-in-gta-6" },
];
