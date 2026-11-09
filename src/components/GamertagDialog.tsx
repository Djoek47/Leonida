"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import type { Profile } from "@/lib/useUser";

const WHERE: Record<string, { name: string; path: string[] }> = {
  ps5: { name: "PlayStation", path: ["Settings", "Users and Accounts", "Profile", "About me"] },
  xbox: { name: "Xbox", path: ["Profile and system", "My profile", "Customize profile", "Bio"] },
  pc: { name: "PC", path: ["socialclub.rockstargames.com", "Settings", "Profile", "About me"] },
};

/** Proving a gamertag is yours, in three moves: say which tag, put a short
 *  code on that profile where only its owner can write, tell us. Staff look,
 *  tick it, and the code can come off. Prize money waits on this, because a
 *  clip pays whoever owns the tag in it. */
export function GamertagDialog({ profile, onClose, onSaved }: {
  profile: Profile; onClose: () => void; onSaved: (p: Partial<Profile>) => void;
}) {
  const [tag, setTag] = useState(profile.gamertag ?? "");
  const [platform, setPlatform] = useState(profile.platform ?? "ps5");
  const [code, setCode] = useState(profile.verify_code ?? "");
  const [step, setStep] = useState(profile.gamertag ? 2 : 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);

  async function saveTag(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const t = tag.trim(); if (!t) return;
    setBusy(true);
    const c = sb();
    const { data, error } = c ? await c.from("profiles").update({ gamertag: t, platform })
      .eq("id", profile.id).select("gamertag, platform, verify_code, gamertag_verified").single() : { data: null, error: null };
    setBusy(false);
    if (error) { setErr("Couldn't save that. Try again."); return; }
    if (data) { setCode(data.verify_code ?? code); onSaved(data as Partial<Profile>); }
    setStep(2);
  }

  async function requestCheck() {
    setBusy(true);
    const c = sb(); if (c) await c.rpc("request_gamertag_check");
    setBusy(false); onSaved({ verify_requested_at: new Date().toISOString() } as Partial<Profile>); setStep(3);
  }

  const w = WHERE[platform] ?? WHERE.ps5;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="gt-t" className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" onClick={onClose}>
      <div className="gt-card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="gt-head">
          <p className="gt-k">Prove it&apos;s yours</p>
          <h2 id="gt-t" className="display text-3xl md:text-4xl">Verify your gamertag</h2>
          <p className="text-sm opacity-85 mt-1">Prize money goes to whoever owns the tag in the clip. This is how we know it&apos;s you.</p>
          <ol className="gt-dots" aria-hidden>{[1, 2, 3].map((n) => <li key={n} className={n <= step ? "on" : ""}>{n}</li>)}</ol>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={saveTag} className="grid gap-4">
              <div className="gt-plats" role="radiogroup" aria-label="Platform">
                {Object.entries(WHERE).map(([id, v]) => (
                  <button key={id} type="button" role="radio" aria-checked={platform === id} onClick={() => setPlatform(id)}
                    className={platform === id ? "on" : ""}>{v.name}</button>
                ))}
              </div>
              <label className="grid gap-1.5 text-sm font-bold">Your {w.name} gamertag
                <input autoFocus value={tag} onChange={(e) => setTag(e.target.value)} required maxLength={40} className="field" placeholder="Exactly as it shows in game" />
              </label>
              {err && <p className="text-sm font-semibold text-flamingo">{err}</p>}
              <button disabled={busy} className="btn btn-hot">{busy ? "Saving…" : "Next"}</button>
            </form>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <p className="text-sm">Put this code in your <b>{w.name}</b> profile for <b>{tag || profile.gamertag}</b>:</p>
              <p className="gt-code" aria-label={`Code ${code.split("").join(" ")}`}>{code}</p>
              <ol className="gt-path">{w.path.map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}</ol>
              <p className="text-xs opacity-75">Only the account owner can edit that field, which is the whole point. You can delete the code once you&apos;re verified.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={requestCheck} disabled={busy} className="btn btn-hot flex-1">{busy ? "Sending…" : "I've added the code"}</button>
                <button onClick={() => setStep(1)} className="btn btn-ghost">Change tag</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 text-center">
              <p className="gt-stamp">PENDING CHECK</p>
              <p>Staff will look at <b>{tag || profile.gamertag}</b>, usually within a day. You&apos;ll get an email the moment it&apos;s verified.</p>
              <button autoFocus onClick={onClose} className="btn btn-hot">Got it</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
