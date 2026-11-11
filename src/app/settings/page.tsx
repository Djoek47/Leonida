"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { plainAuthError } from "@/lib/authErrors";
import { TierMedal } from "@/components/TierMedal";
import { CoinAvatar } from "@/components/CoinAvatar";
import { NotificationCenter } from "@/components/NotificationCenter";
import type { TierId } from "@/lib/tiers";

const METHODS: [string, string][] = [
  ["paypal", "PayPal"], ["venmo", "Venmo"], ["cashapp", "Cash App"], ["interac", "Interac e-Transfer"], ["wise", "Wise"],
];
const PLATFORMS: [string, string][] = [["ps5", "PlayStation 5"], ["xbox", "Xbox Series X|S"], ["pc", "PC"]];

const BLOCK_TEXT: Record<string, string> = {
  balance: "You still have money in your wallet. Cash it out first.",
  subscription: "Your plan is still active. Cancel it first so it stops billing.",
  winnings: "A prize of yours is still being paid. Wait for it to land.",
};

type Note = { kind: "ok" | "err"; text: string } | null;

function Flash({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p role={note.kind === "err" ? "alert" : "status"}
       className={`mt-3 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${
         note.kind === "ok" ? "border-gulf bg-gulf/10 text-gulf" : "border-flamingo bg-flamingo/10 text-flamingo"}`}>
      {note.text}
    </p>
  );
}

export default function Settings() {
  const { user, profile, setProfile, loading, paying, demo } = useUser();
  const [ends, setEnds] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [pNote, setPNote] = useState<Note>(null);
  const [eNote, setENote] = useState<Note>(null);
  const [wNote, setWNote] = useState<Note>(null);
  const [mNote, setMNote] = useState<Note>(null);
  const [dNote, setDNote] = useState<Note>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-haze">Loading your settings…</div>;
  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="display text-5xl">Settings</h1>
        <p className="mt-3 text-haze">Sign in to change your account.</p>
        <Link href="/login?next=/settings" className="btn btn-hot mt-6">Sign in</Link>
      </div>
    );
  }

  const tier = ((paying ? profile.tier : "free") ?? "free") as TierId;
  const c = sb();

  async function token() {
    return (await c?.auth.getSession())?.data.session?.access_token;
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = {
      display_name: String(f.get("display_name")).trim().slice(0, 40) || profile!.display_name,
      platform: String(f.get("platform")) || null,
      gamertag: String(f.get("gamertag")).trim() || null,
    };
    // A new gamertag has to be proven again; the database resets the badge
    // itself when the tag changes, so we only need to reflect it here.
    const retag = patch.gamertag !== profile!.gamertag;
    setBusy("profile"); setPNote(null);
    if (c) {
      const { error } = await c.from("profiles").update(patch).eq("id", user!.id);
      if (error) { setBusy(null); setPNote({ kind: "err", text: error.message }); return; }
    }
    setProfile({ ...profile!, ...patch, ...(retag ? { gamertag_verified: false } : {}) });
    setBusy(null);
    setPNote({ kind: "ok", text: retag && patch.gamertag ? "Saved. Verify the new gamertag on your dashboard before a win can pay out." : "Saved." });
  }

  async function setPhoto(file: File | null) {
    if (!c || !user) return;
    setBusy("photo"); setPNote(null);
    try {
      let path: string | null = null;
      if (file) {
        const bmp = await createImageBitmap(file);
        const side = Math.min(bmp.width, bmp.height), cv = document.createElement("canvas");
        cv.width = cv.height = 256;
        cv.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 256, 256);
        const blob: Blob | null = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.85));
        if (!blob) throw new Error("That image couldn't be read.");
        path = `${user.id}/${Date.now()}.jpg`;
        const up = await c.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
      }
      const old = profile!.avatar_path;
      const { error } = await c.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      if (error) throw error;
      if (old) c.storage.from("avatars").remove([old]).catch(() => {});
      setProfile({ ...profile!, avatar_path: path });
      dispatchEvent(new CustomEvent("lfl:avatar", { detail: { avatar_path: path } }));
      setPNote({ kind: "ok", text: path ? "Profile picture saved." : "Picture removed. Your plan badge shows instead." });
    } catch (e) {
      setPNote({ kind: "err", text: e instanceof Error ? e.message : "That didn't go through." });
    }
    setBusy(null);
  }

  async function savePayout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = { payout_method: String(f.get("method")), payout_handle: String(f.get("handle")).trim() };
    setBusy("payout"); setWNote(null);
    if (c) {
      const { error } = await c.from("profiles").update(patch).eq("id", user!.id);
      if (error) { setBusy(null); setWNote({ kind: "err", text: error.message }); return; }
    }
    setProfile({ ...profile!, ...patch });
    setBusy(null); setWNote({ kind: "ok", text: "Payout account saved." });
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!c || email === user!.email) return;
    setBusy("email"); setENote(null);
    const { error } = await c.auth.updateUser({ email }, { emailRedirectTo: `${location.origin}/settings` });
    setBusy(null);
    setENote(error ? { kind: "err", text: plainAuthError(error.message) }
      : { kind: "ok", text: `Check ${email} — the change finishes when you click the link we sent.` });
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const a = String(f.get("pw")), b = String(f.get("pw2"));
    if (a !== b) { setMNote({ kind: "err", text: "Those two don't match." }); return; }
    if (!c) return;
    setBusy("pw"); setMNote(null);
    const { error } = await c.auth.updateUser({ password: a });
    setBusy(null);
    if (error) setMNote({ kind: "err", text: plainAuthError(error.message) });
    else { (e.target as HTMLFormElement).reset(); setMNote({ kind: "ok", text: "Password changed." }); }
  }

  async function signOutEverywhere() {
    setBusy("out");
    await c?.auth.signOut({ scope: "global" });
    location.href = "/";
  }

  async function cancelPlan(resume = false) {
    setBusy("cancel");
    const t = await token();
    const headers = { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) };
    const r = await fetch("/api/billing/cancel", { method: "POST", headers, body: JSON.stringify({ resume }) });
    const j = await r.json().catch(() => ({}));
    if (j.mock) {
      await fetch("/api/mock/subscribe", { method: "POST", headers, body: JSON.stringify({ cancel: true }) });
      location.reload(); return;
    }
    setBusy(null);
    setEnds(resume ? null : (j.endsAt ?? null));
  }

  async function deleteAccount() {
    setBusy("delete"); setDNote(null);
    const t = await token();
    const r = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ confirm }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (j.ok) { await c?.auth.signOut(); location.href = "/?deleted=1"; return; }
    if (j.blocked) {
      setDNote({ kind: "err", text: (j.blocked as string[]).map((b) => BLOCK_TEXT[b] ?? b).join(" ") });
      return;
    }
    setDNote({ kind: "err", text: j.error ?? "That didn't go through." });
  }

  return (
    <div className={`dash dash-${tier}`}>
    <div className="mx-auto max-w-3xl px-4 py-12 [&>*]:min-w-0">
      <div className="flex items-center gap-4">
        <TierMedal tier={tier} className="size-20 shrink-0" />
        <div className="min-w-0">
          <h1 className="display text-[clamp(2.2rem,8vw,3.6rem)] leading-none">Settings</h1>
          <p className="text-haze mt-1 truncate">{user.email}</p>
        </div>
      </div>
      {demo && <p className="mt-4 text-sm text-haze">Demo build: nothing here is saved.</p>}

      <section className="set-card">
        <h2>Profile</h2>
        <div className="mb-4 flex items-center gap-4">
          <CoinAvatar tier={tier} path={profile.avatar_path} name={profile.display_name} className="size-20 shrink-0" />
          <div className="grid gap-1.5">
            <span className="text-sm font-bold">Profile picture</span>
            <span className="text-xs text-haze">Shown next to your clips. Without one, your plan badge shows.</span>
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-ghost !py-1.5 !px-4 text-sm cursor-pointer">
                {busy === "photo" ? "Saving…" : "Upload"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy === "photo"}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setPhoto(f); }} />
              </label>
              {profile.avatar_path && <button type="button" className="btn btn-ghost !py-1.5 !px-4 text-sm" onClick={() => setPhoto(null)}>Remove</button>}
            </div>
          </div>
        </div>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-bold">Display name</span>
            <input name="display_name" defaultValue={profile.display_name} maxLength={40} className="field" required />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Platform</span>
            <select name="platform" defaultValue={profile.platform ?? ""} className="field">
              <option value="">Choose…</option>
              {PLATFORMS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Gamertag</span>
            <input name="gamertag" defaultValue={profile.gamertag ?? ""} maxLength={40} className="field" />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button disabled={busy === "profile"} className="btn btn-hot disabled:opacity-70">
              {busy === "profile" ? "Saving…" : "Save profile"}
            </button>
            {profile.gamertag && (
              <span className={`text-sm font-bold ${profile.gamertag_verified ? "text-gulf" : "text-haze"}`}>
                {profile.gamertag_verified ? "✓ Gamertag verified" : <>Not verified — <Link href="/dashboard#gamertag" className="underline underline-offset-4">verify it</Link></>}
              </span>
            )}
          </div>
        </form>
        <Flash note={pNote} />
      </section>

      <section className="set-card">
          <h2>Money</h2>
          <p className="text-sm opacity-80">Your wallet, where you get paid, prizes and every receipt.</p>
          <a href="/wallet" className="btn btn-hot mt-4 !py-2">Open Wallet &amp; billing</a>
        </section>

      <section className="set-card">
        <h2>Plan</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            <strong className="capitalize">{tier === "free" ? "Free" : tier}</strong>
            {paying && profile.current_period_end && (
              <span className="text-haze"> · renews {new Date(profile.current_period_end).toLocaleDateString()}</span>
            )}
          </p>
          {ends && <p className="w-full text-sm font-semibold text-flamingo">Cancelled. Your perks stay on until {new Date(ends).toLocaleDateString()}, then you move to Free.</p>}
          <div className="flex flex-wrap gap-2">
            <Link href="/pricing" className="btn btn-ghost">{paying ? "Change plan" : "See plans"}</Link>
            {paying && !ends && (
              <button onClick={() => cancelPlan()} disabled={busy === "cancel"} className="stop-btn">
                <span>{busy === "cancel" ? "Cancelling…" : "Cancel plan"}</span>
              </button>
            )}
            {paying && ends && (
              <button onClick={() => cancelPlan(true)} disabled={busy === "cancel"} className="btn btn-hot disabled:opacity-70">Keep my plan</button>
            )}
          </div>
        </div>
      </section>

      <section className="set-card">
        <h2>Email</h2>
        <form onSubmit={changeEmail} className="flex flex-wrap gap-2 [&>*]:min-w-0">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
            autoComplete="email" className="field flex-1 min-w-[14rem]" aria-label="Email address" />
          <button disabled={busy === "email" || email === user.email} className="btn btn-ghost disabled:opacity-60">
            {busy === "email" ? "Sending…" : "Change email"}
          </button>
        </form>
        <Flash note={eNote} />
      </section>

      <NotificationCenter userId={user.id} />

      <section className="set-card">
        <h2>Password</h2>
        <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end [&>*]:min-w-0">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">New password</span>
            <input name="pw" type="password" minLength={8} required autoComplete="new-password" className="field" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Again</span>
            <input name="pw2" type="password" minLength={8} required autoComplete="new-password" className="field" />
          </label>
          <button disabled={busy === "pw"} className="btn btn-ghost disabled:opacity-70">
            {busy === "pw" ? "Saving…" : "Change it"}
          </button>
        </form>
        <Flash note={mNote} />
      </section>

      <section className="set-card">
        <h2>Sessions</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-haze text-sm">Signed in on a phone you&apos;ve lost, or a friend&apos;s laptop?</p>
          <button onClick={signOutEverywhere} disabled={busy === "out"} className="btn btn-ghost disabled:opacity-70">
            {busy === "out" ? "Signing out…" : "Sign out everywhere"}
          </button>
        </div>
      </section>

      <section className="set-card set-danger">
        <h2 className="flex items-center gap-3"><i className="stop-mark" aria-hidden>!</i>Delete account</h2>
        <p className="text-sm">
          Removes your login, profile, wallet history and votes. Clips you sent stay in the contest
          archive without your name on them. This can&apos;t be undone.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 [&>*]:min-w-0">
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type DELETE"
            aria-label="Type DELETE to confirm" className="field flex-1 min-w-[10rem]" />
          <button onClick={deleteAccount} disabled={confirm !== "DELETE" || busy === "delete"} className="stop-btn stop-lg">
            <span>{busy === "delete" ? "Deleting…" : "Delete my account"}</span>
          </button>
        </div>
        <Flash note={dNote} />
      </section>
    </div>
    </div>
  );
}
