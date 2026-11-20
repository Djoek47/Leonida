/** Every GTA VI story mission and Strangers mission, by chapter.
 *
 *  Compiled from community guides (GTABase mission and Strangers lists, Nov 2026) and rewritten
 *  in our own words. Mission names are as they appear in game; objectives are short and
 *  spoiler-light on purpose. The Mission Briefing page decides how much of this a member sees,
 *  based on the chapter they say they're on.
 *
 *  Line format: "number|Name|who|flags|objective"
 *    number  story order ("" for optional ones)
 *    who     J = Jason, L = Lucia, B = both, "" = not confirmed yet
 *    flags   o = optional, m = missable, h = heist / heist setup
 */

export type Who = "J" | "L" | "B" | "";
export type Mission = { n: number | null; name: string; who: Who; optional: boolean; missable: boolean; heist: boolean; goal: string };
export type Stranger = { name: string; giver: string; where: string | null; goal: string };
export type Chapter = { id: number; label: string; title: string; missions: Mission[]; strangers: Stranger[]; tips: string[] };

const parse = (t: string): Mission[] =>
  t.trim().split("\n").map((l) => {
    const [n, name, who, f, goal] = l.trim().split("|");
    return { n: n ? Number(n) : null, name, who: who as Who, optional: f.includes("o"), missable: f.includes("m"), heist: f.includes("h"), goal };
  });
const strangers = (t: string): Stranger[] =>
  t.trim().split("\n").map((l) => {
    const [name, giver, where, goal] = l.trim().split("|");
    return { name, giver, where: where || null, goal };
  });

export const CHAPTERS: Chapter[] = [
  {
    id: 0, label: "Prologue", title: "Prologue",
    missions: parse(`
      1|Prologue|L||Lucia sits down with a prison counselor about her case and an early way out.`),
    strangers: [],
    tips: ["Short and story-only. Nothing to miss here."],
  },
  {
    id: 1, label: "Chapter 1", title: "Just Like Paradise",
    missions: parse(`
      2|Gone Fishing|J||A smuggling run in the Keys goes sideways in Kingfishers territory.
      3|Gear Up|J||Pick up a new long gun at Ammu-Nation.
      4|Unwanted Attention|J||Get Brian's money back out of the Hamlet police impound, with Cal.
      5|Lab Fees|J||Collect rent from a gift shop that isn't only a gift shop.
      6|Pipework|J||Collect rent from Mandy and fix up her place.
      7|Just a Scratch|J||Get the dented Ganado to Joey for repairs.
      |Get Shirley's Rum|J|om|Pick up a bottle of rum for Shirley.
      |Steal the Scooter|J|om|Help Shirley with her mobility-scooter scheme.
      10|Hey Arnold!|J||Find Brian's broker, Arnold.
      11|Island Dreams|J||Take a bachelor party diving to a wreck.
      12|Feng Shui|J||Get the house in order before Lucia gets out.
      |Pick Up Groceries|J|o|Stock the fridge before Lucia's home.
      |Buy Flowers|J|o|Have flowers sent for Lucia.
      |Buy Lucia a Necklace|J|o|Buy her a necklace at The Siren's Chest.
      |Get The Chop|J|o|Haircut or beard tidy-up at Barnacle Beauties.
      |Get Lucia's Clothes|J|o|Collect Lucia's clothes from Andy at Manatee's Rest.
      13|Coming Home|J||Pick Lucia up from Hamlet Correctional.
      14|Clean Up After Donnie|J||Recover a lost package near a Hamlet fishing spot.
      15|Buck Me|J||Meet Lucia at Fleeca and set up her BuckMe account.
      16|Down to Earth|J||Head to the marina for Brian's next job.
      |Find the Lost Drugs|J|o|Search four swamp spots for lost packages.
      17|Deposit Cash Into BuckMe|J||Put cash in the bank at any ATM.
      18|Save for the Future|J||Hit the next Family Savings goal.
      19|Day Release|B||A night out with Kat and Mattia, starting at the Rusty Anchor.
      |Clock Out|J|o|Get Lucia home before 4pm.
      20|Clear Skies|J||Start Brian's job with Donnie in Southwind.
      21|Building a Life|J||Work on the new place and give Lucia a gun lesson.
      22|Swamped|J||Meet Brian at the marina, then the Kingfishers.
      23|Don Gone|J||Clear out Donnie's trailer in Key Lento.
      |Donnie's Lost Drugs|J|o|Recover the stash from Donnie's boat off Corsair Key.
      25|Recalibration|B||Try to lift Cal's mood.
      26|Tourist Trap|B||Take a simple job from Mattia that could lead somewhere.
      27|Home Sweet Home|L||Grab Jason's things before leaving town.
      28|Discharge Time|B||Lucia goes to Vice City Hospital and walks into trouble.`),
    strangers: strangers(`
      Search for the Skunk Ape|Kirk|Leonida wilds|Dig up what you can on the Skunk Ape.
      Search for Tree Effigies|Kirk|Pelican Valley|Find carved tree effigies on the trail of Mr. Mangrove.
      Help Kirk Find Mr. Mangrove|Kirk|Cottonmouth Lake|Join Kirk's hunt for Mr. Mangrove.`),
    tips: [
      "Point of no return: Tourist Trap. Starting it wipes your pocket cash, checking balance, the floorboard stash, the Key Lento house and your personal vehicles.",
      "Before Tourist Trap, put up to $5,000 into Family Savings. That is the only money that carries over.",
      "Get Shirley's Rum and Steal the Scooter can be missed for good. Do them when Shirley offers.",
      "Fences unlock here: Brian after Lab Fees, Donnie after Clean Up After Donnie. Both pay low rates.",
    ],
  },
  {
    id: 2, label: "Chapter 2", title: "Paradise Lost",
    missions: parse(`
      29|What's in the Bag?|L||Wake up at the Port Gellhorn motel and look in the bag.
      30|Ambulance Chaser|L||Dump the hospital ambulance.
      31|Play Nurse|L||Look after Jason until he's back on his feet.
      32|Overnight Charges|L||Find out what the room costs at the front desk.
      33|Just Moved In|L||Pick up supplies at the Alpha convenience store.
      34|Girls' Trip|L||Ask around the motel for painkillers.
      |Pick Up a Gun|L|o|Buy a gun or grab one from your locker.
      35|Moses|L||Bring a low-key car to Moses's shop.
      36|New Look|L||New hairstyle at Pearl House.
      37|How Do I Look?|L||Buy Lucia new clothes.
      38|Got Pills?|L||Wait on Dunk's painkiller lead.
      39|Daily Driver|L||Repo an '82 Canis Crawler for Moses.
      40|Behind on Payments|L||Clear the motel debt to get the necklace back.
      41|Slam Dunk|L||Visit Dunk's trailer about something stronger.
      42|Breakfast Run|L||Back to the motel to check on Jason.
      43|Coffee Break|B||Plan the next move over coffee.
      |Thrillbillies|B|o|Race for prize money at the Thrillbilly Mud Club.
      |Twist Wrist, Smash, Grab|B|o|Ride along on a job with Billy's crew.
      |Hit Avery Pawn|B|o|Rob Avery Pawn.
      |Hit Kingpin Bowling|B|o|Hit the bowling alley Kolt & Associates took over.
      |Impounded Vehicle|B|o|Get Lucia's car out of impound.
      44|Prepare for Vice City|B||Make at least $15,000 while Dre'Quan finds a place.
      45|Afternoon Delight|B||Help Vicki rob her boss at Delights.
      46|Checking Out|B||Leave the motel and meet Dre'Quan in Vice City.`),
    strangers: strangers(`
      Check Out McKittrick Farm|Kyle|McKittrick Farm|Find Kyle about a pilot job.
      Collect Chemicals for Kyle|Kyle||Pick up chemicals for a crop-spraying run.
      Thrillbillies|Billy|Thrillbilly Mud Club|Mud racing for prize money.
      Twist Wrist, Smash, Grab|Billy||Be the extra rider on Billy's job.
      Veteran Hunted|Bret Vogel|Near Mount Kalaga|Help Bret with his hunting business (Jason).
      Steal Vehicles for Moses|Moses||Work through Moses's list of cars to steal.
      Bret's Hunting Decks|Bret Vogel||Take on Bret's new hunting challenge.`),
    tips: [
      "From Coffee Break on you can switch between Jason and Lucia and give your partner orders.",
      "Prepare for Vice City needs $15,000. Avery Pawn, Kingpin Bowling and Billy's jobs are the quickest way to get there.",
      "Fences: Dunk after Slam Dunk (low prices), Moses after Moses (cars only, no trackers, not stolen near his garage).",
    ],
  },
  {
    id: 3, label: "Chapter 3", title: "Tits Ass Drug Money",
    missions: parse(`
      47|Welcome to Vice City|B||Look up Dre'Quan.
      48|Dealer's Choice|J||Run a deal with Dre'Quan for Boobie.
      49|Meet the Heders|B||Double date with Brian and Lori Heder.
      50|Dubious Provenance|B||Take the statue to an antique store in Capri.
      51|Mami Knows Best|L||Catch up with Mia.
      |Get Your Wheels||o|Get yourself a car in Vice City.
      52|South Leonida Real Estate|L||Meet Mia again and run into M7.
      53|Tyrone|J||See Tyrone about work.
      54|Here, Kitty Kitty|J||Visit Tyrone and look for Charles.
      55|Send Money to Lorena|||Send Lorena some money.
      56|Encrypted Hard Drive|||Find out what's on the encrypted drive.
      57|Car Service|L||Steal a car for Raul.
      58|Send More Money to Lorena|||Send Lorena another payment.
      59|Top Billing|B||See the Real Dimez in concert.
      60|Boobie Time|J||Drive Boobie around Vice City.
      |Yasmani's Jewelry Jobs|B|o|Hit jewelry stores and sell the take to Yasmani.
      61|First Impressions|B||Meet Raul.
      62|Caught Slipping|B||Stop a burglary.
      63|Crosstown Traffic|B||Tail a gang member for Raul.
      64|Credit Check|B||Meet Raul's crew at his base.
      65|Steal the Zorrusso for Randy|B||Steal a high-end Zorrusso.
      66|Raul's Next Job|||Hear Raul out on the next job.
      |Race Against Yago|J|om|Race Yago against the clock.
      67|Sinfrontera National Bank|B|h|Scope out the bank.
      68|Security Expert|B|h|Meet someone who knows the bank's security.
      69|Heist Planning||h|Go over the plan.
      70|Ride or Die|J||Help Dre'Quan.
      71|Company Property|B||Help Brian with a weapons shipment.
      72|The Missing Link|B||Lucia meets Andrea; the trail leads somewhere ugly.
      73|Safe Word|B|h|Steal a practice safe and learn to crack it.
      74|Cooties|L||Help shoot a music video.
      75|Bricked Up|B||Work for Boobie.
      76|Hidden Charges|B|h|Get the explosives ready.
      77|The Cartel Heist|B|h|Hit the bank.`),
    strangers: strangers(`
      Join a Street Race|Yago|Salton|Race the Hit 'n' Run crew for cash.
      Bumper to Bumper|Yago||Show Yago the ropes (Jason).
      Buddy?|Kyle||Check in on Kyle.
      Mall Rats|Billy||Another job with Billy's crew.
      Brother to Brother|Yago||Back Yago up (Jason).
      The Impaler|Billy|Police impound|Pull a specific car out of impound.
      Hometown Heroes|Billy||Billy's biggest job yet.
      Climbing the Cellerichain|Andy||Deliver products for Cellerica.
      Pay the Cellerica Fee|Andy||Pay Lucia's initiation fee.
      Peach!|Andy|Cellerica campus|Finish Lucia's Cellerica initiation.
      Read the Label|Andy||Bring back one of Cellerica's stolen vans.
      Puff Puff Pass|Andy|Paper Boys warehouse|Sort out a problem for Cecilia.
      Yasmani's ATM Jobs|Yasmani||A run of ATM jobs.
      Yasmani's Payday Loans Jobs|Yasmani||Hit Payday Loans stores.
      Tail the Security Van|Yasmani||Follow a security van to where it's going.
      Randy's Wish List|Randy||Fill Randy's list of cars.
      Take Out Kitty Litter|Tyrone|Vice City|Shut down the Kitty Litter labs.
      Spin On This|Tyrone||Take down the main synthetics operation (Jason).
      Dunk's Robbery Tips|Dunk||Rob the places Dunk points you to.`),
    tips: [
      "Story heists can't be replayed. Save manually before Sinfrontera National Bank and before The Cartel Heist.",
      "Best fences arrive here: Tyrone for narcotics (after Here, Kitty Kitty), Yasmani for jewelry and marked bills (after Boobie Time), Randy for high-end cars (after the Zorrusso job).",
      "Credit Check unlocks the Dye Pack Jammer. You need it to fence marked bills from banks and Payday Loans.",
      "Race Against Yago can be missed for good.",
    ],
  },
  {
    id: 4, label: "Chapter 4", title: "Vice City, Baby",
    missions: parse(`
      78|Ocean Beach|B||Set up shop in Ocean Beach.
      79|Another Life|L||Lucia looks back.
      80|Pool Day|||A day at the pool.
      81|Company Cars|B||Pick up new vehicles.
      82|Lawyer Up|B||Meet the lawyer, Abe Gonzalez.
      83|It's a Date!|||Date night.
      84|Party Hard|B||Personal security for a celebrity.
      85|Heavy Lifting|B||Make a delivery.
      86|Pay Abe's Fee|||Settle Abe's fee.
      87|Photo/Shoot|B||Shoot a promo.
      |Bad Driver!||o|Track down Felipe.
      88|Making Gainz|L||Hear Raul's plan and meet someone new.
      89|Blood Sweat and Gear|L||Hit the gym.
      90|Watch It|J||Meet a club owner with Dre'Quan.
      91|Call Nate|L||Call Nate.
      92|Cash Injections|L||Help an associate with Nate.
      93|Amateur Hour|L||Back Cisco up with a director.
      94|Dirty Work|B||Deal with Raina.
      95|Nate Will Be in Touch|||Help Kordell's crew while you wait.
      96|Too Much Baggage|J|h|Scope out the airport and handle the baggage.
      97|Adventures in Babysitting|J||Nightclub security for Andrés.
      98|Rafa|J||Deal with Rafa.
      99|Fresh Evidence|J||Get the blackmail material back with Dre'Quan.
      100|Power Play|||Help Kordell's crew and gather intel.
      101|Child's Play|B||Help out an acquaintance.
      |This Is a Free Call From…|L|om|Pick someone up on time.
      102|Headliners|B||Help with the Dimez's VYB launch party.
      103|Close Surveillance|J||Spy-drone work on some bodybuilders.
      104|Delivery Method|J||Go undercover to help Andrea.
      105|Team Building|L||Meet Kordell and prove herself.
      106|Fully Catered|B|h|Steal a catering truck.
      107|Heist Plans in Place||h|Get everything set for the airport job.
      108|VCIA Takedown|B|h|The airport heist.
      109|Tie Up Loose Ends|||Clean up after the job.
      |That's Where the Money Is…||o|Wait at the café for someone.
      110|Call Valentina Back|||Return Valentina's call.
      111|Sunset|B||Look for answers.
      112|Starting From Zero|||Last mission of Chapter 4.`),
    strangers: strangers(`
      Attend Eddie Acosta's Party|Eddie Acosta||Go to Eddie's party (you meet him at Pool Day).
      The Last Mile: Passing the Torch|Pilot Pete||Fly Pete's plane and make his drops (Jason).
      The Last Mile: Backseat Pilot|Pilot Pete|Wild Hog Airfield|Another round of drops (Jason).
      Pete's Deliveries: Southpoint Airfield|Pilot Pete|Mariana County|Airdrops starting in Mariana County (Jason).
      Pete's Deliveries: Avery Allen & Co.|Pilot Pete|Kelly County|Drops starting in Kelly County (Jason).
      Deliver Packages|Pilot Pete|Leonard County|Pete's last delivery run (Jason).`),
    tips: [
      "BuckMe Premium is granted when the chapter starts: $2,000,000 checking limit and 10% off liveries.",
      "Save manually before VCIA Takedown. Heists can't be replayed.",
      "This Is a Free Call From… can be missed for good. Take the call when it comes.",
    ],
  },
  {
    id: 5, label: "Chapter 5", title: "Top of the World, Ma",
    missions: parse(`
      113|Bird in the Hand|B||Boost a new ride.
      114|Taking Liberties|||A new plan comes together.
      115|VC Baby|||Help Mattia.
      116|Doggie Bag|||Meet Vinny and go after the contraband.
      117|Operation Savage Glory|||Recover a valuable shipment.
      118|Honest Abe|||Work out a deal with Abe.
      119|Unfinished Business|||Finish what was left open.
      120|Pay Abe's Fee|||Pay Abe for his help.
      121|Protective Custody|B||Meet Abe and work together.
      122|The End of the Road|||The final mission.`),
    strangers: [],
    tips: [
      "Save to a spare slot before The End of the Road. There's no mission replay, so that save is your only way back.",
      "Finishing the story unlocks the $250,000 money cheat.",
    ],
  },
];

export const WHO: Record<Who, string> = { J: "Jason", L: "Lucia", B: "Jason & Lucia", "": "TBC" };
export const MISSION_SOURCES = [
  { label: "GTABase: GTA 6 missions", href: "https://www.gtabase.com/gta-6/missions/" },
  { label: "GTABase: Strangers missions", href: "https://www.gtabase.com/gta-6/strangers-missions/" },
];
