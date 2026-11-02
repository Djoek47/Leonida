/** The Leonida Wire — dated news and "how it plays" facts.
 *  Every item names where it came from: Rockstar itself, or press who played the game.
 *  Update this file each working session. Newest first. */

export type Source = "Rockstar" | "Press preview" | "TV" | "Retail";

export type NewsItem = {
  date: string;            // YYYY-MM-DD
  title: string;
  body: string;
  source: Source;
  links: { label: string; href: string }[];
};

export const NEWS_UPDATED = "2026-11-02";

export const NEWS: NewsItem[] = ([
  {
    date: "2026-10-29",
    title: "Justice drop \"Pusher\" with Gesaffelstein; the full score lands Dec 11",
    body: "Rockstar confirmed Grand Theft Auto VI: Original Score by Justice — 30 tracks plus digital bonus tracks, out December 11 on digital, double CD and a triple crystal-clear vinyl.",
    source: "Rockstar",
    links: [
      { label: "Listen to Pusher", href: "http://justice.lnk.to/pusher" },
      { label: "Pre-save the score", href: "https://justice.lnk.to/gtaoriginalscoredigital" },
      { label: "Rockstar music page", href: "https://www.rockstargames.com/VI/music" },
    ],
  },
  {
    date: "2026-10-28",
    title: "South Park airs brand-new GTA VI gameplay",
    body: "Season 29, episode 4, \"Guinea Pig on a Stick\" closes on a short clip of real GTA VI on a packed Vice City beach — including picking up dog poop and throwing it at people. Rockstar gets a special thanks in the credits. There's no standalone official upload of the clip yet; the footage belongs to South Park, so we link to it rather than re-host it.",
    source: "TV",
    links: [
      { label: "PC Guide write-up", href: "https://www.pcguide.com/news/rockstar-chooses-to-preview-more-gta-6-gameplay-in-the-latest-south-park-episode/" },
      { label: "Notebookcheck", href: "https://notebookcheck.net/South-Park-airs-GTA-6-gameplay-with-flying-dog-poop-on-packed-Vice-City-beach.1436981.0.html" },
    ],
  },
  {
    date: "2026-10-15",
    title: "The Launch Trailer is out, captured in-game on PS5",
    body: "Rockstar's final trailer before release restates November 19 and debuts a new Justice single. It sits alongside Trailer 1, Trailer 2 and An Extended Look on Rockstar's site.",
    source: "Rockstar",
    links: [
      { label: "Watch on Rockstar", href: "https://www.rockstargames.com/VI/launch-trailer" },
    ],
  },
  {
    date: "2026-11-01",
    title: "$79.99 standard, $99.99 Ultimate, preload from November 12",
    body: "Store listings put the standard edition at $79.99 US and the Ultimate Edition at $99.99. Pre-orders include the Vintage Vice City Pack. Preloading opens at local midnight on November 12 on both consoles. PS5 and Xbox Series X|S only — no PC date yet.",
    source: "Retail",
    links: [
      { label: "Confirmed vs rumour scorecard", href: "https://tech-insider.org/gta-6-confirmed-vs-rumor-scorecard-17-days-out-2026" },
    ],
  },
  {
    date: "2026-08-27",
    title: "Press played it: how GTA VI actually works",
    body: "Alongside An Extended Look, press and creators who played at Rockstar North — including TGG — published deep previews. The big systems are below under How it plays.",
    source: "Press preview",
    links: [
      { label: "VICE: every new gameplay detail", href: "https://www.vice.com/en/article/gta-6-new-gameplay-features-details-revealed/" },
      { label: "GTABase previews roundup", href: "https://www.gtabase.com/articles/gta-6/gta-6-previews-recap-all-new-gameplay-features-revealed" },
    ],
  },
] as NewsItem[]).sort((a, b) => b.date.localeCompare(a.date));

/** From the July press previews at Rockstar North (published Aug 27, 2026).
 *  Reported by people who played it — not a Rockstar manual. */
export const HOW_IT_PLAYS: { topic: string; points: string[] }[] = [
  {
    topic: "Guns",
    points: [
      "Auto-aim is off by default; aiming is free with slight stickiness you can tune.",
      "Jason and Lucia always carry two concealed handguns. Long guns: two at most, one on your back, one in hand.",
      "Extra long guns live in a vehicle's weapon crate — only personal vehicles keep your full loadout.",
      "Heavier recoil than GTA V, optional kill cams, and you can hand weapons to each other.",
      "Focus slows time and marks weak points: red to kill, yellow to incapacitate — engines, tanks and tyres too.",
    ],
  },
  {
    topic: "Police and Heat",
    points: [
      "Cops are off the minimap. A crime has to be seen and reported before stars appear.",
      "A new Heat system tracks what police know: CCTV, your outfit, your weapon, your car.",
      "Kill the evidence to shake them — wipe footage, change clothes, ditch the car, or split Jason and Lucia up.",
      "Star styles tell you where you stand: solid (they see you), flashing (lost sight), hollow (reported, no description), red (escaped, still searching).",
      "Every cop car has a tracker, and at max stars they search the whole map.",
    ],
  },
  {
    topic: "Cars",
    points: [
      "Fuel is back — refuel and repair at gas stations.",
      "Cars have security tiers: smash a window, slim-jim it, hotwire it, or clone the key on the expensive ones.",
      "The Waink app scans any car for its security, tracker and resale value.",
      "Register stolen cars for a fee; buy garages for more storage. Scooter Bros deliver your car to you.",
      "Handbrake moves to X so you can shoot with L1/R1 while driving.",
    ],
  },
  {
    topic: "Money and robberies",
    points: [
      "Three kinds of money: bank (BuckMe app), cash on you (lost if you die), and loot in duffel bags you sell to fences.",
      "Rob convenience stores, jewellers, payday lenders, banks, compounds, armoured vans and full heists.",
      "Clerks and guards can fight back. Safes need codes you find or buy.",
    ],
  },
  {
    topic: "Criminal Profile",
    points: [
      "Not a morality meter — states run Professional, Aggressive, Violent, Psycho.",
      "Push past Psycho and there's no coming back that playthrough.",
      "Jason and Lucia are tracked separately.",
    ],
  },
  {
    topic: "Life in Leonida",
    points: [
      "Map reported at roughly twice GTA V, with Vice City about twice the size of Los Santos.",
      "Phone apps: BuckMe, RydeMe, WhatUp, Waink, Snapmatic, Scooter Bros, a fitness app.",
      "Gym, eating and sleep change your body and stats. Hair grows back only at a barber.",
      "Fishing, hunting, basketball, pool, mini golf, a shooting range, and dates at the zoo or beach.",
      "The radio wheel is gone — you scroll stations. Streamer Mode mutes licensed music.",
    ],
  },
];
