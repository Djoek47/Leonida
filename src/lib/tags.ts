/** Clip tags. A clip carries at most three — the limit is enforced in the database,
 *  not just the form. Grouped so the picker stays navigable. */

export type TagGroup = { group: string; blurb: string; tags: string[] };

export const TAG_GROUPS: TagGroup[] = [
  {
    group: "Action",
    blurb: "Shooting, chases, mayhem",
    tags: [
      "Action", "Shootout", "Chase", "Heist", "Robbery", "Getaway", "Five Star",
      "Police Escape", "Takedown", "Sniper", "Explosion", "Ambush"],
  },
  {
    group: "Driving",
    blurb: "Anything with wheels, wings or a hull",
    tags: [
      "Driving", "Stunt", "Jump", "Drift", "Race", "Near Miss", "Crash", "Flip",
      "Motorcycle", "Boat", "Plane", "Helicopter", "Offroad"],
  },
  {
    group: "Funny",
    blurb: "The clips people send their friends",
    tags: [
      "Funny", "Fail", "Ragdoll", "Glitch", "Physics", "Timing", "Chaos", "Prank", "Troll",
      "Unlucky", "Perfectly Cut", "Wholesome"],
  },
  {
    group: "NPC",
    blurb: "Leonida's residents doing their thing",
    tags: [
      "NPC", "NPC Reaction", "Crowd", "Pedestrian", "Street Life", "Argument", "Bystander",
      "Cop Behaviour", "Animal", "Alligator"],
  },
  {
    group: "Dangerous",
    blurb: "Close calls and bad ideas",
    tags: [
      "Dangerous", "Accident", "Close Call", "Near Death", "Survival", "Wipeout",
      "High Fall", "Fire", "Storm", "Hurricane"],
  },
  {
    group: "Scary",
    blurb: "Dark corners of the state",
    tags: [
      "Scary", "Horror", "Creepy", "Mystery", "Easter Egg", "Secret", "Paranormal",
      "Night", "Abandoned"],
  },
  {
    group: "Money",
    blurb: "Making it, moving it, losing it",
    tags: [
      "Economics", "Money", "Big Score", "Business", "Hustle", "Investment", "Property",
      "Market", "Payday", "Grind"],
  },
  {
    group: "Educational",
    blurb: "Clips that teach something",
    tags: [
      "Educational", "Tutorial", "Tips", "Guide", "Speedrun", "Strategy", "Mechanics",
      "Hidden Feature", "Meta", "Breakdown"],
  },
  {
    group: "Scene",
    blurb: "Where and when it happened",
    tags: [
      "Vice City", "Leonida Keys", "Port Gellhorn", "Ambrosia", "Grassrivers",
      "Mount Kalaga", "Beach", "Downtown", "Everglades", "Golden Hour", "Sunset", "Rain"],
  },
  {
    group: "Style",
    blurb: "How it was shot or played",
    tags: [
      "Cinematic", "Photo Mode", "Slow Motion", "First Person", "Montage", "Roleplay",
      "Fashion", "Customisation", "Soundtrack", "Reaction"],
  },
  {
    group: "Story",
    blurb: "Jason, Lucia and the people around them",
    tags: [
      "Story", "Romance", "Jason", "Lucia", "Cutscene", "Dialogue", "Betrayal",
      "Emotional", "Plot Twist"],
  },
  {
    group: "Flagged",
    blurb: "Marked so viewers can opt out. Staff check every one.",
    tags: [
      "NSFW", "Gore", "Strong Language", "Sensitive"],
  },
];

export const ALL_TAGS: string[] = TAG_GROUPS.flatMap((g) => g.tags);
export const MAX_TAGS_PER_CLIP = 3;

/** Tags that hide a clip behind a warning until the viewer opts in. */
export const FLAGGED = new Set(TAG_GROUPS.find((g) => g.group === "Flagged")!.tags);
export const slugTag = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
