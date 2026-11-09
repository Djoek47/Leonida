/** Re-derives each place's sign colour from that place's own screenshots.
 *
 *  Not a dominant-colour pick: a dominant pick gives you the sky, and every
 *  place in Leonida shares the same sky. This scores each hue by how much
 *  MORE of it a place carries than the others do, weighted by saturation, so
 *  what comes out is the colour that makes somewhere look like itself —
 *  Vice City neon, the Keys water, Grassrivers swamp.
 *
 *  Then it darkens the result until white type clears 4.6:1 on it.
 *
 *    node scripts/place-colours.mjs        # paste the result into src/lib/content.ts
 */
import sharp from "sharp";

const PLACES = {
  vice_city: 12, leonida_keys: 6, grassrivers: 6,
  port_gellhorn: 6, ambrosia: 6, mount_kalaga_national_park: 6,
};
const BUCKETS = 24;

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
          : mx === g ? ((b - r) / d + 2) / 6
          : ((r - g) / d + 4) / 6;
  return [h, s, l];
};
const hslToRgb = (h, s, l) => {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
};
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const profiles = {};
for (const [slug, count] of Object.entries(PLACES)) {
  const weight = new Array(BUCKETS).fill(0);
  const sat = Array.from({ length: BUCKETS }, () => []);
  for (let i = 1; i <= count; i++) {
    const { data } = await sharp(`public/media/places/${slug}_${i}.webp`)
      .resize(120, 68, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    for (let p = 0; p < data.length; p += 3) {
      const [h, s, l] = rgbToHsl(data[p], data[p + 1], data[p + 2]);
      if (s < 0.18 || l < 0.10 || l > 0.94) continue;
      const k = Math.floor(h * BUCKETS) % BUCKETS;
      weight[k] += s * s; sat[k].push(s);
    }
  }
  const total = weight.reduce((a, b) => a + b, 0) || 1;
  profiles[slug] = { share: weight.map((w) => w / total), sat };
}

const slugs = Object.keys(PLACES);
const avg = Array.from({ length: BUCKETS }, (_, k) =>
  slugs.reduce((a, s) => a + profiles[s].share[k], 0) / slugs.length);

for (const slug of slugs) {
  const { share, sat } = profiles[slug];
  let best = 0, bestScore = -1;
  for (let k = 0; k < BUCKETS; k++) {
    // distinctive, but ignore hues the place barely has at all
    const score = (share[k] / (avg[k] + 1e-6)) * (share[k] > 0.04 ? 1 : 0.15);
    if (score > bestScore) { bestScore = score; best = k; }
  }
  const hue = (best + 0.5) / BUCKETS;
  const list = sat[best].length ? sat[best] : [0.5];
  const s = Math.min(0.95, Math.max(0.62, (list.reduce((a, b) => a + b, 0) / list.length) * 1.6));
  let l = 0.46, rgb = hslToRgb(hue, s, l);
  while (l > 0.12 && contrast(rgb, [255, 255, 255]) < 4.6) { l -= 0.02; rgb = hslToRgb(hue, s, l); }
  const hex = "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
  console.log(`  ${slug.padEnd(28)} tone: "${hex}"   contrast ${contrast(rgb, [255, 255, 255]).toFixed(2)}`);
}
