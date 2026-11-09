"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase";

type Mode = "password" | "link";

export default function Login() {
  const [mode, setMode] = useState<Mode>("password");
  const [making, setMaking] = useState(false);     // sign up vs sign in
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const next = typeof window !== "undefined" ? new URLSearchParams(location.search).get("next") ?? "/dashboard" : "/dashboard";
  const redirectTo = typeof window !== "undefined" ? `${location.origin}${next}` : undefined;

  async function withPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = sb(); if (!c) { setErr("Sign-in is not switched on in this build."); return; }
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    const name = String(f.get("name") ?? "").trim();
    setBusy(true); setErr(""); setNote("");
    try {
      if (making) {
        const { data, error } = await c.auth.signUp({
          email, password,
          options: { data: name ? { name } : undefined, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        // With email confirmation on, Supabase returns a user but no session.
        if (data.session) location.href = next;
        else setNote("Account made. Check your inbox to confirm it, then sign in.");
      } else {
        const { error } = await c.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.href = next;
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "That didn't work. Try again.");
    } finally { setBusy(false); }
  }

  async function emailLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = sb(); if (!c) { setSent(true); return; }
    setBusy(true); setErr("");
    const { error } = await c.auth.signInWithOtp({
      email: String(new FormData(e.currentTarget).get("email")),
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  async function oauth(provider: "discord" | "twitch" | "google") {
    const c = sb(); if (!c) return;
    await c.auth.signInWithOAuth({ provider, options: { redirectTo } });
  }

  return (
    <div className="relative min-h-[80vh] grid md:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/art/jason_lucia_motel_portrait.webp" alt="" className="hidden md:block h-full w-full object-cover" />
      <div className="px-4 py-16 md:px-16 flex flex-col justify-center max-w-xl [&>*]:min-w-0">
        <h1 className="display text-5xl md:text-7xl">{making ? "Make an account" : "Sign in to Live From Leonida"}</h1>
        <p className="text-haze mt-3">One account to send clips, vote and collect winnings. It&apos;s free.</p>

        {mode === "password" ? (
          <form onSubmit={withPassword} className="mt-8 grid gap-3">
            {making && (
              <label className="grid gap-1.5">
                <span className="text-sm font-bold">Display name</span>
                <input name="name" autoComplete="nickname" placeholder="What people see on your clips" className="field" />
              </label>
            )}
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Email</span>
              <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Password</span>
              <input name="password" type="password" required minLength={8}
                autoComplete={making ? "new-password" : "current-password"}
                placeholder={making ? "At least 8 characters" : ""} className="field" />
            </label>
            <button disabled={busy} className="btn btn-hot justify-center disabled:opacity-70">
              {busy ? "One moment…" : making ? "Create my account" : "Sign in"}
            </button>
            <p className="text-sm text-haze">
              {making ? "Already have one? " : "New here? "}
              <button type="button" onClick={() => { setMaking(!making); setErr(""); setNote(""); }}
                className="text-gulf font-bold underline underline-offset-4">
                {making ? "Sign in instead" : "Make an account"}
              </button>
            </p>
          </form>
        ) : sent ? (
          <p className="mt-8 font-semibold text-gulf">Check your inbox for the sign-in link.</p>
        ) : (
          <form onSubmit={emailLink} className="mt-8 flex gap-2">
            <input name="email" type="email" required placeholder="you@example.com" className="field" />
            <button disabled={busy} className="btn btn-hot shrink-0 disabled:opacity-70">Send link</button>
          </form>
        )}

        {note && <p className="mt-3 font-semibold text-gulf">{note}</p>}
        {err && <p role="alert" className="mt-3 text-flamingo font-semibold">{err}</p>}

        <p className="my-6 text-sm text-haze">or</p>
        <div className="grid gap-3">
          <button onClick={() => { setMode(mode === "password" ? "link" : "password"); setErr(""); setSent(false); }}
            className="btn btn-ghost justify-center">
            {mode === "password" ? "Email me a sign-in link instead" : "Use a password instead"}
          </button>
          <button onClick={() => oauth("discord")} className="btn bg-[#5865F2] text-white justify-center">Continue with Discord</button>
          <button onClick={() => oauth("twitch")} className="btn bg-[#9146FF] text-white justify-center">Continue with Twitch</button>
          <button onClick={() => oauth("google")} className="btn btn-ghost justify-center">Continue with Google</button>
        </div>
      </div>
    </div>
  );
}
