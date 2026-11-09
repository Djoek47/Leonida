/** Prints the SQL that loads public.tags from src/lib/tags.ts, so the picker and
 *  the database can never drift. Pipe it into the Supabase SQL editor:
 *    node scripts/seed-tags.mjs > /tmp/tags.sql
 */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/tags.ts", import.meta.url), "utf8");
const groups = [...src.matchAll(/group:\s*"([^"]+)"[\s\S]*?tags:\s*\[([\s\S]*?)\]/g)]
  .map(([, group, body]) => ({ group, tags: [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]) }));
const flagged = new Set([...(src.match(/FLAGGED[^[]*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]));
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const rows = groups.flatMap((g) =>
  g.tags.map((t) => `('${slug(t)}','${t.replace(/'/g, "''")}','${g.group}',${flagged.has(t)})`));

console.log("insert into public.tags (slug,label,grp,flagged) values");
console.log(rows.join(",\n"));
console.log("on conflict (slug) do update set label=excluded.label, grp=excluded.grp, flagged=excluded.flagged;");
console.error(`${rows.length} tags in ${groups.length} groups`);
