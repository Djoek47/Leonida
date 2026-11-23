/** Online & RP intel board.
 *
 *  The road is closed: GTA VI shipped single-player on November 19, 2026 and
 *  neither its online mode nor any roleplay support has been announced. This
 *  file is the running log of everything worth knowing in the meantime.
 *
 *  To update the page, add an entry at the top of the right list. Keep the
 *  status honest:
 *    confirmed — Rockstar / Take-Two / Cfx.re said it on the record
 *    reported  — a credible outlet or named person said it, not Rockstar
 *    datamine  — found in game files; says something exists, not when */

export type IntelStatus = "confirmed" | "reported" | "datamine";
export type Intel = { date: string; status: IntelStatus; title: string; body: string; source: string; url: string };

export const ONLINE_LAST_CHECKED = "2026-11-23";

export const ONLINE_FACTS: { k: string; v: string; ok?: boolean }[] = [
  { k: "GTA VI story mode", v: "Out now · Nov 19, 2026", ok: true },
  { k: "GTA VI online mode", v: "Not announced" },
  { k: "Online release date", v: "None · 2027 is the reported window" },
  { k: "GTA V Online", v: "Still supported", ok: true },
  { k: "Character / money transfer", v: "Not announced" },
];

export const ONLINE_INTEL: Intel[] = [
  { date: "2026-11-22", status: "reported", title: "Twitch's CEO points to 2027",
    body: "Twitch CEO Dan Clancy told Bloomberg the next GTA Online is expected in 2027. Rockstar hasn't confirmed any date, so treat it as a strong hint, not an announcement.",
    source: "GTABase", url: "https://www.gtabase.com/articles/gta-6/when-is-gta-6-online-coming-out" },
  { date: "2026-11-19", status: "confirmed", title: "Launch day: single-player only",
    body: "GTA VI is out on PS5 and Xbox Series X|S as a single-player game. No online mode, name or date has been announced.",
    source: "Rockstar Newswire", url: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026" },
  { date: "2026-11-13", status: "reported", title: "Bloomberg: \"not even its final form\"",
    body: "A Bloomberg feature on the series framed the 2026 release as the first stage, with online to follow. The phrasing suggested roughly a year later; Jason Schreier has pointed to 2027.",
    source: "Forbes", url: "https://www.forbes.com/sites/paultassi/2026/11/13/the-gta-6-online-release-date-is-far-off-says-new-report/" },
  { date: "2026-11-09", status: "datamine", title: "Multiplayer hooks in the launch build",
    body: "PlayStation backend data for the release build lists three activity types: joinSession, launchActivity and launchMultiplayerActivity. They show session plumbing exists, not when it switches on.",
    source: "Insider Gaming", url: "https://insider-gaming.com/gta-6-datamine-reveals-multiplayer-references/" },
  { date: "2026-11-09", status: "confirmed", title: "GTA V Online isn't going anywhere",
    body: "Take-Two says it will keep supporting the current GTA Online after GTA VI's release and beyond. No transfer of money, characters or property into GTA VI has been announced.",
    source: "Timesaver tracker", url: "https://timesaver.gg/tools/gta-6/online" },
];

export const RP_FACTS: { k: string; v: string; ok?: boolean }[] = [
  { k: "GTA VI roleplay servers", v: "Not announced" },
  { k: "FiveM for GTA VI", v: "Not announced" },
  { k: "GTA VI on PC", v: "Not announced" },
  { k: "Cfx.re (FiveM team)", v: "Part of Rockstar since Aug 2023", ok: true },
  { k: "Where RP lives today", v: "GTA V on PC via FiveM", ok: true },
];

export const RP_INTEL: Intel[] = [
  { date: "2026-11-21", status: "confirmed", title: "Still nothing for GTA VI",
    body: "Neither Rockstar nor Cfx.re has announced roleplay servers, mod support, community servers or FiveM for GTA VI. Consoles can't load community servers, so RP needs a PC release first.",
    source: "ZAP-Hosting", url: "https://zap-hosting.com/en/blog/gta-6-rp-roleplay-server-fivem" },
  { date: "2026-09-08", status: "confirmed", title: "nopixel V closed beta goes live",
    body: "The Rockstar-backed nopixel V server entered an invite-only closed beta through the Rockstar Games Launcher, with new areas like the Pixel Hotel & Casino and a revamped Cypress Flats.",
    source: "PCGamesN", url: "https://www.pcgamesn.com/grand-theft-auto-v/nopixel-v-beta" },
  { date: "2026-09-01", status: "confirmed", title: "Rockstar officially backs nopixel V",
    body: "Rockstar announced nopixel V as \"the next evolution\" of GTA V roleplay. It's the first time Rockstar has put its name on a specific RP server, and it runs on GTA V, not VI.",
    source: "PC Gamer", url: "https://www.pcgamer.com/games/grand-theft-auto/rockstar-touts-new-invite-only-nopixel-v-gta-roleplaying-server-as-the-next-evolution-of-the-rp-community/" },
  { date: "2023-08-11", status: "confirmed", title: "Cfx.re joins Rockstar",
    body: "The team behind FiveM and RedM became part of Rockstar Games. It's the main reason people expect RP to reach GTA VI eventually, though Cfx.re said the deal was about FiveM and RedM.",
    source: "ZAP-Hosting", url: "https://zap-hosting.com/en/blog/gta-6-pc-rp-fivem-servers" },
];
