/** Mission dossiers: what to do, step by step, what you get, what you can lose, and what each
 *  choice changes. Keyed by the exact mission name in missions.ts.
 *
 *  Researched from GTABase mission walkthroughs plus PowerPyx and AlcastHQ money guides
 *  (Nov 2026) and rewritten in our own words. Where a walkthrough isn't published yet the
 *  mission has no dossier and the page says so. Figures are what the guides report; the game
 *  can vary them slightly. */

export type ChoiceTag = "pro" | "violent" | "rel" | "money" | "item" | "story" | "none";
export type Choice = { at: string; pick: string; then: string; tag: ChoiceTag };
export type Intel = {
  where?: string;
  steps: string[];
  cash?: number;            // guaranteed mission payout in USD
  loot?: string[];          // items, unlocks, bonuses
  missable?: string[];
  fail?: string[];
  choices?: Choice[];
  tips?: string[];
  slug?: string;            // GTABase slug, for the source link
};

const GTAB = "https://www.gtabase.com/gta-6/missions/";
export const intelSource = (slug?: string) => (slug ? `${GTAB}${slug}` : null);

export const INTEL: Record<string, Intel> = {
  "Prologue": {
    steps: ["Sit through Lucia's meeting with the prison counselor", "Play the breakout chase", "End up back inside, whatever you do"],
    tips: ["You can't escape the chase cleanly, so don't burn time retrying it", "It's short: the real game starts with Jason in Chapter 1"],
  },
  /* ───────────────────────── CHAPTER 1 ───────────────────────── */
  "Gone Fishing": {
    slug: "gone-fishing", where: "Off the Keys, then a Kingfishers swamp camp",
    steps: [
      "Pull alongside each floating package so Cal can hook it",
      "Follow the route into the swamp and watch the deal through binoculars",
      "Sneak through the camp, crouched, choking guards from behind",
      "Wait for the shack guard to walk away, then slip in",
      "Beat the brute with blocks and counters, grab a Zombix",
      "Grab the cash in the trailer on the way to the plane",
    ],
    loot: ["Optional trailer cash", "1 unlock"],
    missable: ["The trailer cash on the way to the plane"],
    choices: [
      { at: "The camp", pick: "Stealth and chokeholds", then: "Builds a Professional profile", tag: "pro" },
      { at: "The camp", pick: "Shoot your way through", then: "Pushes you toward Psycho", tag: "violent" },
    ],
    tips: ["Binoculars live in the bottom-right of the weapon wheel", "Moving the stick while crouched is fast and silent", "The big turbine marks the shack", "Scanning animals with binoculars counts toward 100% (100 of 255 species)"],
  },
  "Gear Up": {
    slug: "gear-up", where: "Ammu-Nation near Jason's house",
    steps: ["Drive to Ammu-Nation", "Buy a long gun from Andrew", "Survive the Kingfishers ambush outside"],
    loot: ["Your first long gun", "1 unlock"],
    choices: [
      { at: "The counter", pick: "Shotgun", then: "Cheaper, the one most players can afford", tag: "money" },
      { at: "The counter", pick: "Tactical rifle", then: "Costs more, far more accurate early on", tag: "item" },
    ],
    fail: ["None that matter: dying just sends you home and ends the mission"],
    tips: ["Check your cash before you choose", "Three gunmen roll up in a truck the second you step outside"],
  },
  "Unwanted Attention": {
    slug: "unwanted-attention", where: "Hamlet police impound",
    steps: [
      "Meet Cal on the beach north of Key Lento",
      "Get into the Hamlet impound (the back lift is quieter)",
      "Find the Phoenix and drive it out",
      "Lose the police: the gate encounter always happens",
      "Respray it at the Hamlet Pay 'n' Spray (any colour)",
      "Deliver it to Brian's garage and take the $150 from the back room",
    ],
    cash: 150, loot: ["1 unlock"],
    fail: ["A guard drags you from the car: mash to break free"],
    tips: ["Knocking guards out only brings a patrol sooner, so grab the car and go", "Toggle off hat and glasses until the icons go white to cut recognition", "Buy a new outfit at the gun store next door with the garage money"],
  },
  "Lab Fees": {
    slug: "lab-fees", where: "Brian's gift-shop front, Key Lento",
    steps: ["Call Brian so he unlocks the shop", "Talk to the clerk, then threaten him with the bat", "Open the back room: keypad 0420", "Take the acid and leave", "Call Brian again", "Stash the acid in Brian's lockup: code 7700"],
    cash: 600, loot: ["Optional register cash", "Brian opens as a fence"],
    choices: [{ at: "The clerk", pick: "Threaten him with the bat", then: "He hands over acid from the back room instead of rent", tag: "story" }],
    tips: ["The $600 arrives in the mailbox outside Jason's house, since you have no bank yet", "The keypad code is also on a notepad in the room", "Fences show as green icons with initials on the map"],
  },
  "Pipework": {
    slug: "pipework", where: "Mandy's house",
    steps: ["Talk to Mandy: no rent until her sink works", "Follow her in to the bedroom", "Get the plunger from the bathroom across the hall", "Plunge the kitchen sink, then wrench the pipe", "Turn down Mandy and leave"],
    loot: ["Macizo Cigar (from the box she throws in the street)", "1 unlock"],
    tips: ["Interrupt her to ask where the plunger is", "Plunger first, then the wrench", "Grab the cigar box outside on your way out"],
  },
  "Just a Scratch": {
    slug: "just-a-scratch", where: "Coastal Auto Care",
    steps: ["Drive the '70 Ganado to Coastal Auto Care", "Talk to Joey outside", "Drive in and pick the Full Engine repair", "Cosmetics > Respray, any colour"],
    loot: ["2 unlocks", "Free Retro Build for Ultimate Edition owners"],
    tips: ["Wrecked the Ganado? Save and reload: it respawns outside your house", "Don't over-invest: this car is replaced later and its upgrades go with it", "Registering a personal car only opens in Chapter 2"],
  },
  "Get Shirley's Rum": {
    steps: ["Shirley asks for rum", "Buy a bottle and bring it back"],
    missable: ["Gone for good once you start Tourist Trap"],
    tips: ["Doing it unlocks Steal the Scooter a day later"],
  },
  "Steal the Scooter": {
    slug: "steal-the-scooter", where: "Peggy's house, across the water from Shirley's",
    steps: ["Wait a day after the rum; Shirley calls out to Jason", "Agree to steal Peggy's scooter", "Swim or drive round to Peggy's", "Take the scooter from beside the stairs", "Ride back the road to Shirley's; Peggy gives chase", "Drive it onto the porch and through her door"],
    missable: ["Gone for good once you start Tourist Trap", "Not needed for 100%"],
    choices: [{ at: "Peggy shouts", pick: "Lie to her or ignore her", then: "Same result; she can't see well enough to recognise Jason", tag: "none" }],
  },
  "Hey Arnold!": {
    slug: "hey-arnold", where: "Pool bar, south Key Lento → Maroon Key",
    steps: ["Meet Brian and ride with him", "Wait for Cal at the liquor store", "Search south to Maroon Key: Arnold is by the radar station", "Chase his car past biker gunmen", "Chase him on foot to the docks", "Decide what happens to Arnold"],
    cash: 1200,
    choices: [
      { at: "The docks", pick: "Kill Arnold", then: "Hardened rating", tag: "violent" },
      { at: "The docks", pick: "Let him go", then: "Restrained rating", tag: "pro" },
    ],
    tips: ["Slow-mo makes car shooting easy", "The bridge stunt jumps trigger on their own and stay on the map", "Take the first left to reach Arnold"],
  },
  "Island Dreams": {
    slug: "island-dreams", where: "Kenton's Island Dreams dive shop",
    steps: ["Meet Kenton", "Boat out to the dive spot", "Lead the bachelors through the trench", "Find three treasures with the metal detector", "Free Dobbs from the grate", "Deal with the shark", "Swim back to the boat"],
    cash: 400,
    choices: [
      { at: "The shark", pick: "Harpoon it (two hits)", then: "Dobbs lives; slightly different ending", tag: "story" },
      { at: "The shark", pick: "Let it attack", then: "Dobbs dies; nothing else changes", tag: "story" },
    ],
    tips: ["Collect all three treasures before freeing Dobbs", "Metal detector: bottom-right of the weapon wheel; harpoon: left slot", "Kenton's treasure dives become one of the best early earners"],
  },
  "Feng Shui": {
    slug: "feng-shui", where: "Jason's house",
    steps: ["Grab a beer and sit with Cal", "Move the TV, coffee table, couch and chair", "Say it looks fine (moving it again just loops)", "Sleep; the prison calls in the morning"],
    tips: ["The two video games on the couch can't be won, so don't try"],
  },
  "Pick Up Groceries": { steps: ["Buy groceries", "Bring them home before Lucia arrives"], tips: ["Small relationship boost when she's home"] },
  "Buy Flowers": { steps: ["Order flowers for Lucia"], tips: ["Small relationship boost"] },
  "Buy Lucia a Necklace": { steps: ["Buy a necklace at The Siren's Chest"], tips: ["Buy it: it matters again in Chapter 2"] },
  "Get The Chop": { steps: ["Haircut or beard tidy at Barnacle Beauties"] },
  "Get Lucia's Clothes": { steps: ["Collect Lucia's clothes from Andy at Manatee's Rest"], tips: ["She changes at the bar if you bring them"] },
  "Coming Home": {
    slug: "coming-home", where: "Hamlet Correctional → Rusty Anchor",
    steps: ["Finish the optional errands while you wait", "Sleep until Lucia calls", "Pick her up at the prison", "Get drinks and bring them to her at the Rusty Anchor", "Talk, dance, meet Mattia, play pool", "Fight the Aviators outside", "Run from the cops together"],
    loot: ["1 unlock"],
    choices: [
      { at: "Waiting for Lucia", pick: "Repair the house", then: "Lucia notices and the relationship rises", tag: "rel" },
      { at: "The bar", pick: "Cal's dating app / Donnie's offer", then: "No lasting effect", tag: "none" },
    ],
    tips: ["Do every optional errand first: each one raises the relationship", "In the fight, block when their shoulders turn, then counter", "The heart icon on the right shows relationship changes"],
  },
  "Clean Up After Donnie": {
    slug: "clean-up-after-donnie", where: "Swamp south-west of Hamlet",
    steps: ["Ask the fisherman on the docks", "Check the opened package under the roof", "Take the boat downriver", "Kill the three Kingfishers at the shack and take the cocaine", "Boat it to Donnie's trailer in Key Lento and drop it in the container"],
    cash: 600, loot: ["Donnie opens as a fence"],
    tips: ["The $600 comes by mail to Jason's house", "Follow the green fence icon to Donnie's"],
  },
  "Buck Me": {
    slug: "buck-me", where: "Fleeca, Key Lento",
    steps: ["Meet Lucia at Fleeca about half a day after Coming Home", "Teller, then the manager in the corner", "Get pointed to the BuckMe app", "Open BuckMe (purple B) and Buck Yourself the $100 into Family Savings"],
    cash: 100, loot: ["BuckMe banking", "1 unlock"],
    tips: ["Family Savings can't be withdrawn but can't be lost", "From now on, bank cash at every ATM you pass"],
  },
  "Down to Earth": {
    slug: "down-to-earth", where: "Brian's marina → north-west Mariana County",
    steps: ["Talk to Brian at the marina", "Pressure-wash the boat clean", "Fly the seaplane with Lucia to the far north-west", "Fish the thrown package out with the pole", "Win the gunfight with the smugglers", "Make the three drops; Lucia throws the last one mid-air", "Rush home: the parole officer is coming", "Hide the drugs in the washing machine under the house"],
    loot: ["First of 18 Meditation Spots"],
    choices: [
      { at: "The smugglers", pick: "Shoot arms and legs", then: "They live; Professional rep", tag: "pro" },
      { at: "The smugglers", pick: "Kill them", then: "More violent rep", tag: "violent" },
    ],
    tips: ["Needs Clean Up After Donnie and Buck Me done first", "Lucia handles the drops; just fly and land"],
  },
  "Find the Lost Drugs": { steps: ["Search four swamp spots for lost packages"], tips: ["Sell what you find to Brian or Donnie"] },
  "Deposit Cash Into BuckMe": { steps: ["Go to any ATM", "Deposit your pocket cash"], tips: ["You can carry up to $20,000; above that it has to be banked"] },
  "Save for the Future": { steps: ["Move money into Family Savings until the next goal"], tips: ["Aim for $5,000: it's the only money that survives the end of the chapter"] },
  "Day Release": {
    slug: "day-release", where: "Rusty Anchor → Mattia's yacht → Nine1Nine",
    steps: ["Order a drink at the back of the Rusty Anchor", "Jet ski race on the yacht (put Lucia on Jason's ski)", "Shoot the champagne bottles in slow-mo", "Keep up with Mattia's car to the Huxley Motel", "Club, then the pool escape"],
    choices: [
      { at: "Jet ski", pick: "Lucia rides with Jason", then: "Relationship up", tag: "rel" },
      { at: "Nine1Nine and the pool", pick: "Hold hands", then: "Relationship up", tag: "rel" },
    ],
    fail: ["Crashing in the chase: resetting the car repairs it"],
    tips: ["Winning the race and hitting the bottles change nothing"],
  },
  "Clock Out": { steps: ["Drive Lucia home before 4pm"], tips: ["Small relationship boost"] },
  "Clear Skies": {
    slug: "clear-skies", where: "Southwind tiki bar → swamp airstrips",
    steps: ["Meet Brian at the tiki bar", "Take off from the water in the seaplane", "Sit right above Pete's plane to hide it from radar", "Escort it to the swamp strip", "Land at the north-west strip and follow Donnie", "Fight off the Final Chapter bikers and untie Donnie", "Hold them off while he boards", "Chase the plane on a bike and get on east of Watson Bay"],
    fail: ["Donnie dies: back to the checkpoint"],
    tips: ["Water takeoffs are safer than the road", "Lots of bikes parked at the first strip: scan them with WAiNK"],
  },
  "Building a Life": {
    slug: "building-a-life", where: "Jason's house",
    steps: ["Help Lucia with the coffee table", "Screw it together, then undo it (wrong order)", "Put the glass top on from the box behind her", "Gun lesson cutscene"],
  },
  "Swamped": {
    slug: "swamped", where: "Brian's marina → Kingfishers camp",
    steps: ["Back room of the marina", "Ride with Brian to the Kingfishers camp", "Check the pig pen: it's an ambush", "Fight out and follow Brian", "Take the helicopter and clear the bank", "Chase Lori's boat on the water", "Pull close and jump across", "Win the QTE"],
    fail: ["Your engine can be shot out on the water: checkpoint"],
    choices: [{ at: "After", pick: "Tell Lucia about Brian's retirement", then: "Relationship up", tag: "rel" }],
    tips: ["Stay very close or the jump won't trigger"],
  },
  "Don Gone": {
    slug: "don-gone", where: "Donnie's trailer, Key Lento",
    steps: ["Open Donnie's trunk first", "Pack every clue in the trailer (slow-mo highlights them)", "Deal with the three Aviators outside", "Burn the car or sink it"],
    loot: ["H&L .38 unique revolver (trunk)"],
    missable: ["The H&L .38 is lost forever if you destroy the car first"],
    choices: [
      { at: "The drugs", pick: "Do one for Donnie", then: "Health down, stamina up for a while", tag: "none" },
      { at: "The Aviators", pick: "Drive off or fight", then: "Either works", tag: "none" },
    ],
  },
  "Donnie's Lost Drugs": { steps: ["Dive to Donnie's boat off Corsair Key", "Recover the stash"], tips: ["Sell it before Recalibration or you lose the cash"] },
  "Recalibration": {
    slug: "recalibration", where: "Liquor store → Cal's house",
    steps: ["Buy a six-pack", "Find Cal on his lounger", "Boat to the fishing spot", "Fish: cast, wind clockwise, strike", "Reel against the fish's direction", "Grill three fish evenly back at Cal's", "Drive Lucia home"],
    missable: ["POINT OF NO RETURN: the Key Lento house is gone for good after this", "Pocket cash you carry in is lost"],
    tips: ["Save to a separate slot first", "Put at least $5,000 in Family Savings first", "Spend or bank all pocket cash before starting"],
  },
  "Tourist Trap": {
    slug: "tourist-trap", where: "The Visitor Center",
    steps: ["Take Mattia's bag job at the Visitor Center", "Get arrested on the way back", "Escape as Lucia after Jason is shot", "Drag Jason to the boat at the docks, pistol in hand", "Reach Cal's house"],
    missable: ["All pocket cash", "The Key Lento house", "Chapter 1 free roam ends here"],
    tips: ["Story kills of police don't hurt your profile", "Treasure dives, Cal's fishing and the hideouts return later"],
  },
  "Home Sweet Home": {
    slug: "home-sweet-home", where: "Jason's house, Key Lento",
    steps: ["Go back for Jason's things", "Fight the two robbers inside", "Leave the cash and get out before it blows", "Sneak crouched through the dark to the main road", "Steal a car and leave the search area"],
    tips: ["There's no time to reach the cash, don't try"],
  },
  "Discharge Time": {
    slug: "discharge-time", where: "Vice City Hospital",
    steps: ["Upstairs to room 203 (follow the pink line)", "Push Jason's wheelchair while he shoots", "Grab a shotgun off an enemy", "Crawl to the gun when Jason is knocked down", "Shoot pursuing cops from the back of the ambulance"],
  },

  /* ───────────────────────── CHAPTER 2 ───────────────────────── */
  "What's in the Bag?": {
    slug: "whats-in-the-bag", where: "Starlet Motel, Port Gellhorn",
    steps: ["Wake up in the motel", "Look in the bag", "Flip the small statue for the note underneath"],
    tips: ["You can't open the hard drive yet, there's no computer", "The Chapter 1 trophy pops around here"],
  },
  "Ambulance Chaser": {
    slug: "ambulance-chaser", where: "Barn east of the Starlet Motel",
    steps: ["Go to the barn and in by the back stairs", "Take the ATV when addicts drive off in the ambulance", "Chase it until it hits a tree", "Pick up the gas can behind it", "Douse and ignite it (or throw the can in and shoot)", "Get away before the police arrive"],
  },
  "Girls' Trip": {
    slug: "girls-trip", where: "Starlet Motel room 10 → Delights → Dunk's",
    steps: ["Find Vicki in room 10 and pay $50 for pills", "Find out they're just Zombix and confront her", "Drive her to Delights for her paycheck", "Track Dunk to the car wash", "Handle the Kolts", "Chase Dunk's car to the farm and drive him home"],
    cash: 50, loot: ["Your $50 back via BuckMe"],
    choices: [
      { at: "The car wash", pick: "Talk the Kolts down twice", then: "No fight, Professional rep", tag: "pro" },
      { at: "The car wash", pick: "Provoke them", then: "A fight", tag: "violent" },
    ],
  },
  "Moses": {
    slug: "moses", where: "Moses's garage, Port Gellhorn",
    steps: ["Drive any car into Moses's garage", "Scan the three yard cars with WAiNK", "Take the Slim Jim", "Pick the Montagne XL's lock", "Respray and register a personal car for Lucia"],
    loot: ["Slim Jim", "Car registration", "4 unlocks", "Moses buys untracked cars"],
    choices: [
      { at: "The car you bring", pick: "Untracked", then: "You can register it straight away", tag: "item" },
      { at: "The car you bring", pick: "Tracked", then: "Moses sends you to find an untracked one", tag: "none" },
    ],
    tips: ["Cheap cars: no tracker. Mid-range: standard tracker. Supercars: advanced tracker", "Don't steal near his garage, he refuses those", "Garage closes for a minute or two after each sale"],
  },
  "Daily Driver": {
    slug: "daily-driver", where: "Old Traders' Union building",
    steps: ["Find the white Canis Crawler from Moses's photo", "Fight or just drive off", "Deliver it clean to Moses"],
    cash: 1250, loot: ["+$500 for a clean car", "Port Gellhorn garage", "Vice City Real Estate app"],
  },
  "Slam Dunk": {
    slug: "slam-dunk", where: "Docks → airstrip",
    steps: ["Creep in behind the walker at the docks", "Go back for Bill when he knocks himself out", "Clear the Kolts at the airstrip, inside the buildings too", "Search Bill's body for about $1,000"],
    cash: 1700, loot: ["~$1,000 from Bill's body", "Dunk becomes a fence", "Two robbery spots marked"],
  },
  "Behind on Payments": {
    slug: "behind-on-payments", where: "Starlet Motel reception",
    steps: ["Have $900", "Pay Linda at reception"],
    loot: ["Lucia's necklace back (if Linda held it)"],
    tips: ["Mission only appears once you're carrying $900", "Fastest: sell untracked cars to Moses"],
  },
  "Coffee Break": {
    slug: "coffee-break", where: "Starlet Motel kitchen",
    steps: ["Buy a $2 coffee from the machine", "Pick a plan (either works)", "Hold Right on the D-pad at the car"],
    cash: 2000, loot: ["Character switching and partner orders", "BuckMe upgrade: $100,000 limit, 20% off RydeMe", "$2,000 interest if you saved $5,000 in Chapter 1"],
    tips: ["Four jobs open in any order: Thrillbillies, Avery Pawn, Kingpin Bowling, Impounded Vehicle"],
  },
  "Hit Avery Pawn": {
    slug: "hit-avery-pawn", where: "Avery Pawn, Port Gellhorn",
    steps: ["Threaten the staff", "Smash the cases", "Get the safe code if offered", "Lose the 2-star heat", "Sell at Dunk's trailer"],
    choices: [
      { at: "Inside", pick: "Threaten staff first", then: "Safe code, more loot", tag: "money" },
      { at: "Inside", pick: "Smash cases straight away", then: "2 stars at once, less loot", tag: "money" },
    ],
    tips: ["A fast bike and going off-road loses the cops"],
  },
  "Hit Kingpin Bowling": {
    slug: "hit-kingpin-bowling", where: "Kingpin Bowling (Kolts)",
    steps: ["Buy five Zombix", "Armor and sticky bombs at Ammu-Nation", "Call your partner for backup", "Fight into the alley", "Luxury Watch in the south-east room", "Gutterball Moreland 850 shotgun on the north-east pool table", "Sticky-bomb the safe in the north-east office", "Lose 2 stars"],
    loot: ["Luxury Watch collectible", "Gutterball Moreland 850 unique shotgun", "Safe cash", "'Let's Go Bowling' trophy for all three"],
    tips: ["Missed something? The alley respawns in Chapter 3"],
  },
  "Thrillbillies": { steps: ["Race at the Thrillbilly Mud Club"], tips: ["Prize money counts toward the $15,000"] },
  "Twist Wrist, Smash, Grab": { steps: ["Ride as the extra man on Billy's job"], tips: ["Quick cash toward the $15,000"] },
  "Impounded Vehicle": { steps: ["Get Lucia's car out of impound"] },
  "Prepare for Vice City": {
    slug: "prepare-for-vice-city",
    steps: ["Get to $15,000", "Finish the other Chapter 2 jobs", "Head back to the motel when it lights up"],
    tips: ["Fastest: Afternoon Delight ($10,000), the four Coffee Break jobs, Billy's jobs, Veteran Hunted", "Bank as you go"],
  },
  "Afternoon Delight": {
    slug: "afternoon-delight", where: "Delights, Port Gellhorn",
    steps: ["Lucia walks in; Jason climbs the back fence", "Decide on the dance", "Rob the office", "Shoot your way out and outrun the bikers"],
    cash: 10000,
    choices: [
      { at: "Mario's routine", pick: "Jason dances", then: "Extra scenes, a clothes stop, and Lucia can get caught in the office", tag: "story" },
      { at: "Mario's routine", pick: "Jason refuses", then: "Robbery starts at once; harder biker chase", tag: "story" },
    ],
    fail: ["The safe (2008) is a trap: it alerts all of security"],
  },
  "Checking Out": {
    slug: "checking-out", where: "Starlet Motel",
    steps: ["Have $15,000 and every job done", "Take the call about Cal's article", "Open the bathroom door", "Shotgun from the bed: fight the dirty cops", "Reach Lucia in the cafeteria", "Lucia takes a biker's bike and follows Jason", "Jump into the car", "Shoot pursuers' tyres"],
    missable: ["POINT OF NO RETURN for Chapter 2: the motel is gone as a home"],
    fail: ["Bug: dying in the bike chase can strand you in a search area; restart the mission"],
  },

  /* ───────────────────────── CHAPTER 3 ───────────────────────── */
  "Welcome to Vice City": {
    slug: "welcome-to-vice-city", where: "Jack of Hearts, Crosstown",
    steps: ["Drive into Vice City", "Talk to the bouncer, meet Dre'Quan round the side", "Follow him through the club", "Meet Boobie upstairs", "Park in the covered spot at the apartment"],
    loot: ["2 unlocks", "Pay 'n' Sprays now buy and register standard-tracker cars"],
    tips: ["Your cars are stored in that covered spot all chapter"],
  },
  "Dealer's Choice": {
    slug: "dealers-choice", where: "Jack of Hearts studio",
    steps: ["Wait in the booth while Dre'Quan records", "Get Boobie's favour", "Wait out the talk with Tyrone", "Pick the product", "Hand over the bag south of the club", "Take back the money", "Knock out the man who claims the bag"],
    loot: ["Professional bonus for a clean deal"],
    choices: [
      { at: "The product", pick: "Cut", then: "Buyers notice; offer half price and they hand back product and money", tag: "money" },
      { at: "The product", pick: "Pure", then: "They test it and pay, no trouble", tag: "pro" },
    ],
  },
  "Meet the Heders": {
    slug: "meet-the-heders", where: "East-side restaurant → dockyard",
    steps: ["Drinks at the rooftop bar", "Join Brian at the railing", "As Lucia, get the disguise from the white van", "Cut the SCOOP container lock", "Bike after the trailer and jump on", "Smash out and lose the police", "Park in the north-west lockup"],
    loot: ["Cut-off tool for both characters", "1 unlock"],
    choices: [{ at: "Dinner", pick: "Order the Surf and Turf Lucia wants", then: "Small relationship boost", tag: "rel" }],
    tips: ["The other SCOOP container has a cigar and $600"],
  },
  "Dubious Provenance": {
    slug: "dubious-provenance", where: "Capri antique store",
    steps: ["Meet Evelyn and Halifax", "Decide about the statue", "Break into the store and check the drawer", "Find Halifax at the motel", "Go to Maryam's house", "Chase Halifax by Seashark, foot and bike", "Leg-shot him and get the statue back"],
    cash: 2500, loot: ["Crowex Octane 'Bobby Ambrose' watch (if you deal with Halifax)", "'32 Hustler in the storage container", "2 unlocks"],
    missable: ["Parts 2 and 3 if you refuse and never call (gone after Chapter 3)"],
    choices: [
      { at: "The statue", pick: "Give it to Halifax", then: "His watch; parts 2 and 3 continue", tag: "item" },
      { at: "The statue", pick: "Refuse", then: "An optional call appears; skip it and you lose parts 2 and 3", tag: "story" },
      { at: "The motel", pick: "Trust Halifax", then: "Unlocks part 3", tag: "story" },
      { at: "The end", pick: "Shoot or spare Halifax", then: "Your call", tag: "violent" },
    ],
  },
  "Here, Kitty Kitty": {
    slug: "here-kitty-kitty", where: "La Perle",
    steps: ["See Tyrone as Jason", "Pay the neighbour $20 for Charles's location", "Chase Charles up the far stairs", "Search his body for the Kitty Litter"],
    loot: ["Tyrone: best fence for narcotics"],
    tips: ["No $20? Break in and read the thrift store receipt", "Punch the vagrants, don't shoot"],
  },
  "Car Service": {
    slug: "car-service", where: "Chop shop, Salton",
    steps: ["Grab flashbangs and a silenced pistol from the nearby trunk", "Go in over the white van and the roof", "Steal the Schafter V12", "Lose any police", "Deliver to Leonida Auto World"],
    cash: 3000, loot: ["2 unlocks", "Randy takes standard-tracker cars"],
    tips: ["Don't shoot the guard dog: hurting dogs dents your profile"],
  },
  "Top Billing": {
    slug: "top-billing", where: "Jack of Hearts → house party",
    steps: ["Ask about the Dimez at the front", "Follow Roxy's car", "Order food at Peewees", "Get into the party round the back", "Let the dog out to move Jacki", "Knock out Kaamal when he stands", "Jason cuts the power at the green box"],
  },
  "Boobie Time": {
    slug: "boobie-time", where: "Around Vice City",
    steps: ["Drive Boobie on his rounds", "Honk at the second stop", "Chase the bag thieves on a Seashark", "Ride over the bag", "Meet Yasmani at the smoke shop"],
    loot: ["Yasmani: best fence for jewelry and marked bills", "Yasmani's Jewelry Jobs open"],
  },
  "Yasmani's Jewelry Jobs": {
    slug: "yasmanis-jewelry-jobs",
    steps: ["Casa de Empeño first: buffalo skull chain, safe 1680", "Deliver it at once for the Snap Gun", "Richardson Jewelry: diamond ring, safe 6815", "Donovan Banks & Co.: amethyst necklace, safe 0104", "Sell to Yasmani"],
    cash: 20000, loot: ["Snap Gun (silent doors)", "2 unlocks"],
    tips: ["Wipe each store's footage at the security box", "Clear display cases for extra money if the heat allows"],
  },
  "First Impressions": {
    slug: "first-impressions", where: "Waxman Island garage",
    steps: ["Code 2404 on the garage panel", "Pick up Raul in Ocean Beach", "Survive the police chase", "Jump the half-raised bridge", "Swap to the van", "Drop Raul in Bayside"],
    cash: 3000,
    choices: [
      { at: "The chase", pick: "Tyres, engines, legs", then: "Keeps you Professional or Hardened", tag: "pro" },
      { at: "The chase", pick: "Shoot drivers", then: "Pushes you to Violent", tag: "violent" },
    ],
  },
  "Caught Slipping": {
    slug: "caught-slipping", where: "Bayside apartment",
    steps: ["Chase the first thief as Jason", "Focus, leg shot, search the bag", "Switch to Lucia and repeat", "Drive to Big House Storage", "Take the lift to Jason's unit"],
  },
  "Crosstown Traffic": {
    slug: "crosstown-traffic", where: "Stockyard / La Perle",
    steps: ["Jason tails the boats on a bike", "Lucia runs for the train", "Lucia pins the gang member and takes his phone", "Jason jumps onto the boats", "Lucia stops the train", "Defend the boat; down the helicopter pilot"],
    cash: 3000,
    tips: ["Ammo is unlimited on the boat", "Shoot the helicopter pilot through the glass"],
  },
  "Credit Check": {
    slug: "credit-check", where: "Vice Vinyl → three banks",
    steps: ["Masks with Andrea", "Dye Pack Jammer and sticky bombs from Karim's desk", "Fleeca Washington Beach: empty four drawers", "Bank two: get the code, blow the inner door", "Bank three: partner waits facing the road", "Split up and lose the police"],
    cash: 6000, loot: ["Dye Pack Jammer: marked bills now sell", "2 unlocks"],
    tips: ["Knock guns away or shoot knees to stay Professional", "Skip the last safe"],
  },
  "Steal the Zorrusso for Randy": {
    slug: "steal-the-zorrusso-for-randy", where: "Hathaway Apartments garage, Ocean Beach",
    steps: ["Climb into the garage", "Install the Key Cloner from your phone", "Clone the Zorrusso on the east side", "Keep your speed up", "Deliver to Randy's showroom"],
    cash: 21250, loot: ["+$10,000 for a clean car", "Key Cloner", "Randy's Wish List", "3 unlocks"],
    fail: ["Drive too slowly and the advanced tracker sends police your position"],
  },
  "Sinfrontera National Bank": {
    slug: "sinfrontera-national-bank",
    steps: ["Enter at the top of the main stairs", "Use Focus and inspect the cameras, the pink suit, the two lift guards and the panel", "Lucia leans on the table with Jason to blend", "Sit with Raul and Andrea upstairs"],
  },
  "Security Expert": {
    slug: "security-expert", where: "Waning Sands",
    steps: ["Park near the house", "Follow Jason round the back", "Slip in when the guard leaves", "North-east bedroom", "Carry Nicole out and into the trunk", "Drive to the Stockyard planning room"],
  },
  "Company Property": {
    slug: "company-property", where: "Skeeter's → Hamlet airfield",
    steps: ["Ride with Brian to the airfield", "Load Pete's two crates", "Fight the IAA and police in the hangar", "Take off in the plane", "Lucia defends the crates from the truck bed", "Crash-land in the field right of the river"],
    loot: ["Each crate saved = one charge in Hidden Charges", "Professional bonus for saving them all"],
    tips: ["Shoot cars before they reach the truck", "Rifle and meds across from the hangar door"],
  },
  "Safe Word": {
    slug: "safe-word", where: "Raul's compound",
    steps: ["Drill: hold it steady, keep the light out of red", "Cable: thread it through without touching, hook the gold ring", "Door: hold it while Nicole drills"],
    cash: 1500, loot: ["Gil's Kalinga .50 pistol", "1 unlock"],
    tips: ["Practise as often as you want, then quit to finish"],
  },
  "The Missing Link": {
    slug: "the-missing-link", where: "Sloppy Molly's, Watson Bay",
    steps: ["Go alone as Lucia", "Follow Andrea to Monty", "Pose for the photos", "Knock Monty out", "Shoot your way out", "Drive him to Vice City", "Question him over the alligator pool"],
    loot: ["Monty's variant pistol (back in the photo room)"],
    choices: [
      { at: "Questioning", pick: "Answer everything, keep Monty alive", then: "Professional bonus", tag: "pro" },
      { at: "The end", pick: "Drop him in the pool", then: "Monty dies", tag: "violent" },
    ],
  },
  "Ride or Die": {
    slug: "ride-or-die", where: "Eris store, Downtown",
    steps: ["Wait for Dre'Quan outside the club", "Get the sneakers", "Show Shoes at the VIP door", "Hand DWNPLY the sneakers and lift his keys", "Honk to find the car", "Shake the man off the hood"],
    choices: [
      { at: "The sneakers", pick: "Pay $1,580", then: "Simple, costs cash", tag: "money" },
      { at: "The sneakers", pick: "Walk away, follow him, hit him with the basketball", then: "Free sneakers", tag: "money" },
    ],
  },
  "Cooties": {
    slug: "cooties", where: "Crosstown",
    steps: ["Drive the circles", "Pull the man off Roxy and fight", "Join the car smash", "Spray the car", "Lose DWNPLY's crew", "Drop the car at the studio"],
  },
  "Bricked Up": {
    slug: "bricked-up", where: "Venture Apartments, Rockridge",
    steps: ["Park outside the red zone", "Ask for Raymond upstairs", "Survive Méndez's raid", "Grab the red bag of bricks", "Fight down the floors", "Out the window, pick up Jason", "Lose the helicopter and roadblocks"],
    cash: 3500, loot: ["Professional bonus (the red bag)"],
    choices: [{ at: "The raid", pick: "Take the red bag", then: "$3,500 and a Professional bonus", tag: "money" }],
    missable: ["Park in the red zone and your car is impounded"],
  },
  "Hidden Charges": {
    slug: "hidden-charges",
    steps: ["Plant every charge you have", "West tower: straight to the left lift", "Parachute off the roof and leave the area"],
    loot: ["Each charge = more time in The Cartel Heist"],
    tips: ["Use both characters: faster and good for the relationship"],
  },
  "The Cartel Heist": {
    slug: "the-cartel-heist",
    steps: ["Lobby takedown on Karim's call", "Threaten Lex into the security room", "Roof: first shots while guards watch the helicopter", "Vault: work both drill bars, hold the door", "Bag the big stacks first", "Nicole's exit: watch for the flashbang, take the left door", "Get Nicole in the SWAT truck", "Bus escape; deal with the helicopter"],
    cash: 120000,
    fail: ["About 11 minutes once the towers drop"],
    tips: ["Save before you start: no replay", "Grenade the helicopter when it's directly behind the bus", "Guides report $120,000 to $150,000 in BuckMe afterwards"],
  },

  /* ───────────────────────── CHAPTER 4 ───────────────────────── */
  "Ocean Beach": {
    slug: "ocean-beach",
    steps: ["Follow Valentina to the lift", "Tour the suite", "Open the wardrobe for new outfits", "Bring Lucia champagne"],
    loot: ["New outfits from this chapter on", "1 unlock"],
  },
  "Pool Day": {
    slug: "pool-day", where: "Y Hotel",
    steps: ["Balcony first", "Tequila Sunrise for Lucia at the bar", "Eddie Acosta invites you to a party", "People-watch", "Follow Lucia to the beach"],
    choices: [{ at: "Eddie's invite", pick: "Accept or decline", then: "The party unlocks either way", tag: "none" }],
  },
  "Company Cars": {
    slug: "company-cars", where: "Y Hotel → Status Auto Imports",
    steps: ["Ask Santino for the car service", "Find Rob in the showroom", "Pick Jason's car", "Pick Lucia's car", "Race her back to the hotel"],
    loot: ["Two free cars", "1 unlock"],
    choices: [
      { at: "The showroom", pick: "Pfister Comet S2", then: "Best raw stats", tag: "item" },
      { at: "The showroom", pick: "Truck or SUV", then: "More balanced pair", tag: "item" },
    ],
    tips: ["The hotel car service is a free taxi any time", "Scan the showroom cars with WAiNK"],
  },
  "Lawyer Up": { slug: "lawyer-up", steps: ["Valentina's call after Pool Day", "Meet Abe Gonzalez downtown", "Agree to his favour"] },
  "Party Hard": {
    slug: "party-hard", where: "VCIA → Megamundo offices",
    steps: ["Drive Andrés from the airport", "Drink stop in Little Cuba", "Megamundo: the FAP attack hits", "Clear the floor quietly with the silenced pistol", "Lucia through the vent to the party floor", "Free Valentina", "Jason jumps onto the helicopter", "Fly Andrés back to the helipad"],
    tips: ["Silenced pistol has no spare ammo", "Use Focus without aiming to spot enemies", "Mind the hostages"],
  },

  /* ───────── Chapter 2 small jobs ───────── */
  "Play Nurse": { steps: ["Stay with Jason at the motel", "Help him until he's back on his feet"], tips: ["Pure story; nothing to miss"] },
  "Overnight Charges": { steps: ["Ask at the front desk what the room costs"], loot: ["If Jason bought the necklace in Chapter 1, Lucia hands it over as collateral (returned in Behind on Payments)"] },
  "Just Moved In": { steps: ["Drive to the Alpha convenience store", "Buy the supplies", "Bring them back to the room"] },
  "Pick Up a Gun": { steps: ["Buy a pistol at Ammu-Nation, or take one from your locker"], tips: ["Owned guns can always be recovered from a locker or your car's trunk"] },
  "New Look": { steps: ["Go to Pearl House", "Pick Lucia's new hairstyle"], tips: ["Changing hair also helps clear an Appearance police marker later"] },
  "How Do I Look?": { steps: ["Visit a clothing store", "Buy Lucia a new outfit"], tips: ["A spare outfit in the trunk is the fastest way to clear a Clothing marker after jobs"] },
  "Got Pills?": { steps: ["Wait for Dunk's lead on painkillers", "Follow up when he calls"] },
  "Breakfast Run": { steps: ["Head back to the motel", "Check on Jason"], tips: ["Leads straight into Coffee Break, which unlocks character switching"] },

  /* ───────── Chapter 3 small jobs ───────── */
  "Mami Knows Best": { steps: ["Go to Mia's house in M7 (trust the map marker)", "Clear the lawn and grab the mattress", "Shoot the alligator quickly", "Use the excavator on the gang property", "Drive Mia to her office"] },
  "Get Your Wheels": { steps: ["Get a car in Vice City", "Park it in the covered spot at the Bayside apartment"], tips: ["Cheap untracked cars are free money at Pay 'n' Spray or with Randy later"] },
  "South Leonida Real Estate": { steps: ["Find Mia", "Follow her car", "Search the building", "Protect Mia and find Viper"], cash: 2000, loot: ["$2,000 from Mia, many in-game days later"], fail: ["When Viper grabs Mia, shoot him while he's still talking"] },
  "Tyrone": { steps: ["Meet Tyrone in La Perle as Jason"], tips: ["Leads into Here, Kitty Kitty, which makes him your narcotics fence"] },
  "Send Money to Lorena": { steps: ["Open BuckMe", "Send the payment"], tips: ["Keep some cash banked so this doesn't stall you"] },
  "Encrypted Hard Drive": { steps: ["Back at the Bayside apartment, follow up on the drive Cal looked at"] },
  "Send More Money to Lorena": { steps: ["Open BuckMe", "Send the second payment"] },
  "Raul's Next Job": { steps: ["Take Raul's call"] },
  "Race Against Yago": { steps: ["Get to the Salton race start", "Beat Yago's time to the finish"], cash: 3800, missable: ["Time-limited: it disappears if you leave it too long"], tips: ["$3,800 for first place"] },
  "Heist Planning": { steps: ["Go back to Raul's planning room in Stockyard", "Go over the job with the crew"] },

  /* ───────── Chapter 4 ───────── */
  "Another Life": {
    slug: "another-life",
    steps: ["Answer the phone in Lucia's old house", "Check on Tomás down the hall", "Lift him from the crib and comfort him", "Turn on the kitchen radio", "Dance with him in the living room"],
    loot: ["BuckMe Black account: $2,000,000 limit", "'Vice City, baby!' trophy"],
  },
  "It's a Date!": { steps: ["Take Lucia out for the evening"], tips: ["Full walkthrough not published yet; guides disagree on whether it's optional"] },
  "Heavy Lifting": {
    where: "Raul's houseboat → Ajax Gym → Grand Majestic",
    steps: ["Collect the hard drive from storage", "Pilot Raul's houseboat south to Ajax Gym", "Lucia takes J-Wang's tour and searches Raina's bag", "Treadmill and leg-extension segments", "Trap Nate in a tanning bed and read his WhatUp messages", "Tail the bodybuilders at night to the Grand Majestic roof"],
    tips: ["On the tail, keep the arrow white: yellow means you're too close"],
  },
  "Pay Abe's Fee": { steps: ["Have the money banked", "Pay Abe through BuckMe"], tips: ["Keep cash in the bank before it appears so the story doesn't stall", "Abe gets paid twice in the story: once here, once in Chapter 5"] },
  "Photo/Shoot": {
    where: "Tequesta rooftop",
    steps: ["Ride up to the roof with Dre'Quan", "As Lucia in the helicopter, photograph the Dimez between poses", "As Jason, fly after Dre'Quan's car", "Switch to Lucia on a bike when it enters a building (don't shoot it)", "Fight off the rival cars after the second jump", "Clear the gang under the highway and reach Dre'Quan"],
    cash: 6000, loot: ["Roxy's W-10 SMG variant", "Bae-Luxe's W-10 variant"],
  },
  "Bad Driver!": {
    where: "Bar in Millport",
    steps: ["Go to the back of the bar; Felipe walks out", "Chase him into the woods", "Shoot his legs to slow him, melee him down", "Question him with L2/LT"],
    missable: ["Starting Power Play closes this for good"],
    choices: [
      { at: "Felipe", pick: "Kill him", then: "Andrea pays $20,000", tag: "money" },
      { at: "Felipe", pick: "Spare him", then: "Unlocks Collect Felipe's Gift: you get his car", tag: "item" },
    ],
  },
  "Making Gainz": {
    where: "Ajax Gym",
    steps: ["Go alone as Lucia to the planning room", "Find Nate upstairs and keep talking until he notices you", "Bench press, squat rack, deadlifts", "Exercise bike by the pool and the workout montage", "Meet Jason north of the gym and drive to the planning room"],
    choices: [
      { at: "Nate's offer", pick: "Decline the steroids", then: "Default, nothing changes", tag: "none" },
      { at: "Nate's offer", pick: "Take the steroids", then: "Lucia's physique changes for the rest of the game", tag: "story" },
    ],
    missable: ["From here to VCIA Takedown, Jason and Lucia can't be seen together in public (meet at the Y Hotel)"],
  },
  "Blood Sweat and Gear": { steps: ["Lucia's second airport setup: work out and keep building Nate's trust"], tips: ["No full walkthrough published yet"] },
  "Watch It": { steps: ["Go with Dre'Quan to VYB", "Meet Royce Jones about Dante Fresh"] },
  "Call Nate": { steps: ["Call Nate from Lucia's phone"] },
  "Cash Injections": { steps: ["Hang out with Nate", "Help him sell Synthol on Ocean Beach"], tips: ["It's all about earning Nate's trust for the airport job"] },
  "Amateur Hour": { steps: ["Go with Cisco", "Lean on the director who owes him"] },
  "Dirty Work": { steps: ["Jason books a session with Raina", "Lucia takes the photos"] },
  "Nate Will Be in Touch": { steps: ["Help Kordell's crew while you wait for Nate"] },
  "Too Much Baggage": { steps: ["Get hired as a baggage handler at VCIA", "Plant bugs for Karim"], tips: ["Scan the planes and service vehicles while you're airside"] },
  "Adventures in Babysitting": { steps: ["Work security for Andrés at The Vault nightclub", "Hold off the FAP when they strike"], missable: ["The FAP take Rafa during this job"] },
  "Rafa": { steps: ["Follow the lead on Rafa's kidnapping"] },
  "Fresh Evidence": { steps: ["Team up with Dre'Quan", "Steal the blackmail Dante Fresh holds on Royce"] },
  "Power Play": { steps: ["Learn Kordell's wine-authenticator plan", "Watch Raul decide to take the score himself"], missable: ["Starting this permanently closes Bad Driver! — do Felipe first"] },
  "Child's Play": { steps: ["Track the FAP to the cement factory", "Fight in and rescue Rafa"], loot: ["'Family Matters' trophy"] },
  "This Is a Free Call From…": { steps: ["Answer the call", "Pick Shayna up on time"], missable: ["Time-sensitive: miss the window and it's gone (not needed for 100%)"] },
  "Headliners": { steps: ["Help Dre'Quan run the VYB launch", "Stop DWNPLY", "Free the Dimez for their set"], loot: ["'DWNFALL' trophy"] },
  "Close Surveillance": { steps: ["Tail Nate and Cisco to Omar's apartment", "Fly the spy drone", "Find the Senator Camila Fuentes footage with Karim"] },
  "Delivery Method": { steps: ["Go undercover into Transport Security Services", "Load Lucia's credentials into the system"] },
  "Team Building": { steps: ["Meet Kordell at the underground fight club", "Prove yourself", "Ride with him to Raul"] },
  "Fully Catered": { steps: ["Find an airport catering truck", "Steal it and stash it for the job"], tips: ["A Dine A Soar truck sits in the VCIA service yard"] },
  "Heist Plans in Place": { steps: ["Final setup: everything is ready for the airport job"], tips: ["Save to a fresh slot now", "Finish any hourglass (time-limited) side jobs before starting the heist"] },
  "VCIA Takedown": {
    steps: ["Intercept Kordell's airport score with Raul's crew", "Lucia and Raul take the passenger plane", "Jason and Andrea recover the currency", "Split up and escape", "Wait for Raul's word to lie low"],
    loot: ["Reported ~$250,000 (one source so far)", "'Hi-Jacked' trophy", "Opens That's Where the Money Is… (bank vaults)"],
    missable: ["Heists can't be replayed: save first"],
  },
  "Tie Up Loose Ends": { steps: ["Deal with what's left after the airport job"] },
  "That's Where the Money Is…": {
    where: "Cafe Orquidea, Ocean Beach",
    steps: ["Sit at the cafe window and wait for the security van", "Tail it at a distance to the bank", "Park and follow the guard inside", "Mask up, plant charges on the back doorway", "Handle the vault guards, grab the marked bills", "Exit by the front (no back door): instant 4 stars", "Lose them and sell to Yasmani"],
    cash: 80000, loot: ["~$80,000 if you take every bill", "Yasmani's security-van tips for repeat vault robberies"],
    choices: [{ at: "The bags", pick: "Partner carries the second bag", then: "More loot out in one run", tag: "money" }],
    tips: ["Bring a second bag", "Swap cars in a lot off the main road; highways get roadblocked", "Change the disguise for a hat and glasses after"],
  },
  "Call Valentina Back": { steps: ["Return Valentina's call"] },
  "Sunset": { steps: ["Stop by the front desk", "Go looking for answers at Raul's houseboat"] },
  "Starting From Zero": { steps: ["Recover the hard drive and the statue", "Meet Giorgio Gallo"], loot: ["'Top of the World, Ma' trophy"], missable: ["Chapter finale: make a manual save before starting"] },

  /* ───────── Chapter 5 ───────── */
  "Bird in the Hand": { steps: ["Boost a new ride together"], tips: ["Save to a separate slot at the start of Chapter 5: the ending reflects the whole run"] },
  "Taking Liberties": { steps: ["A new plan comes together"] },
  "VC Baby": { steps: ["Talk to Mattia", "Help him out"] },
  "Doggie Bag": { steps: ["Meet Vinny", "Hunt down the contraband"] },
  "Operation Savage Glory": { steps: ["Recover the valuable shipment"], loot: ["'Snow Storm' trophy"] },
  "Honest Abe": { steps: ["Negotiate a deal with Abe"] },
  "Unfinished Business": { steps: ["Settle what was left open"] },
  "Protective Custody": { steps: ["Meet Abe", "Work the plan together"] },
  "The End of the Road": {
    steps: ["At Cal's, plug in the hard drive so his software can decrypt it", "Take armor and frag grenades from the weapons table", "Waterfront high-rise: helicopter cover, then a long balcony firefight", "Lucia gets Jason out of the garage; down through the construction site", "Police were tipped off: drive south for the South Point airfield", "Reach the bridge roadblock and make the final call"],
    loot: ["'You Gotta Know When to Get Off' gold trophy", "Free roam returns after the credits, set just before the finale"],
    missable: ["Make a manual save before starting: there's no replay, and the choice comes about 25 minutes in"],
    tips: ["The ending also weighs your story decisions, relationship, Criminal Profile and Family Savings", "Spoilers for both outcomes are in the Choice Tree, behind the spoiler switch"],
  },
};

/* ───────────────────────── MONEY ROUTE ───────────────────────── */

export type Earner = { name: string; pay: string; per?: string; unlock: string; how: string; best?: boolean };
export type Route = { headline: string; rule: string; earners: Earner[] };

export const MONEY_ROUTE: Record<number, Route> = {
  1: {
    headline: "Don't farm. Save $5,000.",
    rule: "Everything you carry is wiped at Recalibration. Only Family Savings (up to $5,000) carries over, and it earns $2,000 interest at Coffee Break.",
    earners: [
      { name: "Hey Arnold!", pay: "$1,200", unlock: "Story", how: "Best story payout this chapter", best: true },
      { name: "Lab Fees + Clean Up After Donnie", pay: "$1,200", unlock: "Story", how: "$600 each, mailed to the house" },
      { name: "Kenton's treasure dives", pay: "Tens of thousands total", unlock: "After Island Dreams", how: "Find every treasure at each of his spots; it carries on in later chapters" },
      { name: "Fence lost drugs to Brian/Donnie", pay: "Low rates", unlock: "Lab Fees", how: "Sell before Recalibration or lose it" },
    ],
  },
  2: {
    headline: "Hit $15,000 fast.",
    rule: "The chapter won't end until you have $15,000. Afternoon Delight alone pays $10,000.",
    earners: [
      { name: "Afternoon Delight", pay: "$10,000", unlock: "Story", how: "Vicki pays the next day", best: true },
      { name: "Moses car flips", pay: "$1,000+", per: "per car, ~2 min", unlock: "Moses", how: "Untracked cars from Port Gellhorn's main road, not near his garage" },
      { name: "Slam Dunk", pay: "$1,700 + ~$1,000", unlock: "Story", how: "Search Bill's body before leaving" },
      { name: "Daily Driver", pay: "$1,250 + $500", unlock: "Story", how: "Deliver the Crawler undamaged" },
      { name: "Coffee Break interest", pay: "$2,000", unlock: "Saved $5,000 in Ch. 1", how: "Automatic" },
      { name: "Avery Pawn / Kingpin Bowling", pay: "Loot + safes", unlock: "Coffee Break", how: "Threaten staff for the safe code; sell to Dunk" },
    ],
  },
  3: {
    headline: "This is where the money starts.",
    rule: "Best fences arrive (Tyrone, Yasmani, Randy). A $120,000 heist closes the chapter.",
    earners: [
      { name: "The Cartel Heist", pay: "$120,000", unlock: "End of chapter", how: "Bag the big stacks first", best: true },
      { name: "Randy's Wish List supercars", pay: "$30,000+", per: "per car", unlock: "Steal the Zorrusso", how: "18 cars; deliver them spotless", best: true },
      { name: "Steal the Zorrusso", pay: "$21,250 + $10,000", unlock: "Story", how: "Keep speed up so the tracker never fills" },
      { name: "Jewelry stores", pay: "$10,000–$25,000", per: "per store", unlock: "Yasmani's Jewelry Jobs", how: "Hit several in a row, open the back safe, sell to Yasmani" },
      { name: "Yasmani's Jewelry Jobs", pay: "$20,000", unlock: "Boobie Time", how: "Casa de Empeño first for the Snap Gun" },
      { name: "Tracked cars at Pay 'n' Spray", pay: "~$4,000", per: "per good car", unlock: "Welcome to Vice City", how: "Daily sale limit applies" },
      { name: "Credit Check", pay: "$6,000", unlock: "Story", how: "Also unlocks the Dye Pack Jammer for bank cash" },
    ],
  },
  4: {
    headline: "Unlock bank vaults.",
    rule: "The optional 'That's Where the Money Is…' near the end of the chapter opens large bank vaults: up to $205,000 in about five minutes.",
    earners: [
      { name: "Large bank vaults", pay: "Up to $205,000", per: "~5 min", unlock: "That's Where the Money Is…", how: "Follow a security van to a bank and walk in behind the guard while the vault's open. Instant 4 stars: escape on a fast bike, then swap cars", best: true },
      { name: "VCIA Takedown", pay: "~$250,000", unlock: "Story", how: "The airport heist (one reported figure so far)", best: true },
      { name: "That's Where the Money Is…", pay: "~$80,000", unlock: "After VCIA Takedown", how: "First vault: take every marked bill, partner carries a second bag" },
      { name: "Pilot Pete's runs (Jason)", pay: "$12,000–$20,000", per: "per run", unlock: "Pool Day", how: "Timed drops from Wild Hog pay $20,000 if every package lands on time" },
      { name: "Bad Driver!", pay: "$20,000", unlock: "Party Hard", how: "Kill Felipe for the cash (or spare him for his car). Gone once Power Play starts" },
      { name: "Photo/Shoot", pay: "$6,000", unlock: "Story", how: "Plus two W-10 variants" },
      { name: "Yasmani's van tips", pay: "$10,000 each", unlock: "After his Payday Loans jobs", how: "Buy a tip to skip waiting for a van" },
      { name: "Keep filling Randy's list", pay: "$30,000+", per: "per car", unlock: "Ch. 3", how: "Still the best clean money between vaults" },
    ],
  },
  5: {
    headline: "Vaults on repeat.",
    rule: "After the story, large vaults pay roughly $100,000–$200,000 every five minutes. The $250,000 cheat unlocks too, but it blocks saving and trophies.",
    earners: [
      { name: "Large bank vaults", pay: "$100,000–$200,000", per: "~5 min", unlock: "Ch. 4", how: "Bike out, swap cars, drop cash at Yasmani or a garage", best: true },
    ],
  },
};
