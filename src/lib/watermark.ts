import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/** Burns the Live From Leonida watermark into a clip, so it survives screen recording,
 *  downloads, re-uploads and anyone deleting the on-page overlay.
 *
 *  What goes on the picture:
 *   - top-right: the seal plus "@gamertag / livefromleonida.com" (same look as the site overlay)
 *   - a faint second mark that drifts across the frame for the whole clip, so cropping the
 *     corner out doesn't remove it
 *
 *  The ffmpeg build we ship has no drawtext, so text is rendered as an ASS subtitle track
 *  (libass) with our own font files; the seal is a normal image overlay. */

const ROOT = process.cwd();
export const WM_ASSETS = {
  seal: path.join(ROOT, "public/brand/live-from-leonida-avatar-180.png"),
  fonts: path.join(ROOT, "src/assets/watermark"),
};

export function ffmpegBin(): string {
  // ffmpeg-static exports the absolute path of its bundled binary.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const p = require("ffmpeg-static") as string | null;
  if (!p) throw new Error("ffmpeg binary not available on this platform");
  return p;
}

type Probe = { width: number; height: number; duration: number; audio: boolean };

/** Reads size, length and whether there's audio, from ffmpeg's own stream report. */
export function probe(input: string): Promise<Probe> {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegBin(), ["-hide_banner", "-i", input], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; });
    p.on("error", reject);
    p.on("close", () => {
      const dur = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
      // Rotation metadata flips portrait phone clips; honour it.
      const rot = /rotate\s*:\s*-?(90|270)|displaymatrix: rotation of -?(90|270)/.test(err);
      const v = err.match(/Stream #[^\n]*Video:[^\n]*?\b(\d{2,5})x(\d{2,5})\b/);
      if (!v) return reject(new Error("Couldn't read the video stream"));
      let width = +v[1], height = +v[2];
      if (rot) [width, height] = [height, width];
      const duration = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;
      resolve({ width, height, duration, audio: /Stream #[^\n]*Audio:/.test(err) });
    });
  });
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
const assText = (s: string) => s.replace(/[{}\\]/g, "").replace(/\r?\n/g, " ").slice(0, 40);
const ts = (t: number) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
};

/** Output size (max 1080 on the short side, 30 fps) and every position, in output pixels. */
export function layout(src: { width: number; height: number }, maxShort = 1080) {
  const short = Math.min(src.width, src.height);
  const k = Math.min(1, maxShort / short);
  const W = even(src.width * k), H = even(src.height * k);
  const u = Math.min(W, H); // the unit everything scales with, so portrait clips look right too
  const seal = even(u * 0.085);
  const margin = Math.round(u * 0.03);
  return { W, H, u, seal, margin, sealX: W - margin - seal, sealY: margin };
}

/** The ASS track: corner caption next to the seal, plus the drifting mark. */
export function buildAss(src: { width: number; height: number; duration: number }, gamertag: string, maxShort = 1080) {
  const L = layout(src, maxShort);
  const { W, H, u, seal, margin } = L;
  const right = W - margin - seal - Math.round(u * 0.018);
  const tag = gamertag ? `@${assText(gamertag)}` : "Live From Leonida";
  const end = ts(Math.max(1, src.duration) + 1);
  const big = Math.round(u * 0.036), small = Math.round(u * 0.026), drift = Math.round(u * 0.032);
  const lines = [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "ScaledBorderAndShadow: yes", "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // Colours are &HAABBGGRR (AA: 00 = opaque, FF = invisible).
    `Style: Tag,LFL Mark Heavy,${big},&H00FFFFFF,&H00FFFFFF,&H8C000000,&H00000000,0,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(u * 0.003))},0,9,0,0,0,1`,
    `Style: Url,LFL Mark,${small},&H1AFFFFFF,&H1AFFFFFF,&H80000000,&H00000000,0,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(u * 0.0025))},0,9,0,0,0,1`,
    `Style: Drift,LFL Mark Heavy,${drift},&HD0FFFFFF,&HD0FFFFFF,&HE0000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,5,0,0,0,1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    `Dialogue: 2,0:00:00.00,${end},Tag,,0,0,0,,{\\an9\\pos(${right},${margin + Math.round(seal * 0.06)})}${tag}`,
    `Dialogue: 2,0:00:00.00,${end},Url,,0,0,0,,{\\an9\\pos(${right},${margin + Math.round(seal * 0.06) + Math.round(big * 1.1)})}livefromleonida.com`,
  ];
  // Drifting mark: crosses the frame every 14 s on a different line each pass.
  const pass = 14, rows = [0.32, 0.58, 0.44, 0.7, 0.26, 0.52];
  const text = `${tag} · livefromleonida.com`;
  for (let t = 0, i = 0; t < Math.max(src.duration, 1); t += pass, i++) {
    const y = Math.round(H * rows[i % rows.length]);
    const goRight = i % 2 === 0;
    const x0 = goRight ? -W * 0.35 : W * 1.35, x1 = goRight ? W * 1.35 : -W * 0.35;
    lines.push(`Dialogue: 1,${ts(t)},${ts(t + pass)},Drift,,0,0,0,,{\\an5\\move(${Math.round(x0)},${y},${Math.round(x1)},${y})\\frz${goRight ? -4 : 4}}${text}`);
  }
  return { ass: lines.join("\n") + "\n", layout: L };
}

/** Encoder settings sized to finish inside one function run (5 min on Hobby, 1 vCPU):
 *  short clips get better compression, long ones the fastest preset, very long ones 720p. */
export function encodePlan(duration: number) {
  if (duration <= 75) return { preset: "superfast", maxShort: 1080, maxrate: "7M", bufsize: "14M" };
  if (duration <= 210) return { preset: "ultrafast", maxShort: 1080, maxrate: "7M", bufsize: "14M" };
  return { preset: "ultrafast", maxShort: 720, maxrate: "4M", bufsize: "8M" };
}

/** Runs ffmpeg: input clip → watermarked MP4 (H.264/AAC, faststart) at `out`. */
export async function burn(input: string, out: string, gamertag: string, onLog?: (s: string) => void) {
  const info = await probe(input);
  const plan = encodePlan(info.duration);
  const { ass, layout: L } = buildAss(info, gamertag, plan.maxShort);
  const dir = await mkdtemp(path.join(tmpdir(), "lfl-wm-"));
  try {
    const assPath = path.join(dir, "mark.ass");
    await writeFile(assPath, ass, "utf8");
    const esc = (p: string) => p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
    const filter = [
      `[0:v]scale=${L.W}:${L.H}:flags=bicubic,fps=30,format=yuv420p[v]`,
      `[1:v]scale=${L.seal}:${L.seal}[s]`,
      `[v][s]overlay=${L.sealX}:${L.sealY}[vs]`,
      `[vs]ass=filename='${esc(assPath)}':fontsdir='${esc(WM_ASSETS.fonts)}'[out]`,
    ].join(";");
    const args = [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", input, "-i", WM_ASSETS.seal,
      "-filter_complex", filter, "-map", "[out]",
      ...(info.audio ? ["-map", "0:a:0", "-c:a", "aac", "-b:a", "128k"] : ["-an"]),
      "-c:v", "libx264", "-preset", plan.preset, "-crf", "24", "-maxrate", plan.maxrate, "-bufsize", plan.bufsize, "-pix_fmt", "yuv420p", "-threads", "0",
      "-movflags", "+faststart", out,
    ];
    await new Promise<void>((resolve, reject) => {
      const p = spawn(ffmpegBin(), args, { stdio: ["ignore", "ignore", "pipe"] });
      let err = "";
      p.stderr.on("data", (d) => { err += d; onLog?.(String(d)); });
      p.on("error", reject);
      p.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-600)}`)));
    });
    return info;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
