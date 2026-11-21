/** Who's who in GTA VI, beyond the eight Rockstar showed before launch.
 *  `ch` is the chapter you first meet them (0 = Prologue), from our mission list; `promo` marks
 *  people Rockstar revealed in trailers, so they're never treated as spoilers. Voice actors from
 *  the in-game credits as reported by GamesRadar and OutputLag. */
/** `img`: a picture in public/media/cast/<img>.webp, once we have one. */
export type CastMember = { name: string; role: string; met: string; ch: number; actor?: string; promo?: boolean; with?: string; img?: string };

export const CAST: CastMember[] = [
  { name: "Tomás", role: "Lucia's son, taken into care after her arrest", met: "Prologue", ch: 0 },
  { name: "Donnie", role: "Brian's pilot, drops packages from the air", met: "Gone Fishing", ch: 1, actor: "Brad Carter" },
  { name: "Lori Heder", role: "Brian's wife, runs the boat yard with him", met: "Coming Home", ch: 1, actor: "Orlagh Cassidy", with: "Brian Heder" },
  { name: "Joey", role: "Runs Coastal Auto Care, fixes and delivers cars", met: "Just a Scratch", ch: 1 },
  { name: "Mandy", role: "Brian's tenant, behind on rent", met: "Pipework", ch: 1 },
  { name: "Arnold", role: "Brian's broker, and a choice you'll have to make", met: "Hey Arnold!", ch: 1 },
  { name: "Kenton Rees", role: "Treasure hunter on Key Lento who buys your finds", met: "Island Dreams", ch: 1, actor: "Machel Montano" },
  { name: "Andy", role: "Lucia's friend, keeps her clothes while she's inside", met: "Coming Home", ch: 1, actor: "Mallory Wu" },
  { name: "Mattia Tauro", role: "Throws the yacht party and brings a job", met: "Day Release", ch: 1, actor: "Massi Pregoni" },
  { name: "Kat Rosselli", role: "Brings the job with Mattia", met: "Day Release", ch: 1, actor: "Edwina Rai" },
  { name: "Vicki", role: "Lucia's neighbour at the Port Gellhorn motel", met: "Girls' Trip", ch: 2, actor: "Taryn Manning" },
  { name: "Dunk", role: "Vicki's friend, and later a fence", met: "Girls' Trip", ch: 2, actor: "Brad Fleischer" },
  { name: "Moses \"Mo\" Watkins", role: "Car booster who registers stolen cars", met: "Moses", ch: 2, actor: "Aaron Morton" },
  { name: "Mia Caminos", role: "Lucia's mother, in real estate in Hamlet", met: "Mami Knows Best", ch: 3 },
  { name: "Tyrone Russo", role: "Dealer at Imperial Plaza, best price for narcotics", met: "Dealer's Choice", ch: 3 },
  { name: "Roxy", role: "One half of Real Dimez", met: "Top Billing", ch: 3, actor: "Krissy Celess", promo: true, with: "Real Dimez" },
  { name: "Bae-Luxe", role: "The other half of Real Dimez", met: "Top Billing", ch: 3, actor: "Hood Brat", promo: true, with: "Real Dimez" },
  { name: "DWNPLY", role: "Rival rapper who once had a hit with Real Dimez", met: "Top Billing", ch: 3, actor: "Denzel Curry" },
  { name: "Karim", role: "Raul's tech man: alarms, cameras, comms", met: "Credit Check", ch: 3 },
  { name: "Andrea", role: "Runs the cons for Raul's crew", met: "Credit Check", ch: 3 },
  { name: "Valentina", role: "Moves Raul's money through shell companies", met: "Credit Check", ch: 3, actor: "Josephine Phoenix" },
  { name: "Nicole Park", role: "The security specialist the crew needs", met: "Security Expert", ch: 3, actor: "Sierra Katow" },
  { name: "Andrés de León", role: "Businessman you guard at Mega Mundo's opening", met: "Party Hard", ch: 4, actor: "J. Eddie Martinez" },
  { name: "Pilot Pete", role: "Runs timed air drops out of Wild Hog", met: "Pool Day", ch: 4, actor: "Carl Palmer" },
  { name: "Felipe", role: "Owes Andrea money, and has a car worth keeping", met: "Bad Driver!", ch: 4, actor: "Alfredo Diaz" },
];

/** The eight Rockstar showed before launch: actor credits for their cards. */
export const LEAD_ACTORS: Record<string, string> = {
  jason_duval: "Dylan Rourke", lucia_caminos: "Manni L. Perez", cal_hampton: "Bobby Moynihan", brian_heder: "Stephen Root",
  drequan_priest: "Naiqui Macabroad", real_dimez: "Krissy Celess and Hood Brat",
};
