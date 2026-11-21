/** The Road: every decision in GTA VI's story that changes something, in play order.
 *
 *  Each fork has 2–3 options. Each option carries what it changes so the page can add up a
 *  run: Criminal Profile lean, relationship, money and gear, plus a line for the story log.
 *  Compiled from GTABase and PowerPyx walkthroughs, Dork's choices list, and ending guides
 *  (Beebom, OutputLag, That Love Podcast), rewritten in our own words. Ending thresholds
 *  have not been published; the ending text says so. */

export type Effect = { pro?: number; vio?: number; rel?: number; cash?: number; gear?: string; log: string };
export type Option = { pick: string; outcome: string; fx: Effect };
/** `romance` marks a Jason-and-Lucia moment. `multi` forks are checklists: tick any mix of options
 *  (stored as a bitmask) instead of picking one lane. */
export type Fork = { id: string; ch: number; mission: string; prompt: string; options: Option[]; big?: boolean; romance?: boolean; multi?: boolean };

export const FORKS: Fork[] = [
  // ───────── Chapter 1 ─────────
  { id: "fishing", ch: 1, mission: "Gone Fishing", prompt: "The Kingfishers camp. How do you go in?", options: [
    { pick: "Ghost it", outcome: "Chokeholds and shadows. Your first job marks Jason as a Professional.", fx: { pro: 2, log: "Cleared the Kingfishers camp without a shot" } },
    { pick: "Go loud", outcome: "Bodies in the swamp. Jason's profile starts sliding toward Psycho.", fx: { vio: 2, log: "Shot up the Kingfishers camp" } },
  ] },
  { id: "gearup", ch: 1, mission: "Gear Up", prompt: "Ammu-Nation. One long gun.", options: [
    { pick: "Shotgun", outcome: "Cheap and brutal up close. Money left in your pocket.", fx: { gear: "Shotgun", log: "Bought the shotgun" } },
    { pick: "Tactical rifle", outcome: "Costs more, but the most accurate gun you'll own for hours.", fx: { gear: "Tactical rifle", log: "Splashed out on the tactical rifle" } },
  ] },
  { id: "arnold", ch: 1, mission: "Hey Arnold!", prompt: "Arnold, cornered on the docks.", big: true, options: [
    { pick: "Pull the trigger", outcome: "Arnold doesn't leave the docks. Brian calls Jason cold, and your profile hardens.", fx: { vio: 2, log: "Killed Arnold" } },
    { pick: "Let him walk", outcome: "Logged as restrained. Guides say sparing him can bring Brian back into your story later.", fx: { pro: 2, log: "Spared Arnold" } },
  ] },
  { id: "shark", ch: 1, mission: "Island Dreams", prompt: "A shark circles Dobbs.", options: [
    { pick: "Harpoon it", outcome: "Two hits and it's gone. Dobbs lives to tell the story.", fx: { pro: 1, log: "Saved Dobbs from the shark" } },
    { pick: "Let nature work", outcome: "Dobbs doesn't come back up. Only the ending scene changes.", fx: { vio: 1, log: "Let the shark take Dobbs" } },
  ] },
  { id: "prep", ch: 1, mission: "Feng Shui", prompt: "Lucia gets out tomorrow. What do you get done first?", romance: true, multi: true, big: true, options: [
    { pick: "Fix up the house", outcome: "She notices the repaired stairs the moment she walks in. A heart.", fx: { rel: 1, log: "Fixed up the house" } },
    { pick: "Groceries in the fridge", outcome: "A full fridge says you planned for her. A heart when she's home.", fx: { rel: 1, log: "Stocked the fridge" } },
    { pick: "Flowers (splurge on the roses)", outcome: "Roses waiting for her. A heart.", fx: { rel: 1, log: "Bought Lucia roses" } },
    { pick: "Gold necklace, $475", outcome: "From The Siren's Chest. A heart now, and it comes up again in Chapter 2.", fx: { rel: 1, cash: -475, gear: "Necklace", log: "Bought Lucia a necklace" } },
    { pick: "Her clothes from Andy", outcome: "She changes at the bar instead of wearing prison clothes. Skip it and it costs you later.", fx: { rel: 1, log: "Collected Lucia's clothes" } },
    { pick: "Get The Chop", outcome: "A haircut or beard tidy at Barnacle Beauties before the pickup.", fx: { rel: 1, log: "Got The Chop" } },
    { pick: "Fix Jason's car", outcome: "She comments on the car on the drive home. A heart.", fx: { rel: 1, log: "Fixed Jason's car" } },
  ] },
  { id: "anchor", ch: 1, mission: "Coming Home", prompt: "The Rusty Anchor, her first night out. The music's on.", romance: true, options: [
    { pick: "Dance with her, again and again", outcome: "Each dance can add a heart. Guides say you can stack several here.", fx: { rel: 2, log: "Danced with Lucia all night at the Rusty Anchor" } },
    { pick: "Stay at the bar", outcome: "Pool with Mattia, drinks, nothing gained.", fx: { log: "Stayed at the bar on Lucia's first night" } },
  ] },
  { id: "smugglers", ch: 1, mission: "Down to Earth", prompt: "The smugglers want paying. You can't.", options: [
    { pick: "Arms and legs", outcome: "Everyone lives. Professional points.", fx: { pro: 1, log: "Kneecapped the smugglers" } },
    { pick: "Put them down", outcome: "A cleaner deal, a darker profile.", fx: { vio: 1, log: "Killed the smugglers" } },
  ] },
  { id: "jetski", ch: 1, mission: "Day Release", prompt: "Jet ski race off Mattia's yacht.", romance: true, options: [
    { pick: "Lucia rides on Jason's ski", outcome: "Together on one ski. A heart, win or lose.", fx: { rel: 1, log: "Raced the jet ski together" } },
    { pick: "Separate skis", outcome: "Faster, maybe. Winning changes nothing.", fx: { log: "Raced Mattia on separate skis" } },
  ] },
  { id: "nine", ch: 1, mission: "Day Release", prompt: "Nine1Nine, then the pool.", romance: true, options: [
    { pick: "Hold hands and dance", outcome: "Lucia's side of the night out. Another heart.", fx: { rel: 1, log: "Held hands and danced at Nine1Nine" } },
    { pick: "Work the room alone", outcome: "Fun night, no change.", fx: { log: "Split up at Nine1Nine" } },
  ] },
  { id: "clockout", ch: 1, mission: "Clock Out", prompt: "Lucia's curfew is 4pm.", romance: true, options: [
    { pick: "Home before 4pm", outcome: "She makes curfew. A small boost.", fx: { rel: 1, log: "Got Lucia home before curfew" } },
    { pick: "Push it", outcome: "No boost.", fx: { log: "Ran Lucia's curfew close" } },
  ] },
  { id: "retire", ch: 1, mission: "Swamped", prompt: "Brian's retiring. Tell Lucia?", romance: true, options: [
    { pick: "Tell her", outcome: "No secrets. The relationship goes up.", fx: { rel: 1, log: "Told Lucia about Brian" } },
    { pick: "Keep it to yourself", outcome: "Nothing gained.", fx: { log: "Kept Brian's news to himself" } },
  ] },
  { id: "savings", ch: 1, mission: "Recalibration", prompt: "Point of no return. Your cash?", big: true, options: [
    { pick: "Bank $5,000 in Family Savings", outcome: "It survives the wipe and pays $2,000 interest at Coffee Break. Savings also weigh on the ending.", fx: { cash: 7000, log: "Saved $5,000 before Recalibration" } },
    { pick: "Keep it in your pocket", outcome: "Gone at Recalibration, along with the house.", fx: { log: "Lost everything at Recalibration" } },
  ] },

  // ───────── Chapter 2 ─────────
  { id: "kolts", ch: 2, mission: "Girls' Trip", prompt: "The Kolts at the car wash.", options: [
    { pick: "Defuse, twice", outcome: "No fight. Lucia's profile goes Professional.", fx: { pro: 2, log: "Talked the Kolts down" } },
    { pick: "Provoke them", outcome: "A brawl in the suds.", fx: { vio: 1, log: "Started a fight with the Kolts" } },
  ] },
  { id: "couple", ch: 2, mission: "After Coffee Break", prompt: "You can rob as a couple now.", romance: true, options: [
    { pick: "Rob together", outcome: "Quicker jobs, and successful joint robberies add hearts.", fx: { rel: 1, log: "Started robbing as a couple" } },
    { pick: "Split the work", outcome: "Works fine. Leaving your partner to face the cops alone hurts the relationship.", fx: { log: "Kept robbing solo" } },
  ] },
  { id: "free2", ch: 2, mission: "Between missions", prompt: "Downtime in Port Gellhorn.", romance: true, options: [
    { pick: "Date night: drinks, dancing, mini golf", outcome: "Choose Go Out from home. Dates are the fastest way to build the relationship.", fx: { rel: 2, log: "Took dates in Port Gellhorn" } },
    { pick: "Calls and texts only", outcome: "Answering keeps the bond steady while you're apart.", fx: { log: "Kept in touch by phone" } },
    { pick: "Ghost each other", outcome: "Ignored messages and long stretches apart drag it down.", fx: { rel: -2, log: "Ignored each other's calls" } },
  ] },
  { id: "pawn", ch: 2, mission: "Hit Avery Pawn", prompt: "Inside the pawn shop.", options: [
    { pick: "Threaten the staff first", outcome: "They give up the safe code. Bigger take.", fx: { log: "Cracked the Avery Pawn safe" } },
    { pick: "Smash the cases now", outcome: "Two stars straight away, a lighter bag.", fx: { vio: 1, log: "Smash-and-grabbed Avery Pawn" } },
  ] },
  { id: "dance", ch: 2, mission: "Afternoon Delight", prompt: "Mario wants Jason in the routine.", romance: true, options: [
    { pick: "Dance", outcome: "Extra scenes and a shopping stop. Lucia can get caught in the office, so Jason has to save her.", fx: { rel: 1, cash: 10000, log: "Jason danced at Delights" } },
    { pick: "Refuse", outcome: "The robbery kicks off at once and the bikers chase harder.", fx: { cash: 10000, log: "Jason refused to dance" } },
  ] },

  // ───────── Chapter 3 ─────────
  { id: "both", ch: 3, mission: "Between missions", prompt: "Who do you play in free roam?", romance: true, options: [
    { pick: "Switch to Lucia often", outcome: "Answering Jason's texts from her side counts too. It's a two-way street.", fx: { rel: 1, log: "Played both sides of the relationship" } },
    { pick: "Stick with Jason", outcome: "Favouring one of them and barely playing the other wears the relationship down.", fx: { rel: -1, log: "Stuck with Jason" } },
  ] },
  { id: "free3", ch: 3, mission: "Between missions", prompt: "A free afternoon in Vice City.", romance: true, options: [
    { pick: "Gym, kayak or scuba together", outcome: "Shared activities add hearts (and the gym trains stats too).", fx: { rel: 2, log: "Spent free days together in Vice City" } },
    { pick: "Business only", outcome: "Partners in crime, not much more.", fx: { log: "Kept it all business" } },
    { pick: "Leave your partner with the cops", outcome: "Abandoning them mid-chase is one of the surest ways to lose hearts.", fx: { rel: -2, log: "Left the partner behind in a chase" } },
  ] },
  { id: "product", ch: 3, mission: "Dealer's Choice", prompt: "Boobie's product. Pure or cut?", options: [
    { pick: "Pure", outcome: "They test it and pay. Clean deal, Professional bonus.", fx: { pro: 1, log: "Sold Boobie's product pure" } },
    { pick: "Cut", outcome: "They notice. Half price, product handed back with the money.", fx: { log: "Got caught cutting the product" } },
  ] },
  { id: "kitty", ch: 3, mission: "Here, Kitty Kitty", prompt: "The neighbour knows where Charles is.", options: [
    { pick: "Pay the $20", outcome: "Straight to Charles.", fx: { cash: -20, log: "Paid the neighbour for Charles" } },
    { pick: "Break in", outcome: "The thrift store receipt gives him away.", fx: { log: "Broke in to find Charles" } },
  ] },
  { id: "halifax", ch: 3, mission: "Dubious Provenance", prompt: "Halifax wants the statue.", big: true, options: [
    { pick: "Hand it over", outcome: "He gives you his Crowex 'Bobby Ambrose' watch, and parts 2 and 3 open.", fx: { gear: "Crowex Octane watch", cash: 2500, log: "Dealt with Halifax" } },
    { pick: "Refuse", outcome: "An optional call appears. Ignore it and parts 2 and 3 are gone after Chapter 3.", fx: { log: "Refused Halifax" } },
  ] },
  { id: "halifax2", ch: 3, mission: "Dubious Provenance", prompt: "Halifax at your feet, statue back.", options: [
    { pick: "Spare him", outcome: "He limps away.", fx: { pro: 1, log: "Spared Halifax" } },
    { pick: "Finish it", outcome: "Your call. The profile remembers.", fx: { vio: 2, log: "Killed Halifax" } },
  ] },
  { id: "police1", ch: 3, mission: "First Impressions", prompt: "Cops on your tail with Raul aboard.", options: [
    { pick: "Tyres, engines, legs", outcome: "Nobody in a uniform dies. Professional or Hardened.", fx: { pro: 2, log: "Disabled the cruisers, not the cops" } },
    { pick: "Shoot the drivers", outcome: "The run turns Violent.", fx: { vio: 2, log: "Shot police drivers" } },
  ] },
  { id: "buddy", ch: 3, mission: "Buddy?", prompt: "Kyle's in trouble. Whose side?", options: [
    { pick: "Kyle", outcome: "Loyalty to the crop duster.", fx: { log: "Sided with Kyle" } },
    { pick: "The police", outcome: "Kyle won't forget.", fx: { log: "Sided with the police over Kyle" } },
  ] },
  { id: "jewels", ch: 3, mission: "Yasmani's Jewelry Jobs", prompt: "Safe's open. The display cases?", options: [
    { pick: "Leave quietly", outcome: "$20,000 from Yasmani, no alarm.", fx: { pro: 1, cash: 20000, log: "Hit Yasmani's stores clean" } },
    { pick: "Smash every case", outcome: "Same $20,000 job, plus extra loot from the cases, plus an alarm and heat.", fx: { vio: 1, cash: 20000, log: "Cleared every display case" } },
  ] },
  { id: "sneakers", ch: 3, mission: "Ride or Die", prompt: "DWNPLY's sneakers: $1,580.", options: [
    { pick: "Pay", outcome: "Easy, expensive.", fx: { cash: -1580, log: "Paid for the sneakers" } },
    { pick: "Basketball to the head", outcome: "Free sneakers, $1,580 kept.", fx: { log: "Lifted the sneakers with a basketball" } },
  ] },
  { id: "crates", ch: 3, mission: "Company Property", prompt: "Pete's crates on the truck bed.", options: [
    { pick: "Defend every crate", outcome: "Three charges in Hidden Charges, more time in the heist, Professional bonus.", fx: { pro: 1, log: "Kept every crate" } },
    { pick: "Lose some", outcome: "Fewer charges, a tighter clock at the bank.", fx: { log: "Lost crates on the road" } },
  ] },
  { id: "monty", ch: 3, mission: "The Missing Link", prompt: "Monty over the alligator pool.", big: true, options: [
    { pick: "Dry land", outcome: "He talks and lives. Professional bonus.", fx: { pro: 2, log: "Set Monty down on dry land" } },
    { pick: "Drop him", outcome: "The alligator does the rest.", fx: { vio: 3, log: "Fed Monty to the alligator" } },
  ] },
  { id: "bricks", ch: 3, mission: "Bricked Up", prompt: "Méndez's raid. Boobie's red bag?", options: [
    { pick: "Take it", outcome: "$3,500 from Boobie and a Professional bonus.", fx: { pro: 1, cash: 3500, log: "Saved Boobie's bricks" } },
    { pick: "Leave it", outcome: "Just get out alive.", fx: { log: "Left the bricks behind" } },
  ] },

  // ───────── Chapter 4 ─────────
  { id: "eddie", ch: 4, mission: "Attend Eddie Acosta's Party", prompt: "Eddie's crypto pitch: $50,000.", options: [
    { pick: "Buy in", outcome: "A worthless NFT picture.", fx: { cash: -50000, log: "Bought Eddie's NFT" } },
    { pick: "Walk", outcome: "Rooftop bike jump instead.", fx: { log: "Turned Eddie down" } },
  ] },
  { id: "steroids", ch: 4, mission: "Making Gainz", prompt: "Nate offers Lucia steroids.", options: [
    { pick: "Decline", outcome: "Nothing changes.", fx: { log: "Lucia stayed natural" } },
    { pick: "Take them", outcome: "Lucia's body changes for the rest of the game.", fx: { log: "Lucia took Nate's steroids" } },
  ] },
  { id: "free4", ch: 4, mission: "Between missions", prompt: "Money's coming in. How do you spend the nights?", romance: true, options: [
    { pick: "Go out: club, jet skis, a parachute jump", outcome: "High-energy dates. The surest way to Hot Together.", fx: { rel: 2, log: "Went out together in Vice City" } },
    { pick: "Couch, bed at the same time, goodnight texts", outcome: "Domestic and steady. Small hearts add up.", fx: { rel: 1, log: "Kept the home life warm" } },
    { pick: "Ignore calls for days", outcome: "The relationship slides. A bad patch can be fixed, but not for free.", fx: { rel: -2, log: "Went quiet for days" } },
  ] },
  { id: "family", ch: 4, mission: "Between missions", prompt: "Big scores in the bank. Family Savings?", romance: true, options: [
    { pick: "Feed Family Savings", outcome: "Guides say savings shape relationship events and the late game.", fx: { rel: 1, log: "Built up Family Savings" } },
    { pick: "Keep it in checking", outcome: "Spendable, losable, and it doesn't count toward the family.", fx: { log: "Kept the money in checking" } },
  ] },
  { id: "felipe", ch: 4, mission: "Bad Driver!", prompt: "Felipe, on his knees in the woods.", big: true, options: [
    { pick: "Kill him", outcome: "Andrea pays $20,000.", fx: { vio: 2, cash: 20000, log: "Killed Felipe" } },
    { pick: "Spare him", outcome: "He calls later: Collect Felipe's Gift, his car.", fx: { pro: 2, gear: "Felipe's car", log: "Spared Felipe" } },
  ] },
  { id: "vault", ch: 4, mission: "That's Where the Money Is…", prompt: "The vault's open. One bag or two?", options: [
    { pick: "Partner takes a second bag", outcome: "About $80,000 out the door.", fx: { cash: 80000, rel: 1, log: "Emptied the vault as a team" } },
    { pick: "Solo bag", outcome: "Faster exit, but you leave marked bills behind.", fx: { log: "Took one bag from the vault" } },
  ] },

  // ───────── Chapter 5 ─────────
  { id: "bridge", ch: 5, mission: "The End of the Road", prompt: "Sheriffs and a helicopter block the bridge.", big: true, options: [
    { pick: "Swim for it", outcome: "Lucia gets away to raise Tomás. Jason takes the fall and goes to prison.", fx: { log: "Swam for it at the bridge" } },
    { pick: "No surrender", outcome: "Jason floors it through the roadblock, Lucia opens fire, and the car crashes at the roadside. They go down together.", fx: { log: "Refused to surrender at the bridge" } },
  ] },
];

export const ENDING_NOTE = "Guides agree the ending also weighs your story decisions, Jason and Lucia's relationship, each character's Criminal Profile and your Family Savings. Exact thresholds haven't been published, and reviewers mention more variations than these two. After the credits the game drops you back before the finale, so you can save and try the other road.";
export const TREE_SOURCES = [
  { label: "GTABase missions", href: "https://www.gtabase.com/gta-6/missions/" },
  { label: "PowerPyx walkthrough", href: "https://www.powerpyx.com/gta-6-full-walkthrough-all-missions/" },
  { label: "Dork: choices and missables", href: "https://readdork.com/gaming/gta-6-walkthrough" },
  { label: "OutputLag: the final choice", href: "https://outputlag.com/guides/gta-6-endings/" },
  { label: "GameSpot: romance guide", href: "https://www.gamespot.com/articles/gta-6-romance-relationships/" },
  { label: "G2A: relationship guide", href: "https://www.g2a.com/news/gta-6-news/gta-6-relationship-guide/" },
];

/** Where to spend GTA VI's 15 manual save slots. There's no mission replay and no saving
 *  mid-mission, so a save made just before a choice is the only way back to it. Each slot is
 *  made before `before` (free roam, after the previous mission) and covers the forks listed. */
export type SaveSlot = { slot: number; ch: number; before: string; why: string; forks: string[]; key?: boolean };
export const SAVE_PLAN: SaveSlot[] = [
  { slot: 1, ch: 0, before: "Any time (overwrite it as you go)", why: "Your clean save. Never use cheats on it: cheats switch off trophies, so this is your Platinum file.", forks: [] },
  { slot: 2, ch: 1, before: "Gone Fishing", why: "How you take the Kingfishers camp and your first long gun start shaping your profile.", forks: ["fishing", "gearup"] },
  { slot: 3, ch: 1, before: "Hey Arnold!", why: "The first big call: what happens to Arnold.", forks: ["arnold", "shark"], key: true },
  { slot: 4, ch: 1, before: "Feng Shui", why: "What you get ready for Lucia, and her first night out, set where the relationship starts.", forks: ["prep", "anchor"] },
  { slot: 5, ch: 1, before: "Down to Earth", why: "The smugglers, the yacht day, her curfew and Brian's news. Lots of small relationship swings.", forks: ["smugglers", "jetski", "nine", "clockout", "retire"] },
  { slot: 6, ch: 1, before: "Recalibration", why: "Point of no return. Everything but Family Savings is wiped and Chapter 1's leftovers lock. Bank up to $5,000 first.", forks: ["savings"], key: true },
  { slot: 7, ch: 2, before: "Girls' Trip", why: "The Kolts at the car wash.", forks: ["kolts"] },
  { slot: 8, ch: 2, before: "Afternoon Delight", why: "Robbing as a couple, the pawn shop and the $10,000 job.", forks: ["couple", "free2", "pawn", "dance"] },
  { slot: 9, ch: 3, before: "Dealer's Choice", why: "Boobie's product, and who you spend free roam with in Vice City.", forks: ["both", "free3", "product"] },
  { slot: 10, ch: 3, before: "Dubious Provenance", why: "Halifax and the statue, plus a run of jobs where a quiet or loud approach shows on your profile.", forks: ["halifax", "halifax2", "kitty", "police1", "buddy", "jewels", "sneakers"], key: true },
  { slot: 11, ch: 3, before: "Company Property", why: "Pete's crates decide your time in the heist; Monty and the gator pool is a big one.", forks: ["crates", "monty", "bricks"], key: true },
  { slot: 12, ch: 3, before: "The Cartel Heist", why: "No replay on heists. Save so you can run it again for a better take.", forks: [] },
  { slot: 13, ch: 4, before: "Bad Driver! (it closes when Power Play starts)", why: "Felipe's fate, Eddie's pitch, Nate's offer and how you treat each other with money coming in.", forks: ["eddie", "steroids", "free4", "family", "felipe"], key: true },
  { slot: 14, ch: 4, before: "VCIA Takedown", why: "The airport job, then the first vault: one bag or two.", forks: ["vault"] },
  { slot: 15, ch: 5, before: "The End of the Road", why: "The ending. The game asks if you're ready: save first so you can see the other one.", forks: ["bridge"], key: true },
];
export const SAVE_RULES = [
  "Pause → Game → Save Game. Free roam only: you can't save during a mission.",
  "The game autosaves after every mission in its own slot. It never protects a choice you've already made.",
  "Loading an older save overwrites the autosave. Make a manual save first.",
  "There's no mission replay, so a save from just before a mission is the only way to play it again.",
];
export const saveFor = (forkId: string) => SAVE_PLAN.find((s) => s.forks[0] === forkId);
