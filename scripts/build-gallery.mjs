#!/usr/bin/env node
/**
 * Builds src/lib/gallery.json from everything in public/media.
 * Rockstar's official media kit: screenshots, Ultimate Edition, Vintage pack
 * and the artwork/wallpapers. Re-run after dropping new files in.
 */
import { readdir, writeFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const M = "public/media";
const num = (s) => { const m = s.match(/_(\d+)(?:_|$)/); return m ? m[1].padStart(2, "0") : ""; };
const words = (s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  .replace(/\bAnd\b/g, "and").replace(/\bWith Logos?\b/g, "(with logos)").replace(/\bPtt\b/g, "PTT");

const NAMES = {
  jason_and_lucia: "Jason and Lucia", drequan_priest: "Dre'Quan Priest",
  mount_kalaga_national_park: "Mount Kalaga National Park", vice_city: "Vice City",
  leonida_keys: "Leonida Keys", port_gellhorn: "Port Gellhorn",
  hawk_and_little_morgan_revolvers: "Hawk & Little Morgan Revolvers",
  pack: "Vintage Vice City Pack", pack_exclusive_looks: "Vintage Outfits and Hairstyles",
  pack_vapid_stanier: "'55 Vapid Stanier", grotti_cheetah: "'95 Grotti Cheetah",
  weapon_pattern: "Vintage Weapon Pattern", ptt_store: "PTT Store",
};

async function pick(dir, group, label) {
  let files = [];
  try { files = await readdir(join(M, dir)); } catch { return []; }
  return files.filter((f) => [".webp", ".jpg", ".png"].includes(extname(f).toLowerCase()))
    .map((f) => {
      const stem = basename(f, extname(f));
      const n = num(stem);
      const key = stem.replace(/_?\d+$/, "") || label;
      const subject = NAMES[key] ?? (key ? words(key) : label);
      return { src: `/media/${dir}/${f}`, group, label,
        title: n ? `${subject} ${n}` : subject, subject, sort: `${subject} ${n}` };
    })
    .sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true }));
}

const shots = [
  ...(await pick("people", "people", "People")),
  ...(await pick("places", "places", "Places")),
  ...(await pick("ultimate", "ultimate", "Ultimate Edition")),
  ...(await pick("vintage", "vintage", "Vintage Vice City Pack")),
  // artwork: keep one version of each, skip the duplicate "with logos" crops
  ...(await pick("art", "art", "Artwork")).filter((x) =>
    !/with_logos?|_phone|_portrait/.test(x.src)),
].map(({ sort, ...rest }) => rest);

await writeFile("src/lib/gallery.json", JSON.stringify(shots, null, 0) + "\n");
const by = {};
for (const s of shots) by[s.label] = (by[s.label] ?? 0) + 1;
console.log(`${shots.length} images:`, by);
