"use client";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import type { Profile } from "@/lib/useUser";

const WHERE: Record<string, { name: string; path: string[] }> = {
  ps5: { name: "PlayStation", path: ["Settings", "Users and Accounts", "Profile", "About me"] },
  xbox: { name: "Xbox", path: ["Profile and system", "My profile", "Customize profile", "Bio"] },
  pc: { name: "PC", path: ["socialclub.rockstargames.com", "Settings", "Profile", "About me"] },
};

type Step = 1 | 2 | 3 | 4;

/** Proving a gamertag is yours, two ways: put a short code on the profile
 *  where only its owner can write, or send a photo of you signed in as that
 *  tag. Staff look, tick it, done. Prize money waits on this, because a clip
 *  pays whoever owns the tag in it. */
export function GamertagDialog({ profile, onClose, onSaved }: {
  profile: Profile; onClose: () => void; onSaved: (p: Partial<Profile>) => void;
}) {
  const [tag, setTag] = useState(profile.gamertag ?? "");
  const [platform, setPlatform] = useState(profile.platform ?? "ps5");
  const [code, setCode] = useState(profile.verify_code ?? "");
  const [step, setStep] = useState<Step>(profile.gamertag ? 2 : 1);
  const [way, setWay] = useState<"code" | "photo" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

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

  async function sendCode() {
    setBusy(true); setErr("");
    const c = sb();
    if (c) {
      const { error } = await c.rpc("request_gamertag_check", { p_method: "code", p_photo: null });
      if (error) { setBusy(false); setErr("That didn't go through. Try again."); return; }
    }
    setBusy(false);
    onSaved({ verify_requested_at: new Date().toISOString() } as Partial<Profile>);
    setStep(4);
  }

  async function sendPhoto() {
    if (!file) { setErr("Pick a photo first."); return; }
    setBusy(true); setErr("");
    const c = sb();
    if (c) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${profile.id}/proof-${Date.now()}.${ext}`;
      const up = await c.storage.from("gamertags").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (up.error) { setBusy(false); setErr("The photo didn't upload. Smaller file, or try again."); return; }
      const { error } = await c.rpc("request_gamertag_check", { p_method: "photo", p_photo: path });
      if (error) { setBusy(false); setErr("That didn't go through. Try again."); return; }
    }
    setBusy(false);
    onSaved({ verify_requested_at: new Date().toISOString() } as Partial<Profile>);
    setStep(4);
  }

  const w = WHERE[platform] ?? WHERE.ps5;
  const shownTag = tag || profile.gamertag;
  const dots = step === 4 ? 3 : step === 3 ? 2 : step;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="gt-t" className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" onClick={onClose}>
      <div className="gt-card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="gt-head">
          <p className="gt-k">Prove it&apos;s yours</p>
          <h2 id="gt-t" className="display text-3xl md:text-4xl">Verify your gamertag</h2>
          <p className="text-sm opacity-85 mt-1">Prize money goes to whoever owns the tag in the clip. This is how we know it&apos;s you.</p>
          <ol className="gt-dots" aria-hidden>{[1, 2, 3].map((n) => <li key={n} className={n <= dots ? "on" : ""}>{n}</li>)}</ol>
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
            <div className="grid gap-3">
              <p className="text-sm">Two ways to prove <b>{shownTag}</b> is yours. Pick whichever is quicker for you:</p>
              <button onClick={() => { setWay("code"); setStep(3); }} className="gt-way">
                <b>Put a code on your profile</b>
                <span>We give you a short code; you drop it in your {w.name} bio. Only the owner can.</span>
              </button>
              <button onClick={() => { setWay("photo"); setStep(3); }} className="gt-way">
                <b>Send a photo</b>
                <span>A clear shot of your screen signed in as {shownTag} — usually the fastest check.</span>
              </button>
              <button onClick={() => setStep(1)} className="btn btn-ghost mt-1">Change tag</button>
            </div>
          )}

          {step === 3 && way === "code" && (
            <div className="grid gap-4">
              <p className="text-sm">Put this code in your <b>{w.name}</b> profile for <b>{shownTag}</b>:</p>
              <p className="gt-code" aria-label={`Code ${code.split("").join(" ")}`}>{code}</p>
              <ol className="gt-path">{w.path.map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}</ol>
              <p className="text-xs opacity-75">Only the account owner can edit that field, which is the whole point. You can delete the code once you&apos;re verified.</p>
              {err && <p className="text-sm font-semibold text-flamingo">{err}</p>}
              <div className="flex flex-wrap gap-3">
                <button onClick={sendCode} disabled={busy} className="btn btn-hot flex-1">{busy ? "Sending…" : "I've added the code"}</button>
                <button onClick={() => setStep(2)} className="btn btn-ghost">Back</button>
              </div>
            </div>
          )}

          {step === 3 && way === "photo" && (
            <div className="grid gap-4">
              <p className="text-sm">
                Take a photo or screenshot that shows <b>{shownTag}</b> signed in on {w.name} — the
                profile screen or the in-game pause menu both work. Sharp and readable beats artistic.
              </p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setErr(""); if (preview) URL.revokeObjectURL(preview); setPreview(f ? URL.createObjectURL(f) : null); }} />
              {preview
                // eslint-disable-next-line @next/next/no-img-element
                ? <button onClick={() => fileRef.current?.click()} className="block"><img src={preview} alt="Your proof photo" className="max-h-56 w-full rounded-lg border-2 border-line object-contain bg-black" /><span className="mt-1 block text-xs underline underline-offset-4">Pick a different photo</span></button>
                : <button onClick={() => fileRef.current?.click()} className="rounded-lg border-2 border-dashed border-line px-4 py-10 text-sm font-bold hover:border-gulf">Choose a photo…</button>}
              <p className="text-xs opacity-75">PNG, JPG or WebP, up to 10 MB. Staff see it; nobody else does.</p>
              {err && <p className="text-sm font-semibold text-flamingo">{err}</p>}
              <div className="flex flex-wrap gap-3">
                <button onClick={sendPhoto} disabled={busy || !file} className="btn btn-hot flex-1 disabled:opacity-60">{busy ? "Uploading…" : "Send it for checking"}</button>
                <button onClick={() => setStep(2)} className="btn btn-ghost">Back</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-3 text-center">
              <p className="gt-stamp">PENDING CHECK</p>
              <p>Staff will look at <b>{shownTag}</b>, usually within a day. You&apos;ll get an email the moment it&apos;s verified.</p>
              <button autoFocus onClick={onClose} className="btn btn-hot">Got it</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
