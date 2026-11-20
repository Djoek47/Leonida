/** GTA VI cheat codes (PS5 and Xbox Series X|S), from GTABase, rewritten by our team.
 *  `code` uses U D L R for D-pad presses; empty means the code isn't confirmed yet. */
export type CheatCat = "player" | "weapons" | "wanted" | "vehicles" | "world" | "filters";
export type Cheat = { name: string; cat: CheatCat; code: string; unlock: string };

export const CHEAT_CATS: { id: CheatCat; label: string; icon: string }[] = [
  { id: "player", label: "Player", icon: "♥" },
  { id: "weapons", label: "Weapons", icon: "✛" },
  { id: "wanted", label: "Wanted level", icon: "★" },
  { id: "vehicles", label: "Vehicles", icon: "◆" },
  { id: "world", label: "World", icon: "☀" },
  { id: "filters", label: "Filters", icon: "◐" },
];

export const CHEATS: Cheat[] = [
  { name: "$250,000", cat: "player", code: "URDLULDR", unlock: "Finish the story" },
  { name: "Unlimited Focus", cat: "player", code: "DUUDUDUDUR", unlock: "Finish the story" },
  { name: "Body Armor", cat: "player", code: "DULUUUUUDD", unlock: "100 workouts" },
  { name: "Parachute", cat: "player", code: "", unlock: "50 skydives or BASE jumps from 300 ft or higher" },
  { name: "No Fall Damage", cat: "player", code: "", unlock: "Survive a 40-ft drop 20 times" },
  { name: "Max Ammo", cat: "weapons", code: "DURDLLUUDL", unlock: "25 bronze or better at shooting ranges" },
  { name: "Infinite Ammo", cat: "weapons", code: "DURDLLUDDD", unlock: "25 silver or better at shooting ranges" },
  { name: "No Reload", cat: "weapons", code: "DURDLLUDDU", unlock: "25 golds at shooting ranges" },
  { name: "Attack Force", cat: "weapons", code: "DULLRDDUD", unlock: "Finish the story" },
  { name: "Exploding Balls", cat: "weapons", code: "DULLRDDUR", unlock: "Hit 20 enemies with explosives" },
  { name: "Raise Heat Level", cat: "wanted", code: "LDRDUDU", unlock: "Lose a 3-star wanted level 25 times" },
  { name: "Raise Wanted Level", cat: "wanted", code: "LDRDURU", unlock: "Lose a 3-star wanted level 50 times" },
  { name: "Vehicle Force", cat: "vehicles", code: "DULLRDLUD", unlock: "25 kills with a vehicle" },
  { name: "Maibatsu Boomazoom", cat: "vehicles", code: "LURDLLUL", unlock: "5 Shopping challenges" },
  { name: "MTL Pumper fire truck", cat: "vehicles", code: "LURDLRRU", unlock: "Discover it in the Progress menu" },
  { name: "HVY Bulldozer", cat: "vehicles", code: "LURDLRRD", unlock: "Discover it in the Progress menu" },
  { name: "Rhino Tank", cat: "vehicles", code: "", unlock: "Finish every Survival challenge" },
  { name: "Lazer jet", cat: "vehicles", code: "", unlock: "Finish every challenge" },
  { name: "Repair Vehicle", cat: "vehicles", code: "", unlock: "Win 10 races at Gellhorn Raceway, the Thrillbilly Mud Club and Boone Speedway" },
  { name: "Unlimited Nitrous", cat: "vehicles", code: "", unlock: "Land 50 stunt jumps" },
  { name: "Inflatable Flamingo", cat: "vehicles", code: "", unlock: "Destroy 50 cocaine flamingos" },
  { name: "Cycle Weather", cat: "world", code: "DRUDRUR", unlock: "Finish the story" },
  { name: "Move time forward", cat: "world", code: "", unlock: "Find 10 collectible watches" },
  { name: "Pause time", cat: "world", code: "", unlock: "Find 20 collectible watches" },
  { name: "Cataclysm filter", cat: "filters", code: "DDURRULLRR", unlock: "Discover Martha's Vamos in the Progress menu" },
  { name: "Dollhouse filter", cat: "filters", code: "DDURRULLDR", unlock: "8 hours with your partner" },
  { name: "Faded Glory filter", cat: "filters", code: "DDURRULLLR", unlock: "Rob 50 stores with your partner" },
  { name: "Golden Hour filter", cat: "filters", code: "", unlock: "4 hours holding hands" },
  { name: "Fisheye filter", cat: "filters", code: "", unlock: "Catch 100 fish" },
  { name: "Hellscape filter", cat: "filters", code: "", unlock: "Steal 100 cop cars" },
];

export const CHEAT_RULES = [
  { k: "Unlock first", t: "Each cheat has its own task. Until it's done, the code does nothing." },
  { k: "Trophies off", t: "Any cheat switches off trophies and achievements until you quit." },
  { k: "No saving", t: "Saving is blocked while a cheat is on. Save first, then play." },
  { k: "Story only", t: "Cheats don't work online." },
];
export const CHEAT_TOTAL = 61;
