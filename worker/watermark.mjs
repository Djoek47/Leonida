#!/usr/bin/env node
/**
 * Live From Leonida — watermark worker.
 *
 * Stamps the uploader's name onto approved clips with ffmpeg, then puts the
 * stamped copy back in Supabase Storage. Nothing clever: a name in the corner.
 *
 * This cannot run on Vercel — serverless functions have no ffmpeg and time out
 * long before a video finishes. Run it anywhere cheap that stays up: a $5 VPS,
 * a Fly or Railway worker, a Raspberry Pi at home. It is deliberately slow and
 * sequential so a small box can keep up overnight.
 *
 *   npm i @supabase/supabase-js     # and have ffmpeg on PATH
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node worker/watermark.mjs
 *
 * Flags:
 *   --once        process whatever is queued, then exit (good for cron)
 *   --every=60    seconds between polls when looping (default 60)
 */

import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const ONCE = args.has("--once");
const EVERY = Number([...args].find((a) => a.startsWith("--every="))?.split("=")[1] ?? 60) * 1000;
const BUCKET = "clips";

const db = createClient(URL_, KEY, { auth: { persistSession: false } });

const run = (cmd, argv) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; if (err.length > 8000) err = err.slice(-8000); });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}\n${err}`))));
  });

/** ffmpeg's drawtext treats these as syntax, so they get escaped. */
const esc = (s) => String(s).replace(/[\\':%]/g, (c) => "\\" + c).slice(0, 48);

async function stamp(inPath, outPath, name) {
  // Bottom-right, small, semi-transparent, with a soft shadow so it reads on
  // light and dark footage alike. Audio is copied through untouched.
  const text = `${esc(name)}  ·  livefromleonida.com`;
  const filter = [
    `drawtext=text='${text}'`,
    "fontcolor=white@0.78",
    "fontsize=h/28",
    "shadowcolor=black@0.5:shadowx=2:shadowy=2",
    "x=w-tw-(h/36)",
    "y=h-th-(h/36)",
  ].join(":");

  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", inPath,
    "-vf", filter,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
    "-c:a", "copy",
    "-movflags", "+faststart",
    outPath,
  ]);
}

async function processOne(clip) {
  const dir = await mkdtemp(join(tmpdir(), "lfl-"));
  const src = join(dir, "in.mp4");
  const dst = join(dir, "out.mp4");
  try {
    await db.from("clips").update({ watermark_status: "running" }).eq("id", clip.id);

    const { data, error } = await db.storage.from(BUCKET).download(clip.storage_path);
    if (error) throw error;
    await writeFile(src, Buffer.from(await data.arrayBuffer()));

    const name = clip.gamertag || "Live From Leonida";
    await stamp(src, dst, name);

    const out = `${clip.storage_path.replace(/\.[^.]+$/, "")}--stamped.mp4`;
    const up = await db.storage.from(BUCKET).upload(out, await readFile(dst), {
      contentType: "video/mp4", upsert: true,
    });
    if (up.error) throw up.error;

    await db.from("clips").update({ watermark_path: out, watermark_status: "done" }).eq("id", clip.id);
    console.log(`✓ ${clip.id} → ${out}`);
  } catch (e) {
    await db.from("clips").update({ watermark_status: "failed" }).eq("id", clip.id);
    console.error(`✗ ${clip.id}: ${e.message}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function pass() {
  // Only approved clips that live in our own storage and have no stamp yet.
  const { data, error } = await db.from("clips")
    .select("id, storage_path, gamertag")
    .in("status", ["approved", "featured"])
    .eq("watermark_status", "queued")
    .not("storage_path", "is", null)
    .order("created_at")
    .limit(20);

  if (error) { console.error("queue read failed:", error.message); return 0; }
  for (const clip of data ?? []) await processOne(clip);
  return data?.length ?? 0;
}

async function main() {
  await run("ffmpeg", ["-version"]).catch(() => {
    console.error("ffmpeg is not on PATH. Install it first (apt install ffmpeg / brew install ffmpeg).");
    process.exit(1);
  });

  if (ONCE) { const n = await pass(); console.log(`done, ${n} clip(s)`); return; }

  console.log(`watching the queue every ${EVERY / 1000}s — ctrl-c to stop`);
  for (;;) {
    const n = await pass();
    if (n === 0) await new Promise((r) => setTimeout(r, EVERY));
  }
}

main();
