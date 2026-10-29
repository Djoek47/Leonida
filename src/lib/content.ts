// Static Leonida content, built from Rockstar's official press kit (rockstargames.com/VI).
// Update this file whenever Rockstar publishes new information.

export const LAUNCH = "2026-11-19T00:00:00-05:00"; // PS5 & Xbox Series X|S

export const regions = [
  { slug: "vice_city", name: "Vice City", shots: 12, blurb: "Neon, money and beachfront excess — the heart of Leonida and the state's biggest stage for a getaway." },
  { slug: "leonida_keys", name: "Leonida Keys", shots: 6, blurb: "A chain of islands strung along one highway: boats, bridges and very few ways out." },
  { slug: "grassrivers", name: "Grassrivers", shots: 6, blurb: "Swamp country. Airboats, gators and the kind of quiet that hides things." },
  { slug: "port_gellhorn", name: "Port Gellhorn", shots: 6, blurb: "A faded resort town on the panhandle, held together by motels and strip malls." },
  { slug: "ambrosia", name: "Ambrosia", shots: 6, blurb: "Sugar refineries, biker clubs and small-town industry inland." },
  { slug: "mount_kalaga_national_park", name: "Mount Kalaga", shots: 6, blurb: "Leonida's northern wilderness: trails, hunting grounds and backroads." },
] as const;

export const people = [
  { slug: "jason_duval", art: null, name: "Jason Duval", shots: 10, video: "jason_duval_video_clip", line: "Grew up around grifters, served in the Army, then ran with couriers in the Keys." },
  { slug: "lucia_caminos", art: null, name: "Lucia Caminos", shots: 10, video: "lucia_caminos_video_clip", line: "Taught to fight by her father. Fresh out of Leonida Penitentiary, with Jason beside her." },
  { slug: "cal_hampton", art: "cal_hampton", name: "Cal Hampton", shots: 4, video: "cal_hampton_video_clip", line: "Jason's friend and partner in work. Happiest at home, listening in on the Coast Guard." },
  { slug: "boobie_ike", art: "boobie_ike", name: "Boobie Ike", shots: 4, video: "boobie_ike_video_clip", line: "Vice City legend. Real estate, a strip club, a record label." },
  { slug: "drequan_priest", art: "drequan_priest", name: "DreQuan Priest", shots: 4, video: "drequan_priest_video_clip", line: "Boobie's partner at Only Raw Records, chasing the next big act." },
  { slug: "real_dimez", art: "real_dimez", name: "Real Dimez", shots: 4, video: "real_dimez_video_clip", line: "Local rap duo trying to turn a viral moment into a career." },
  { slug: "raul_bautista", art: "raul_bautista", name: "Raul Bautista", shots: 4, video: "raul_bautista_video_clip", line: "A seasoned bank robber always looking for new talent." },
  { slug: "brian_heder", art: "brian_heder", name: "Brian Heder", shots: 4, video: "brian_heder_video_clip", line: "Old-school drug runner in the Keys, and Jason's landlord." },
] as const;

/** Ultimate Edition & Vintage Vice City Pack items from the official press kit. */
export const garage = [
  { img: "ultimate/grotti_cheetah_01", name: "Grotti Cheetah", kind: "Vehicle", from: "Ultimate Edition" },
  { img: "ultimate/vapid_buggy_01", name: "Vapid Buggy", kind: "Vehicle", from: "Ultimate Edition" },
  { img: "ultimate/vapid_ganado_retro_build_01", name: "Vapid Ganado retro build", kind: "Vehicle", from: "Ultimate Edition" },
  { img: "ultimate/squalo_01", name: "Squalo", kind: "Boat", from: "Ultimate Edition" },
  { img: "ultimate/electric_fang_01", name: "Electric Fang", kind: "Vehicle", from: "Ultimate Edition" },
  { img: "ultimate/stock_305_01", name: "Stock 305", kind: "Vehicle", from: "Ultimate Edition" },
  { img: "ultimate/wyman_car_collection_01", name: "Wyman car collection", kind: "Vehicles", from: "Ultimate Edition" },
  { img: "ultimate/hawk_and_little_morgan_revolvers_01", name: "Hawk & Little Morgan revolvers", kind: "Weapons", from: "Ultimate Edition" },
  { img: "ultimate/weapon_variants_01", name: "Weapon variants", kind: "Weapons", from: "Ultimate Edition" },
  { img: "ultimate/rideout_customs_01", name: "Rideout Customs", kind: "Business", from: "Ultimate Edition" },
  { img: "ultimate/saras_salon_01", name: "Sara's Salon", kind: "Business", from: "Ultimate Edition" },
  { img: "ultimate/one_eyed_willie_01", name: "One-Eyed Willie", kind: "Business", from: "Ultimate Edition" },
  { img: "vintage/pack_vapid_stanier_01", name: "Vapid Stanier", kind: "Vehicle", from: "Vintage Vice City Pack" },
  { img: "vintage/pack_exclusive_looks_01", name: "Vintage looks", kind: "Outfits", from: "Vintage Vice City Pack" },
  { img: "vintage/weapon_pattern_01", name: "Vintage weapon pattern", kind: "Weapons", from: "Vintage Vice City Pack" },
] as const;

/** Guide topics. Filled after launch from verified gameplay — never from rumours. */
export const guides = [
  { title: "Your first million", status: "At launch", note: "Fastest legit money routes, tested by our crew on day one." },
  { title: "Every car and what it's worth", status: "At launch", note: "Price, top speed and where it spawns." },
  { title: "Weapons and where to find them", status: "At launch", note: "Stats, unlocks, ammo costs." },
  { title: "Heists, step by step", status: "At launch", note: "Approaches, crew picks and payouts." },
  { title: "Full map of Leonida", status: "Waiting on Rockstar", note: "Rockstar hasn't published an official map. We'll add it the day they do." },
  { title: "What we know so far", status: "Live", note: "Characters, regions and editions from Rockstar's official releases." },
] as const;

export const shop = [
  { title: "Grand Theft Auto VI — Standard", where: "PlayStation Store", href: "https://store.playstation.com/" },
  { title: "Grand Theft Auto VI — Ultimate Edition", where: "Xbox Store", href: "https://www.xbox.com/" },
  { title: "Official GTA VI merch", where: "Rockstar Store", href: "https://store.rockstargames.com/" },
  { title: "Capture card for clipping", where: "Amazon", href: "https://www.amazon.com/" },
] as const;

/** Official Live From Leonida accounts. Handle: livefromleonida everywhere. Update the URLs once each account exists. */
export const socials = [
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@livefromleonida" },
  { id: "twitch", label: "Twitch", href: "https://www.twitch.tv/livefromleonida" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@livefromleonida" },
  { id: "x", label: "X", href: "https://x.com/livefromleonida" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/livefromleonida" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/livefromleonida" },
  { id: "discord", label: "Discord", href: "https://discord.gg/livefromleonida" },
] as const;
