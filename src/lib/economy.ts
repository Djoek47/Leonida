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

/* ───────── Economist v2: money engines ─────────
 *  Every way to earn, as one catalogue. `ch` is the chapter it opens in; once open it stays open,
 *  so earning power stacks chapter on chapter. `top` is the best single payout in dollars where a
 *  guide gives one (used for the earning-power chart); `repeat` marks engines you can run again. */
export type EngineKind = "story" | "robbery" | "cars" | "heist" | "side" | "passive";
export type Engine = {
  id: string; name: string; ch: number; kind: EngineKind; repeat: boolean; heat: 0 | 1 | 2 | 3;
  pay: string; per?: string; top?: number; unlock: string; who?: "Jason" | "Lucia" | "Both";
  steps: string[]; sell?: string; tips: string[]; best?: boolean;
};

export const ENGINES: Engine[] = [
  // Chapter 1: the Keys. Small money, and most of it gets wiped.
  { id: "stickups", name: "Store stick-ups", ch: 1, kind: "robbery", repeat: true, heat: 1, pay: "Up to ~$2,000", per: "per store", top: 2000, unlock: "Free roam", who: "Both",
    steps: ["Bank your pocket cash at an ATM first", "Walk into almost any store and draw a weapon", "Threaten the clerk for the till, look for a back-room safe", "Lose the heat before you head home"],
    tips: ["Staff and customers react on their own, so watch for a hero.", "Cameras can identify you. Mask up or keep it quick."] },
  { id: "safes", name: "Safes and towable ATMs", ch: 1, kind: "robbery", repeat: true, heat: 2, pay: "Varies", unlock: "Free roam", who: "Both",
    steps: ["Find safes mid-robbery or marked on the map", "Look around for the combination before forcing it", "Towable ATMs need a vehicle that can drag them"],
    tips: ["Clues and locals sometimes give the combination away."] },
  { id: "raids", name: "Illegal operation raids", ch: 1, kind: "robbery", repeat: true, heat: 3, pay: "Cash, drugs, valuables", unlock: "Tips, story or exploring", who: "Both",
    steps: ["Find a gang compound (the map groups them by gang)", "Clear it before you loot", "Bag cash, narcotics and valuables", "Hold the narcotics for a fence that pays well"],
    sell: "Narcotics: Brian or Donnie now, Tyrone from Chapter 3", tips: ["Early fences pay low for drugs. Holding them is fine, but sell before Recalibration."] },
  { id: "arnold", name: "Hey Arnold!", ch: 1, kind: "story", repeat: false, heat: 1, pay: "$1,200", top: 1200, unlock: "Story", who: "Jason", best: true,
    steps: ["Play the mission through", "Cash comes on completion"], tips: ["The best story payout of the chapter."] },
  { id: "rent", name: "Lab Fees + Clean Up After Donnie", ch: 1, kind: "story", repeat: false, heat: 1, pay: "$1,200", per: "$600 each", top: 600, unlock: "Story", who: "Jason",
    steps: ["Finish both jobs", "The money is mailed to the house"], tips: ["Collect it before Recalibration or it's lost."] },
  { id: "kenton", name: "Kenton's treasure dives", ch: 1, kind: "side", repeat: true, heat: 0, pay: "Tens of thousands in total", unlock: "After Island Dreams", who: "Jason",
    steps: ["Meet Kenton after Island Dreams", "Dive each spot he marks and find every treasure", "Keep coming back: the dives carry on in later chapters"],
    tips: ["Zero heat, so it's the safest money in the game."] },
  { id: "savings1", name: "Family Savings deposit", ch: 1, kind: "passive", repeat: false, heat: 0, pay: "Keep $5,000, earn $2,000", unlock: "Before Recalibration", who: "Both", best: true,
    steps: ["Before Recalibration, move up to $5,000 into Family Savings", "It survives the wipe", "Coffee Break pays $2,000 interest on it"],
    tips: ["Everything else you own is lost at Recalibration: pocket cash, checking, the stash, the house and your cars."] },

  // Chapter 2: Port Gellhorn. The chapter won't end until you hold $15,000.
  { id: "delight", name: "Afternoon Delight", ch: 2, kind: "story", repeat: false, heat: 2, pay: "$10,000", top: 10000, unlock: "Story", who: "Both", best: true,
    steps: ["Play the robbery at Delights", "Vicki pays the next day"], tips: ["On its own it covers two thirds of the $15,000 the chapter asks for."] },
  { id: "moses", name: "Moses car flips", ch: 2, kind: "cars", repeat: true, heat: 1, pay: "$1,000+", per: "per car, ~2 min", top: 1000, unlock: "Moses", who: "Both", best: true,
    steps: ["Scan a car with WAiNK: value, security, tracker, registration", "Steal clean, untracked cars on Port Gellhorn's main road", "Drive it to Moses undamaged"],
    sell: "Moses (cars only, no trackers)", tips: ["Don't steal close to his garage. He'll refuse the car.", "Damage cuts the price."] },
  { id: "smash", name: "Smash 'n' grabs", ch: 2, kind: "robbery", repeat: true, heat: 2, pay: "Shown on the map", unlock: "Free roam", who: "Both",
    steps: ["Open the map's Robberies tab and hover a jewelry or pawn store for its estimated take", "Threaten staff for the safe code before smashing cases", "Put the stash bag in the trunk", "Drive it to a fence"],
    sell: "Dunk (Port Gellhorn), Yasmani from Chapter 3", tips: ["Loot is worth nothing until a fence buys it.", "Avery Pawn and Kingpin Bowling both have safes: threaten staff for the code."] },
  { id: "dunk", name: "Slam Dunk", ch: 2, kind: "story", repeat: false, heat: 2, pay: "$1,700 + ~$1,000", top: 2700, unlock: "Story", who: "Lucia",
    steps: ["Play the mission", "Search Bill's body before you leave: about $1,000 extra"], tips: ["Also unlocks Dunk as a fence."] },
  { id: "driver", name: "Daily Driver", ch: 2, kind: "story", repeat: false, heat: 1, pay: "$1,250 + $500", top: 1750, unlock: "Story", who: "Jason",
    steps: ["Deliver the Crawler", "Keep it undamaged for the $500 bonus"], tips: [] },
  { id: "coffee", name: "Coffee Break interest", ch: 2, kind: "passive", repeat: false, heat: 0, pay: "$2,000", top: 2000, unlock: "Saved $5,000 in Ch. 1", who: "Both",
    steps: ["Have $5,000 in Family Savings at Recalibration", "It lands automatically at Coffee Break"], tips: ["From Coffee Break you can rob as a couple. It's quicker and helps the relationship."] },

  // Chapter 3: Vice City. Best fences arrive and the money gets real.
  { id: "cartel", name: "The Cartel Heist", ch: 3, kind: "heist", repeat: false, heat: 3, pay: "$120,000", top: 120000, unlock: "End of chapter", who: "Both", best: true,
    steps: ["Do the prep missions properly: they shape the job", "Save manually before the heist (there's no replay)", "Bag the big stacks first"], tips: ["Keeping every crate in Company Property gives you more time inside."] },
  { id: "randy", name: "Randy's Wish List", ch: 3, kind: "cars", repeat: true, heat: 2, pay: "$30,000+", per: "per car, 18 cars", top: 30000, unlock: "Steal the Zorrusso", who: "Both", best: true,
    steps: ["Open Randy's list after Steal the Zorrusso", "Find each supercar (WAiNK shows where)", "Deliver it spotless to Randy in Balsero"],
    sell: "Randy (high-end cars)", tips: ["Still the best clean money between Chapter 4 vaults."] },
  { id: "zorrusso", name: "Steal the Zorrusso", ch: 3, kind: "story", repeat: false, heat: 2, pay: "$21,250 + $10,000", top: 31250, unlock: "Story", who: "Both",
    steps: ["Take the Zorrusso", "Keep your speed up so the tracker bar never fills", "Deliver to Randy"], tips: ["Opens Randy's Wish List."] },
  { id: "jewelry", name: "Jewelry store runs", ch: 3, kind: "robbery", repeat: true, heat: 2, pay: "$10,000–$25,000", per: "per store", top: 25000, unlock: "Yasmani's Jewelry Jobs", who: "Both", best: true,
    steps: ["Get the Snap Gun at Casa de Empeño", "Hit several stores in a row", "Open the back safe each time", "Sell the lot to Yasmani"],
    sell: "Yasmani (Little Cuba)", tips: ["Drop loot at your garage and pick which fence buys it."] },
  { id: "yasjobs", name: "Yasmani's Jewelry Jobs", ch: 3, kind: "story", repeat: false, heat: 2, pay: "$20,000", top: 20000, unlock: "Boobie Time", who: "Both",
    steps: ["Casa de Empeño first for the Snap Gun", "Hit the stores Yasmani names"], tips: ["Leaving the display cases alone keeps the alarm off."] },
  { id: "payday", name: "Payday Loans and banks", ch: 3, kind: "robbery", repeat: true, heat: 3, pay: "Biggest free-roam scores", unlock: "Credit Check", who: "Both",
    steps: ["Pick a target: the map shows the estimated take", "Grab the marked bills", "Lose the police before you go to a buyer", "Fence them (needs the Dye Pack Jammer)"],
    sell: "Yasmani (marked bills)", tips: ["Without the Dye Pack Jammer no fence will touch bank cash."] },
  { id: "credit", name: "Credit Check", ch: 3, kind: "story", repeat: false, heat: 2, pay: "$6,000", top: 6000, unlock: "Story", who: "Both",
    steps: ["Play the mission", "Collect the Dye Pack Jammer"], tips: ["The jammer is what makes bank cash sellable."] },
  { id: "spray", name: "Tracked cars at Pay 'n' Spray", ch: 3, kind: "cars", repeat: true, heat: 1, pay: "~$4,000", per: "per good car", top: 4000, unlock: "Welcome to Vice City", who: "Both",
    steps: ["Steal a car with a tracker", "Take it to a Pay 'n' Spray to sell or register it"], tips: ["There's a daily sale limit."] },

  // Chapter 4: the big scores.
  { id: "vcia", name: "VCIA Takedown", ch: 4, kind: "heist", repeat: false, heat: 3, pay: "~$250,000", top: 250000, unlock: "Story", who: "Both", best: true,
    steps: ["The airport heist", "Save before you start"], tips: ["One reported figure so far. Treat it as an estimate."] },
  { id: "vaults", name: "Large bank vaults", ch: 4, kind: "heist", repeat: true, heat: 3, pay: "Up to $205,000", per: "~5 min", top: 205000, unlock: "That's Where the Money Is…", who: "Both", best: true,
    steps: ["Follow a security van to a bank", "Walk in behind the guard while the vault is open", "Instant 4 stars: escape on a fast bike", "Swap cars, then drop the cash at Yasmani or a garage"],
    sell: "Yasmani (marked bills)", tips: ["The fastest money in the game once it's open."] },
  { id: "firstvault", name: "That's Where the Money Is…", ch: 4, kind: "heist", repeat: false, heat: 3, pay: "~$80,000", top: 80000, unlock: "After VCIA Takedown", who: "Both",
    steps: ["Take every marked bill", "Your partner carries a second bag"], tips: ["Optional, and it's what opens vaults for good."] },
  { id: "pete", name: "Pilot Pete's runs", ch: 4, kind: "side", repeat: true, heat: 1, pay: "$12,000–$20,000", per: "per run", top: 20000, unlock: "Pool Day", who: "Jason",
    steps: ["Take a timed drop from Wild Hog", "Land every package on time for the full $20,000"], tips: [] },
  { id: "felipe", name: "Bad Driver!", ch: 4, kind: "story", repeat: false, heat: 2, pay: "$20,000", top: 20000, unlock: "Party Hard", who: "Both",
    steps: ["Find Felipe", "Kill him for Andrea's cash (or spare him for his car)"], tips: ["Gone once Power Play starts."] },
  { id: "vans", name: "Yasmani's van tips", ch: 4, kind: "side", repeat: true, heat: 2, pay: "$10,000", per: "per tip", top: 10000, unlock: "After his Payday Loans jobs", who: "Both",
    steps: ["Buy a tip from Yasmani", "Hit the van it points you to"], tips: ["Skips the wait for a van to turn up."] },
  { id: "photo", name: "Photo/Shoot", ch: 4, kind: "story", repeat: false, heat: 1, pay: "$6,000", top: 6000, unlock: "Story", who: "Both",
    steps: ["Play the mission"], tips: ["Comes with two W-10 variants."] },

  // Chapter 5 and after.
  { id: "vaults2", name: "Vaults on repeat", ch: 5, kind: "heist", repeat: true, heat: 3, pay: "$100,000–$200,000", per: "every ~5 min", top: 200000, unlock: "After the story", who: "Both", best: true,
    steps: ["Same vault method as Chapter 4", "Bike out, swap cars", "Drop the cash at Yasmani or a garage", "Repeat"], tips: [] },
  { id: "cheat", name: "$250,000 money cheat", ch: 5, kind: "passive", repeat: true, heat: 0, pay: "$250,000", top: 250000, unlock: "Finish the story", who: "Both",
    steps: ["Finish the story", "Enter the cheat"], tips: ["It blocks saving and trophies while it's on."] },
];

export const KIND_LABEL: Record<EngineKind, string> = { story: "Story payout", robbery: "Robbery", cars: "Cars", heist: "Heist", side: "Side job", passive: "Savings" };
