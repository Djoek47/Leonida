import "server-only";


/** Email HTML. Tables and inline styles only: Gmail, Outlook and Apple Mail
 *  each strip something different, and this is the subset all three keep.
 *
 *  Two looks, matching the site's two skies:
 *  - "sign"  — everyday mail (sign-in, plan changes, badges). Sunset gold page,
 *              champagne card, an interstate-green road sign across the top.
 *  - "night" — money mail (a purchase, a payment, a win). Vice City after dark,
 *              neon and gold, the amount set big enough to screenshot. */

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.livefromleonida.com").replace(/\/$/, "");
const ASSETS = process.env.EMAIL_ASSET_BASE ?? (SITE.startsWith("http://localhost") ? "https://www.livefromleonida.com" : SITE);
export const asset = (p: string) => `${ASSETS}/email/${p}`;

// The site's typeface. Apple Mail, iOS and most modern clients load it; Gmail
// falls back to the system sans, which is the closest stand-in it allows.
const FONT = "'Overpass','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const HEAVY = FONT;
// The LED boards' dot-matrix face (Doto), with a monospace stand-in.
const LED = "'Doto','Courier New',Courier,monospace";

export const esc = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Look = "sign" | "night";
/** Rank colours, the same ones the dashboard wears (globals.css .dash-*). */
export type Tier = "free" | "street" | "hustler" | "kingpin";
const RANKS: Record<Tier, { page: string; card: string; text: string; muted: string; rule: string; button: string; buttonText: string; accent: string; soft: string; led: string; label: string }> = {
  free:    { page: "#f3d48a", card: "#fff5d6", text: "#140d03", muted: "#5c4313", rule: "#e3c27a", button: "#b3121c", buttonText: "#ffffff", accent: "#00704a", soft: "#f8e7b4", led: "#cfe3f5", label: "FREE" },
  street:  { page: "#cfdeea", card: "#eef5fb", text: "#132230", muted: "#4a6276", rule: "#8fabc2", button: "#1c6aa3", buttonText: "#ffffff", accent: "#1c6aa3", soft: "#dce8f2", led: "#9fe0ff", label: "STREET" },
  hustler: { page: "#f6cdd3", card: "#fff0f2", text: "#40081a", muted: "#8e3348", rule: "#e88a9a", button: "#e0193f", buttonText: "#ffffff", accent: "#e0193f", soft: "#fbdde2", led: "#ff5a78", label: "HUSTLER" },
  kingpin: { page: "#1c1f4a", card: "#2a2d63", text: "#f6f3ff", muted: "#c3c3ec", rule: "#5b61b0", button: "#ffd24a", buttonText: "#1c1f4a", accent: "#ffd24a", soft: "#363a78", led: "#ffd24a", label: "KINGPIN" },
};
let RANK: Tier = "free";
/** Set once per email by the template entry points. */
export function setRank(t: unknown) { RANK = (["street", "hustler", "kingpin"].includes(String(t)) ? t : "free") as Tier; }
const P0 = {
  sign:  { page: "#f3d48a", card: "#fff5d6", text: "#140d03", muted: "#5c4313", rule: "#e3c27a",
           button: "#b3121c", buttonText: "#ffffff", accent: "#00704a", soft: "#f8e7b4" },
  night: { page: "#0c0618", card: "#1a0d31", text: "#fff1e8", muted: "#bfaedc", rule: "#3a2363",
           button: "#ffc23d", buttonText: "#140a26", accent: "#ff3d8b", soft: "#24133f" },
} as const;
const P = new Proxy(P0, { get: (o, k: string) => (k === "sign" ? RANKS[RANK] : (o as Record<string, unknown>)[k]) }) as unknown as Record<Look, typeof RANKS.free>;

/** LED scoreboard strip — the dashboard's stat band, in a table. */
export function led(items: Array<[string, string]>): Block {
  const glow = RANKS[RANK].led;
  const cells = items.map(([k, v]) => `<td align="center" style="padding:14px 6px;">
<p style="margin:0;font-family:${LED};font-size:28px;font-weight:900;letter-spacing:1px;color:${glow};text-shadow:0 0 8px ${glow};">${v}</p>
<p style="margin:4px 0 0;font-family:${HEAVY};font-size:10px;letter-spacing:2.5px;color:#8f93b8;">${esc(k.toUpperCase())}</p></td>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#090a1f" style="margin:2px 0 22px;background:#090a1f;border-radius:12px;border:1px solid #23264f;"><tr>${cells}</tr></table>`;
}

export type Block = string;

export function heading(text: string, look: Look): Block {
  const c = P[look];
  return `<h1 style="margin:0 0 14px;font-family:${HEAVY};font-size:34px;line-height:0.98;font-weight:900;letter-spacing:-1px;color:${c.text};">${esc(text)}</h1>`;
}

export function para(html: string, look: Look): Block {
  const c = P[look];
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${c.text};">${html}</p>`;
}

export function small(html: string, look: Look): Block {
  const c = P[look];
  return `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.55;color:${c.muted};">${html}</p>`;
}

/** Bulletproof button: a table cell, so Outlook draws it too. */
export function button(label: string, href: string, look: Look): Block {
  const c = P[look];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px;"><tr>
<td bgcolor="${c.button}" style="border-radius:10px;">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:15px 28px;font-family:${HEAVY};font-size:16px;font-weight:900;letter-spacing:0.3px;color:${c.buttonText};text-decoration:none;border-radius:10px;">${esc(label)}</a>
</td></tr></table>`;
}

/** The one-time code, set like a licence plate. */
export function code(token: string, look: Look): Block {
  const c = P[look];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;"><tr>
<td style="border:2px solid ${c.text};border-radius:8px;padding:12px 22px;background:${c.soft};">
<span style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:${c.text};">${esc(token)}</span>
</td></tr></table>`;
}

/** Label / value rows: receipts, plan details. */
export function rows(items: Array<[string, string]>, look: Look): Block {
  const c = P[look];
  const r = items.map(([k, v], i) => `<tr>
<td style="padding:11px 0;${i ? `border-top:1px solid ${c.rule};` : ""}font-family:${FONT};font-size:14px;color:${c.muted};">${esc(k)}</td>
<td align="right" style="padding:11px 0;${i ? `border-top:1px solid ${c.rule};` : ""}font-family:${FONT};font-size:14px;font-weight:700;color:${c.text};">${v}</td>
</tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;border-top:2px solid ${c.text};border-bottom:2px solid ${c.text};">${r}</table>`;
}

/** Bullet list with a small mark in the accent colour. */
export function list(items: string[], look: Look): Block {
  const c = P[look];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">${items.map((t) => `<tr>
<td valign="top" style="padding:3px 10px 3px 0;font-family:${HEAVY};font-size:14px;color:${c.accent};">&#9733;</td>
<td style="padding:3px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${c.text};">${t}</td></tr>`).join("")}</table>`;
}

/** The big moment on a money email: an image, a kicker, the figure. */
export function hero(o: { img?: string; imgAlt?: string; kicker: string; figure: string; caption?: string }): Block {
  const c = P.night;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
<tr><td align="center" style="padding:6px 0 0;">
${o.img ? `<img src="${esc(o.img)}" width="150" height="150" alt="${esc(o.imgAlt ?? "")}" style="display:block;width:150px;height:150px;border:0;margin:0 auto 14px;">` : ""}
<p style="margin:0 0 6px;font-family:${HEAVY};font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:${c.accent};">${esc(o.kicker)}</p>
<p style="margin:0;font-family:${LED};font-size:58px;line-height:1;font-weight:900;letter-spacing:1px;color:#ffa21a;text-shadow:0 0 6px rgba(255,140,0,.85),0 0 16px rgba(255,120,0,.45);">${o.figure}</p>
${o.caption ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:14px;color:${c.muted};">${o.caption}</p>` : ""}
</td></tr></table>`;
}

export function shell(o: { look: Look; preheader: string; body: Block[]; reason: string }): string {
  const c = P[o.look];
  const night = o.look === "night";
  const top = night
    ? `<tr><td align="center" style="padding:30px 24px 8px;">
<img src="${asset(RANK === "free" ? "logo-night.png" : `logo-${RANK}.png`)}" width="64" height="64" alt="Live From Leonida" style="display:block;width:64px;height:64px;border:0;border-radius:50%;margin:0 auto 10px;">
<p style="margin:0;font-family:${HEAVY};font-size:13px;font-weight:900;letter-spacing:4px;color:#ff3d8b;">LIVE FROM LEONIDA</p>
</td></tr>
<tr><td align="center" style="padding:6px 24px 18px;font-family:${HEAVY};font-size:12px;letter-spacing:8px;color:#ffc23d;">&#9733;&#9733;&#9733;&#9733;&#9733;&#9733;</td></tr>`
    : `<tr><td style="padding:28px 24px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#090a1f" style="background:#090a1f;border-radius:14px;border:2px solid ${RANKS[RANK].accent};">
<tr><td width="64" style="padding:12px 0 12px 14px;"><img src="${asset(`logo-${RANK}.png`)}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0;border-radius:50%;"></td>
<td style="padding:12px 16px 12px 12px;">
<p style="margin:0;font-family:${LED};font-size:20px;font-weight:900;letter-spacing:2px;color:${RANKS[RANK].led};text-shadow:0 0 8px ${RANKS[RANK].led};">LIVE FROM LEONIDA</p>
<p style="margin:3px 0 0;font-family:${HEAVY};font-size:10px;letter-spacing:2.5px;color:#8f93b8;">GTA VI CLIPS &middot; PRIZES &middot; ${RANKS[RANK].label}</p>
</td></tr></table></td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="${night ? "dark" : "light"}"><meta name="supported-color-schemes" content="${night ? "dark" : "light"}">
<title>Live From Leonida</title>
<style>
@font-face { font-family: 'Overpass'; font-style: normal; font-weight: 100 900; src: url('${asset("overpass.woff2")}') format('woff2'); }
@font-face { font-family: 'Doto'; font-style: normal; font-weight: 900; src: url('${asset("doto-900.woff2")}') format('woff2'); }
</style></head>
<body style="margin:0;padding:0;background:${c.page};" bgcolor="${c.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${c.page};">${esc(o.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.page}" style="background:${c.page};">
<tr><td align="center" style="padding:0 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
${top}
<tr><td style="padding:${night ? "0" : "18px"} 0 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.card}" style="background:${c.card};border-radius:16px;${night ? "border:1px solid #3a2363;" : `border:1px solid ${c.rule};`}">
<tr><td style="padding:34px 32px 18px;">
${o.body.join("\n")}
</td></tr></table></td></tr>
<tr><td align="center" style="padding:22px 18px 34px;">
<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:1.6;color:${c.muted};">${esc(o.reason)}</p>
<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:1.6;color:${c.muted};">
<a href="${SITE}/settings" style="color:${c.muted};text-decoration:underline;">Account settings</a> &nbsp;&middot;&nbsp;
<a href="${SITE}/rules" style="color:${c.muted};text-decoration:underline;">Contest rules</a> &nbsp;&middot;&nbsp;
<a href="${SITE}/privacy" style="color:${c.muted};text-decoration:underline;">Privacy</a></p>
<p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.6;color:${c.muted};">Live From Leonida is a fan site. Not affiliated with Rockstar Games or Take-Two Interactive.<br>Need a hand? <a href="${SITE}/support" style="color:${c.muted};text-decoration:underline;">Contact support</a>.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

/** Plain-text twin. Spam filters and some readers want one, and it has to say
 *  the same thing, so it is built from the same parts. */
export function plain(lines: Array<string | null | undefined | false>): string {
  return [...lines.filter((l): l is string => typeof l === "string"), "", "—", "Live From Leonida · livefromleonida.com",
    "Fan site. Not affiliated with Rockstar Games or Take-Two Interactive."].join("\n");
}
