"use client";
import { saveFile } from "@/lib/saveFile";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Item = { clip_id: string; title: string; gamertag: string | null; platform: string | null; withdrawn: boolean; downloaded_at: string };

/** Everything this member has downloaded. A clip its creator withdrew from the site stays here for the people
 *  who already own it, so they can fetch it again. Nobody else can see or buy it. */
export function DownloadLibrary() {
  const { user } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const c = sb(); if (!c || !user) return;
    c.rpc("my_download_library").then(({ data }) => setItems((data ?? []) as Item[]));
  }, [user]);

  async function again(it: Item) {
    const c = sb(); if (!c) return;
    setBusy(it.clip_id); setMsg("");
    const token = (await c.auth.getSession()).data.session?.access_token;
    const res = await fetch("/api/download", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ clipId: it.clip_id }) });
    const j = (await res.json().catch(() => ({}))) as { file?: string; name?: string; external?: boolean; error?: string };
    setBusy(null);
    if (!j.file) { setMsg(j.error ?? "Could not start the download."); return; }
    if (j.external) window.open(j.file, "_blank", "noopener"); else void saveFile(j.file, j.name);
  }

  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 4);
  return (
    <section className="dl-lib mt-10" aria-labelledby="dl-lib-t">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 id="dl-lib-t" className="display text-3xl">Your downloads</h2>
          <p className="text-haze text-sm">Clips you&apos;ve downloaded. Download them again any time, free.</p>
        </div>
        {items.length > 4 && <button className="text-sm font-bold underline" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${items.length}`}</button>}
      </div>
      <ul className="dl-list">
        {shown.map((it) => (
          <li key={it.clip_id}>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold truncate">{it.title}</p>
              <p className="text-xs text-haze">
                {it.gamertag ?? "Player"}{it.platform ? ` · ${it.platform.toUpperCase()}` : ""}
                {it.withdrawn && <span className="dl-flag">Withdrawn by its creator. Only you and other past buyers can still get it.</span>}
              </p>
            </div>
            <button onClick={() => again(it)} disabled={busy === it.clip_id} className="btn btn-hot !py-1.5 !px-4 text-sm shrink-0">
              {busy === it.clip_id ? "Preparing…" : "Download again"}
            </button>
          </li>
        ))}
      </ul>
      {msg && <p role="alert" className="mt-2 text-sm font-semibold text-flamingo">{msg}</p>}
    </section>
  );
}
