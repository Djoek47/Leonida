/** Human file names for clips, instead of "<uuid>-Big_Foot_Poisoning_Grand_Theft_Auto_VI_2026….webm".
 *
 *  Download name:  "CENTONICMAN2K2 - Big Foot Poisoning and Faint - Live From Leonida.mp4"
 *  Storage name:   "centonicman2k2-big-foot-poisoning-and-faint-1a2b3c4d.mp4" (short id keeps it unique) */

const clean = (s: string | null | undefined) => (s ?? "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "").replace(/\s+/g, " ").trim();

export function extOf(path: string | null | undefined, fallback = ".mp4") {
  return path?.match(/\.[a-z0-9]{2,4}$/i)?.[0].toLowerCase() ?? fallback;
}

export function clipDownloadName(gamertag: string | null | undefined, title: string | null | undefined, ext = ".mp4") {
  const who = clean(gamertag).slice(0, 32);
  const what = clean(title).slice(0, 80);
  return [who, what || "Clip", "Live From Leonida"].filter(Boolean).join(" - ") + ext;
}

export function slug(s: string | null | undefined, max = 48) {
  return (s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/g, "");
}

export function clipStorageName(gamertag: string | null | undefined, title: string | null | undefined, fileName: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return [slug(gamertag, 24), slug(title), id].filter(Boolean).join("-") + extOf(fileName);
}
