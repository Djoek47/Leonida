/** The Road: every decision in GTA VI's story that changes something, in play order.
 *
 *  Each fork has 2–3 options. Each option carries what it changes so the page can add up a
 *  run: Criminal Profile lean, relationship, money and gear, plus a line for the story log.
 *  Compiled from GTABase and PowerPyx walkthroughs, Dork's choices list, and ending guides
 *  (Beebom, OutputLag, That Love Podcast), rewritten in our own words. Ending thresholds
 *  have not been published; the ending text says so. */

export type Effect = { pro?: number; vio?: number; rel?: number; cash?: number; gear?: string; log: string };
export type Option = { pick: string; outcome: string; fx: Effect };
export type Fork = { id: string; ch: number; mission: string; prompt: string; options: Option[]; big?: boolean };

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
  { id: "errands", ch: 1, mission: "Coming Home", prompt: "Lucia's out tomorrow. Do the errands?", big: true, options: [
    { pick: "Everything: house, flowers, necklace, clothes", outcome: "She notices all of it. The relationship starts high, and it feeds the ending.", fx: { rel: 3, gear: "Necklace", log: "Got everything ready for Lucia" } },
    { pick: "Just pick her up", outcome: "She notices that too. Skipping her clothes even costs you later.", fx: { rel: -2, log: "Showed up empty-handed for Lucia" } },
  ] },
  { id: "smugglers", ch: 1, mission: "Down to Earth", prompt: "The smugglers want paying. You can't.", options: [
    { pick: "Arms and legs", outcome: "Everyone lives. Professional points.", fx: { pro: 1, log: "Kneecapped the smugglers" } },
    { pick: "Put them down", outcome: "A cleaner deal, a darker profile.", fx: { vio: 1, log: "Killed the smugglers" } },
  ] },
  { id: "retire", ch: 1, mission: "Swamped", prompt: "Brian's retiring. Tell Lucia?", options: [
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
  { id: "pawn", ch: 2, mission: "Hit Avery Pawn", prompt: "Inside the pawn shop.", options: [
    { pick: "Threaten the staff first", outcome: "They give up the safe code. Bigger take.", fx: { log: "Cracked the Avery Pawn safe" } },
    { pick: "Smash the cases now", outcome: "Two stars straight away, a lighter bag.", fx: { vio: 1, log: "Smash-and-grabbed Avery Pawn" } },
  ] },
  { id: "dance", ch: 2, mission: "Afternoon Delight", prompt: "Mario wants Jason in the routine.", options: [
    { pick: "Dance", outcome: "Extra scenes and a shopping stop. Lucia can get caught in the office, so Jason has to save her.", fx: { rel: 1, cash: 10000, log: "Jason danced at Delights" } },
    { pick: "Refuse", outcome: "The robbery kicks off at once and the bikers chase harder.", fx: { cash: 10000, log: "Jason refused to dance" } },
  ] },

  // ───────── Chapter 3 ─────────
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
];
