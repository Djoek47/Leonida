#!/usr/bin/env node
/**
 * Arsenal import — vehicles and weapons for the Leonida guide.
 *
 * Drop images in:
 *   data/arsenal/vehicles/   data/arsenal/weapons/
 * The file name becomes the name:  grotti-cheetah.png  ->  "Grotti Cheetah"
 *
 * Optional details, one CSV per kind (data/arsenal/vehicles.csv, weapons.csv):
 *   file,name,category,maker,inspiration,note
 *   grotti-cheetah.png,Grotti Cheetah,Super,Grotti,Ferrari Monza,Ultimate Edition
 * Any column can be blank; rows without a matching image are listed but get no picture.
 *
 * Run:  node scripts/import-arsenal.mjs
 * Writes optimised webp to public/media/arsenal/ and the list to src/lib/arsenal.json.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, basename, join } from "node:path";
import sharp from "sharp";

const ROOT = "data/arsenal", OUT_IMG = "public/media/arsenal", OUT_JSON = "src/lib/arsenal.json";
const IMG = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const titleFrom = (f) => basename(f, extname(f)).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Small CSV reader: handles quotes and commas inside quotes. */
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

async function load(kind) {
  const dir = join(ROOT, kind);
  const files = existsSync(dir) ? (await readdir(dir)).filter((f) => IMG.has(extname(f).toLowerCase())) : [];
  const csvPath = join(ROOT, `${kind}.csv`);
  const rows = existsSync(csvPath) ? parseCsv(await readFile(csvPath, "utf8")) : [];
  const byFile = new Map(rows.filter((r) => r.file).map((r) => [r.file.toLowerCase(), r]));

  const items = [], seen = new Set();
  const add = async (file, r = {}) => {
    const name = r.name || titleFrom(file ?? "");
    if (!name) return;
    const id = `${kind === "vehicles" ? "v" : "w"}-${slug(name)}`;
    if (seen.has(id)) return; seen.add(id);
    let img = null;
    if (file && existsSync(join(dir, file))) {
      img = `/media/arsenal/${id}.webp`;
      await sharp(join(dir, file)).rotate().resize({ width: 1280, height: 720, fit: "cover", position: "attention" })
        .webp({ quality: 80 }).toFile(join(OUT_IMG, `${id}.webp`));
    }
    items.push({ id, kind: kind === "vehicles" ? "vehicle" : "weapon", name,
      category: r.category || "", maker: r.maker || "", inspiration: r.inspiration || "", note: r.note || "", img });
  };

  for (const f of files) await add(f, byFile.get(f.toLowerCase()));
  for (const r of rows) if (!r.file || !files.some((f) => f.toLowerCase() === r.file.toLowerCase())) await add(r.file || null, r);
  return items;
}

await mkdir(OUT_IMG, { recursive: true });
const all = [...(await load("vehicles")), ...(await load("weapons"))]
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
await writeFile(OUT_JSON, JSON.stringify(all, null, 1) + "\n");
const v = all.filter((x) => x.kind === "vehicle"), w = all.filter((x) => x.kind === "weapon");
console.log(`${v.length} vehicles (${v.filter((x) => x.img).length} with pictures), ${w.length} weapons (${w.filter((x) => x.img).length} with pictures) -> ${OUT_JSON}`);
