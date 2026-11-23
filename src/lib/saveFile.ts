"use client";

/** Saves a file under our own name. Cross-origin links ignore the download attribute, and
 *  Blob always names the file after its storage path, so we fetch it and save the bytes
 *  with the name we want. Falls back to opening the link if the fetch is blocked or the
 *  file is too big to hold in memory comfortably. */
const IN_MEMORY_MAX = 700 * 1024 * 1024;

export async function saveFile(url: string, name?: string) {
  if (!name) { location.href = url; return; }
  try {
    const head = await fetch(url, { method: "HEAD" }).catch(() => null);
    const size = Number(head?.headers.get("content-length") ?? 0);
    if (size > IN_MEMORY_MAX) throw new Error("too big");
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj; a.download = name; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 60_000);
  } catch {
    location.href = url;
  }
}
