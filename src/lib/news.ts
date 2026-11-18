/** The Leonida Wire — dated news and "how it plays" facts.
 *  Every item names where it came from: Rockstar itself, or press who played the game.
 *  Update this file each working session. Newest first. */

export type Source = "Rockstar" | "Press preview" | "Press review" | "TV";

export type NewsItem = {
  date: string;            // YYYY-MM-DD
  title: string;
  body: string;
  source: Source;
  links: { label: string; href: string }[];
};

export const NEWS_UPDATED = "2026-11-18";

export const NEWS: NewsItem[] = ([
  {
    date: "2026-11-18",
    title: "No mission replay at launch, IGN reports: your 15 save slots are the workaround",
    body: "IGN's reviewer says GTA VI has no menu option to replay story missions, a change from nearly every Rockstar game since The Ballad of Gay Tony. IGN's reading is that the story branches too much for it: earlier choices can change how a later mission plays out, like a heist that goes clean or turns messy. There are also no bronze, silver or gold medals. The workaround is the 15 manual save slots. IGN suggests a fresh save roughly every 7% of the story, which runs 50 to 100 hours depending on how you play. This is one reviewer's report, not a Rockstar statement, and replay could still be added later.",
    source: "Press review",
    links: [
      { label: "IGN: GTA 6 doesn't let you replay story missions", href: "https://www.ign.com/articles/gta-6-doesnt-let-you-replay-story-missions-heres-why" },
    ],
  },
  {
    date: "2026-11-10",
    title: "Pre-load is live, with a new \"Pre-Load Now\" trailer",
    body: "Digital buyers on PS5 and Xbox Series X|S can pre-load now, ahead of the November 19 launch. Rockstar says it takes up to 212 GB depending on the console. Physical copies get a pre-load code in the box, expected around November 12 depending on the retailer. The short trailer was captured on PS5: Jason backflips, Lucia hits a Vice City club. Rockstar also gave Hypebeast and HypeDrive new screenshots of the West Coast Customs cars next to the in-game versions.",
    source: "Rockstar",
    links: [
      { label: "Game Rant on the pre-load trailer", href: "https://gamerant.com/gta-6-trailer-4-pre-load/" },
      { label: "Rockstar on YouTube", href: "https://www.youtube.com/@RockstarGames/videos" },
    ],
  },
  {
    date: "2026-11-09",
    title: "West Coast Customs builds six GTA VI cars for real",
    body: "Rockstar had the LA shop West Coast Customs build six in-game cars one-to-one and put them on Miami streets: a Grotti Cheetah in Vice City fade, an Albany Buccaneer lowrider with candy green flake and a zebra interior, a candy orange Progen Emerus, a camo Coquette with pink calipers, an Albany Manana donk on gold rims, and a Pegassi Tempesta in Vice Beach police livery with light bar and underglow. It's the clearest look yet at how deep the mod shop goes: candy paint, air ride, rims, calipers, interiors and trim.",
    source: "Rockstar",
    links: [
      { label: "GamesRadar on the Miami builds", href: "https://www.gamesradar.com/games/grand-theft-auto/rockstars-figured-out-the-perfect-gta-6-advertisement-a-bunch-of-supercars-from-vice-city-speeding-along-the-streets-of-miami/" },
    ],
  },
  {
    date: "2026-11-08",
    title: "Clear some space: reports put the install past 200 GB",
    body: "Retail listings and press reports put the console download at roughly 200 to 230 GB, and the boxed version is a download code rather than a full disc. Rockstar hasn't published an official size yet, so treat the exact number as reported, not confirmed.",
    source: "Press preview",
    links: [
      { label: "TweakTown on the download size", href: "https://www.tweaktown.com/news/114341/grand-theft-auto-6-download-size-revealed-and-yes-its-over-200-gb/index.html" },
      { label: "IBTimes on the code-in-a-box", href: "https://www.ibtimes.co.uk/gta-6-210gb-download-boxed-code-ps5-1828349" },
    ],
  },
  {
    date: "2026-11-05",
    title: "Rockstar drops 39 new launch screenshots",
    body: "A launch gallery two weeks out: Jason and Lucia armed and in different outfits, dance clubs and dockside bars, police raids, scuba diving, an alligator, and a dog in what looks like its own combat gear. Mostly cinematic rather than mechanics, but the character detail is the headline.",
    source: "Rockstar",
    links: [
      { label: "The launch gallery", href: "https://www.rockstargames.com/VI/launch-gallery" },
      { label: "PC Gamer's run-through", href: "https://www.pcgamer.com/games/grand-theft-auto/rockstar-drops-a-pile-of-new-gta-6-launch-screenshots-featuring-dancers-combat-dogs-and-so-many-pores/" },
    ],
  },
  {
    date: "2026-11-18",
    title: "Reviews land the day before launch",
    body: "The review embargo reportedly lifts on November 18, a day ahead of release, though some outlets are expected to hold until launch day.",
    source: "Press preview",
    links: [
      { label: "Dot Esports on the embargo", href: "https://dotesports.com/gta/news/gta-6-review-embargo-date" },
    ],
  },
  {
    date: "2026-09-29",
    title: "Game Informer's 14-page cover story, with 12 exclusive screenshots",
    body: "Jason and Lucia on original commissioned cover art, 12 screenshots nobody had seen, developer interviews, and a longer look at Leonida and its side activities.",
    source: "Press preview",
    links: [
      { label: "What was in it", href: "https://www.gtalab.gg/en/news/gta-6-game-informer-cover-story-new-details-screenshots" },
    ],
  },
  {
    date: "2026-06-24",
    title: "Car and character customisation, in 60 screenshots",
    body: "Rockstar's Ultimate Edition reveal came with roughly 60 images covering vehicle mod shops, the Classic Car Collection, weapon engraving, tattoos and hairstyles, Personal Garages and fencing stolen goods. The detail is under How it plays.",
    source: "Rockstar",
    links: [
      { label: "GamesRadar's breakdown", href: "https://www.gamesradar.com/games/grand-theft-auto/gta-6-new-gameplay-details-activities-customization-confirmed-63-screenshots/" },
    ],
  },
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

/** From the July press previews at Rockstar North (published Aug 27, 2026), plus
 *  launch-day press reports where a topic says so. Reported by people who played it —
 *  not a Rockstar manual. */
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
      "Black star with a white edge: a crime has been called in, but police have nothing on you yet. They are only investigating and searching the area.",
      "Grey star: police have looked into it or have your description, and are actively hunting for you. More stars means more officers, searching for longer.",
      "Solid white star: they know where you are and are chasing you. Your star count sets how much force and how many units they send.",
      "Flashing star: they have lost sight of you. Stay hidden long enough and they call off the chase; the wait depends on your stars.",
      "Dark red star: the chase is over, but you are still inside the search area with clues (markers) you haven't cleared. If they spot you, the chase can restart.",
      "Every cop car has a tracker, and at max stars they search the whole map.",
      "Star meanings come from a community HUD guide, not a Rockstar manual, so names and details may change at release.",
    ],
  },
  {
    topic: "Police markers",
    points: [
      "Markers are the clues police hold on you. While any is active, being seen again can restart a chase you thought was over. Clear them out of police view.",
      "CCTV marker: a camera recorded the crime you're wanted for. Destroy or erase the footage to clear it.",
      "Clothing marker: police have identified your outfit. Change clothes out of their sight.",
      "Group marker: police know you're with someone. Split up while they can't see you.",
      "Vehicle marker: police have identified your car. Get out to clear it. Hopping into another vehicle while still in view tags you again.",
      "Appearance marker: police know how you look. Put on or take off a mask or glasses, or change your hairstyle, out of their sight.",
      "Marker details come from a community HUD guide, not a Rockstar manual, so they may change at release.",
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
    topic: "Reading the HUD",
    points: [
      "Health bar: the part left of the white divider is your standard health, which regenerates. The part to the right is extra health you've gained. It is lost as you take damage. Stamina and Focus may split the same way.",
      "Stamina bar: it drains when you run, cycle or swim at full speed, and may affect your strength in a fight. Regular activity, workouts and consumables can raise it.",
      "Focus bar: a sort of sixth sense that slows time for precise shots, gives you a better look around, shows whether a car has an alarm or tracker, and highlights enemy weak spots.",
      "Lung and oxygen bars: the lung bar drains when you swim underwater without a scuba tank. The oxygen bar shows the air left in a tank. Expect health damage if either runs out.",
      "Banked money: the number beside this icon is cash in the bank, which is safe if you're Wasted or Busted. The ring may track a money goal or a limit, since big sums in a bank could look suspicious for two people on the run.",
      "HUD meanings come from a community HUD guide, not a Rockstar manual, so they may change at release.",
    ],
  },
  {
    topic: "Story, saves and replays",
    points: [
      "No menu option to replay story missions at launch, according to IGN's reviewer. Nearly every Rockstar game since The Ballad of Gay Tony has had one.",
      "The story branches. Choices you made hours earlier can change how a whole mission plays out. The reviewer's example is a heist that can go smoothly or turn messy.",
      "IGN's guess at why: jumping back into one mission could clash with everything the story tracks behind the scenes. That is the reviewer's reading, not a Rockstar explanation.",
      "No bronze, silver or gold medals, so there are no scores or best times to chase.",
      "Workaround: 15 manual save slots. IGN suggests a new save about every 7% of the story, so you're never far from a moment you might want to revisit. The story runs roughly 50 to 100 hours.",
      "From IGN's launch-day report (Nov 18): one reviewer's playthrough, not a Rockstar statement. Replay could still be added after launch.",
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
    topic: "Customising cars",
    points: [
      "Two named mod shops so far, Rideout Customs and One-Eyed Willie's — both Ultimate Edition only at launch.",
      "Rideout leans donk and street: lifted sedans, oversized rims, loud paint, interior trim, suspension.",
      "One-Eyed Willie's leans off-road, with hand-painted one-off liveries.",
      "Rockstar's own words are \"a wide selection of artistic and performance-based vehicle mods\" — detailed interiors, rims and donk stylings.",
      "Some cars carry unique cab spoilers, rear aerials and special liveries.",
      "Personal Garages across Leonida store cars, hold a weapons locker and a stash box for hot goods.",
      "Rockstar hasn't detailed the base-game customisation system, so what Standard Edition gets is still open.",
    ],
  },
  {
    topic: "Restoring and fencing",
    points: [
      "Classic Car Collection: find abandoned project cars in the world, restore them, and run commissions for Wyman, a collector and fixer.",
      "Fences buy most stolen goods at a discount; a Stash Box at a garage or safehouse keeps them off you.",
      "Carrying hot goods around draws police attention.",
      "Ultimate Edition players can raid the PTT Youngin$ store in Southside Vice City for contraband.",
    ],
  },
  {
    topic: "Looking the part",
    points: [
      "Outfits, apparel, accessories and tattoos on arms, legs and back.",
      "Hairstyles for both characters, Jason's facial hair, Lucia's makeup and nails.",
      "Some weapons take custom grips, engravings and scopes; Ammu-Nation is the hub for that.",
      "The November launch gallery shows the pair in several different outfits, though Rockstar hasn't called that full character customisation.",
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
