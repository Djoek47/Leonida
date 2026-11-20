/** Leonida's five counties and their named places, from PowerPyx's full in-game map page.
 *  `ch` is the chapter where the story first takes you there. Map positions come from the
 *  GTADB landmark data (places.json) or, for a few labels, from the GTADB base map itself (PINS);
 *  anything we can't place yet is listed under its county until our crew logs it. */
export type County = { id: string; name: string; where: string; ch: string; img: string; areas: string[] };

export const COUNTIES: County[] = [
  { id: "mariana", name: "Mariana County", where: "The south: the Keys, swamps and Capri", ch: "Chapter 1", img: "places/leonida_keys_2",
    areas: ["Mile Zero Air Station", "Southwind", "Riquezas Keys", "Permit Keys", "Maroon Key", "Abismo Key", "Leonida Bay", "Key Lento", "Gambit Bay", "Shoeless Keys", "Corsair Key", "Peregrine Bay", "Leonida Straits", "Pelican Valley", "Cottonmouth Lake", "Wetman Bay", "Gullet Marsh", "Pelican River", "Watson Bay", "Bobcat Key", "Grassrivers", "Tola Bay", "Capri", "Tortoise Lake", "Capri Sound", "Belpoint", "Gulf of Leonida", "Nehrling River"] },
  { id: "vicedale", name: "Vice-Dale County", where: "Vice City, the beaches and the airport", ch: "Chapters 3–4", img: "places/vice_city_2",
    areas: ["Hamlet", "VCIA", "Southside", "Peacock Bay", "Tequesta", "Downtown", "Little Cuba", "Salton", "Rockridge", "Crosstown", "Bayside", "La Perle", "Balsero", "Stockyard", "Decor District", "Leaf Links", "Rialto Islands", "Starfish Island", "Waxman Island", "Port Vice City", "Catalan Bay", "Catalan Key", "Gloriana Key", "Dalton Island", "Ocean Beach", "Washington Beach"] },
  { id: "kelly", name: "Kelly County", where: "North-west: Port Gellhorn and the Gulf coast", ch: "Chapter 2", img: "places/port_gellhorn_2",
    areas: ["Buckskin Swamp", "Emerald River", "Emerland Springs", "Gellhorn", "Port Gellhorn", "Wild Hog Point", "Borrachero Sound", "Crude Islands", "Sandbars", "Draper Island", "Draper Bay", "Frogswater", "Manifest Canyon"] },
  { id: "leonard", name: "Leonard County", where: "North-east: Waning Sands and Lake Leonida", ch: "Chapter 3", img: "places/grassrivers_4",
    areas: ["Belville", "Waning Sands", "Leith River", "Lake Leonida", "Richard Barebone State Park", "Little Hardin Island"] },
  { id: "lummox", name: "Lummox County", where: "The north: Mount Kalaga and Ambrosia country", ch: "Free roam", img: "places/mount_kalaga_national_park_2",
    areas: ["Zephyr Islands", "Mount Kalaga National Park", "Grayson", "San Malo Bay", "Featherstone Islands", "Bonanza", "Okchioha Bay", "Moreau", "MacAlister Gold Mine", "Saint Attaway Islands", "Hyde Island", "Partridge Bay", "Frampton Islands", "Lake Tallaloko", "Kalaga Reservoir", "Dawson Dam", "Millport"] },
];

/** Colour per county, for the map and the chips. */
export const COUNTY_TONE: Record<string, string> = { mariana: "#00a86b", vicedale: "#ff3d8b", kelly: "#ff8a3d", leonard: "#4bc9ff", lummox: "#c39bff" };

/** Read off the GTADB base map's own labels (world metres). */
export const PINS: Record<string, [number, number]> = {
  "Mount Kalaga National Park": [-3864, 6144],
  "Millport": [-624, 6684],
  "Grassrivers": [-3888, -4112],
};

/** Label-only offsets (metres) so neighbouring county names don't sit on each other. */
const NUDGE: Record<string, [number, number]> = { kelly: [-900, -300], leonard: [900, 300] };

type Place = [string, string, string, number, number, string, string];

/** Where each named area sits: an exact landmark name, else the average of landmarks filed under it. */
export function locate(places: Place[]) {
  const at = new Map<string, [number, number]>();
  for (const c of COUNTIES) for (const a of c.areas) {
    if (PINS[a]) { at.set(a, PINS[a]); continue; }
    const exact = places.find((p) => p[1] === a);
    if (exact) { at.set(a, [exact[3], exact[4]]); continue; }
    const hits = places.filter((p) => p[2].split(",").map((s) => s.trim()).includes(a));
    if (hits.length) at.set(a, [hits.reduce((s, p) => s + p[3], 0) / hits.length, hits.reduce((s, p) => s + p[4], 0) / hits.length]);
  }
  // County label: centre of its placed areas plus landmarks filed under the county itself.
  const centre = new Map<string, [number, number]>();
  for (const c of COUNTIES) {
    const pts = c.areas.map((a) => at.get(a)).filter(Boolean) as [number, number][];
    places.filter((p) => p[2].split(",").map((s) => s.trim()).includes(c.name)).forEach((p) => pts.push([p[3], p[4]]));
    const [nx, ny] = NUDGE[c.id] ?? [0, 0];
    if (pts.length) centre.set(c.id, [nx + pts.reduce((s, p) => s + p[0], 0) / pts.length, ny + pts.reduce((s, p) => s + p[1], 0) / pts.length]);
  }
  return { at, centre };
}
