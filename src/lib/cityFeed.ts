/** Leonida city feed for the LED ticker: made-up traffic, weather, scanner and radio lines in the
 *  game's world. A fresh mix every day (seeded by the date, so everyone sees the same board). */
const TRAFFIC = [
  "I-95 into Vice City: bumper to bumper past the Tequesta exit",
  "Causeway to Starfish Island slow. A Pegassi is parked across two lanes",
  "Ocean Drive closed to cars for a beach event until midnight",
  "Overseas Highway through the Keys: clear and fast, watch for gators on the shoulder",
  "Port Gellhorn bridge reopens after a jackknifed trailer",
  "Little Cuba: double-parked lowriders on Calle Ocho, expect delays",
  "Airport loop at VCIA backed up. Ride-share pickups moved to level 2",
  "Kelly County: tractor convoy on the 41, average speed 19 mph",
  "Downtown Vice City: every light on Biscayne turning red at once. Again",
  "Grassrivers airboat traffic heavy near the visitor centre",
];
const WEATHER = [
  "Vice City 86°F, sunny, humidity 'yes'",
  "Afternoon storms over the Grassrivers. Tie down your airboat",
  "Keys: flat water, 9 mph breeze, perfect jet ski weather",
  "Heat advisory in Port Gellhorn. Stay hydrated, stay out of the swamp",
  "Mount Kalaga: cooler up top, 71°F and clear",
  "Tropical wave far out in the Gulf. Nothing to worry about yet",
  "Leonida sunset at 5:31pm. Ocean Drive will be packed",
];
const SCANNER = [
  "VCPD scanner: speedboat chase off Washington Beach, units responding",
  "Sheriff's office: report of a man wrestling an alligator for a sandwich in Kelly County",
  "VCPD: jewelry store alarm in Downtown, the suspects left on a scooter",
  "Scanner: a flamingo is blocking the drive-thru at Cluckin' Bell",
  "Leonida Highway Patrol: speed trap on the Overseas Highway near Key Lento",
  "VCPD: noise complaint at a yacht party, Rialto Islands. Third one tonight",
  "Scanner: shopping cart stampede reported at a Port Gellhorn supermarket",
  "Sheriff: fireworks over the Grassrivers, nobody admits to buying them",
];
const CITY = [
  "Real estate: a Starfish Island mansion just sold for $42M, cash",
  "Swamp-league softball: the Port Gellhorn Gators win again in front of 300 fans",
  "Hamlet Correctional visiting hours extended this weekend",
  "Rusty Anchor happy hour starts at 4. It's always 4 somewhere in the Keys",
  "New BuckMe feature: round up your change into Family Savings",
  "Lifeinvader is down again. Leonida is going outside",
  "Fishing report: snapper biting off the Shoeless Keys",
];

function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
function pick<T>(list: T[], n: number, r: () => number) { const a = [...list]; const out: T[] = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; }

/** Today's lines, labelled. Same for everyone on the same (Toronto) day. */
export function cityFeed(now = new Date()): string[] {
  const day = Number(now.toLocaleDateString("en-CA", { timeZone: "America/Toronto" }).replace(/-/g, ""));
  const r = rng(day);
  return [
    ...pick(TRAFFIC, 2, r).map((t) => `Leonida traffic: ${t}`),
    ...pick(WEATHER, 1, r).map((t) => `Weather: ${t}`),
    ...pick(SCANNER, 2, r),
    ...pick(CITY, 1, r),
  ];
}
