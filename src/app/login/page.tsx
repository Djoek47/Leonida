"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb, isLive } from "@/lib/supabase";
import { plainAuthError } from "@/lib/authErrors";

type Mode = "in" | "up" | "link" | "forgot";

const TITLE: Record<Mode, string> = {
  in: "Sign in",
  up: "Make an account",
  link: "Email me a link",
  forgot: "Reset your password",
};

export default function Login() {
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    setNext(new URLSearchParams(location.search).get("next") ?? "/dashboard");
  }, []);
  const redirectTo = typeof window !== "undefined" ? `${location.origin}${next}` : undefined;

  function go(m: Mode) { setMode(m); setErr(null); setDone(null); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = sb();
    if (!c) { setErr("Accounts aren't switched on in this build."); return; }
    setBusy(true); setErr(null); setDone(null);
    try {
      if (mode === "in") {
        const { error } = await c.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.href = next;
        return;
      }
      if (mode === "up") {
        const { data, error } = await c.auth.signUp({
          email, password,
          options: { data: name.trim() ? { name: name.trim() } : undefined, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (data.session) { location.href = next; return; }
        setDone(`Account made. We've sent a confirmation to ${email} — open it, then sign in.`);
        setMode("in");
        return;
      }
      if (mode === "link") {
        const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        setDone(`Sign-in link sent to ${email}. It's good for one hour.`);
        return;
      }
      const { error } = await c.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/login/reset`,
      });
      if (error) throw error;
      setDone(`If there's an account on ${email}, a reset link is on its way.`);
    } catch (x) {
      setErr(plainAuthError(x instanceof Error ? x.message : "That didn't work. Try again."));
    } finally { setBusy(false); }
  }

  async function oauth(provider: "discord" | "twitch" | "google") {
    const c = sb();
    if (!c) return;
    setErr(null);
    const { error } = await c.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) setErr(plainAuthError(error.message));
  }

  const wantsPassword = mode === "in" || mode === "up";

  return (
    <div className="relative min-h-[80vh] grid lg:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/art/jason_lucia_motel_portrait.webp" alt=""
           className="hidden lg:block h-full w-full object-cover" />

      <div className="px-4 py-14 sm:px-10 lg:px-16 flex flex-col justify-center [&>*]:min-w-0">
        <div className="w-full max-w-md">
          <p className="inline-flex rounded-full bg-mango px-3 py-1 text-xs font-black text-[#1c1710]">
            FREE TO JOIN · FREE TO WIN
          </p>
          <h1 className="display mt-4 text-[clamp(2.4rem,7vw,4rem)] leading-[0.95]">{TITLE[mode]}</h1>
          <p className="text-haze mt-3">
            {mode === "up" ? "One account to send clips, vote and collect winnings."
              : mode === "forgot" ? "We'll email you a link to set a new one."
              : mode === "link" ? "No password needed — we'll email you a one-time link."
              : "Welcome back."}
          </p>

          {!isLive && (
            <p className="mt-5 rounded-lg border-2 border-line bg-ink px-4 py-2.5 text-sm font-semibold">
              Demo build: accounts aren&apos;t connected here.
            </p>
          )}

          <form onSubmit={submit} className="mt-7 grid gap-4">
            {mode === "up" && (
              <label className="grid gap-1.5">
                <span className="text-sm font-bold">Display name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname"
                  maxLength={40} placeholder="What people see on your clips" className="field" />
              </label>
            )}

            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                autoComplete="email" inputMode="email" placeholder="you@example.com" className="field" />
            </label>

            {wantsPassword && (
              <label className="grid gap-1.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold">Password</span>
                  {mode === "in" && (
                    <button type="button" onClick={() => go("forgot")}
                      className="text-xs font-bold text-gulf underline underline-offset-4">
                      Forgotten it?
                    </button>
                  )}
                </span>
                <span className="relative block">
                  <input value={password} onChange={(e) => setPassword(e.target.value)}
                    type={show ? "text" : "password"} required minLength={8}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    placeholder={mode === "up" ? "At least 8 characters" : ""}
                    className="field pr-16" />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-bold text-haze hover:text-foam"
                    aria-label={show ? "Hide password" : "Show password"}>
                    {show ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            )}

            <button disabled={busy} className="btn btn-hot justify-center disabled:opacity-70">
              {busy ? "One moment…"
                : mode === "up" ? "Create my account"
                : mode === "in" ? "Sign in"
                : mode === "link" ? "Send me a link"
                : "Send the reset link"}
            </button>
          </form>

          <div aria-live="polite">
            {done && <p className="mt-4 rounded-lg border-2 border-gulf bg-gulf/10 px-4 py-2.5 font-semibold text-gulf">{done}</p>}
            {err && <p role="alert" className="mt-4 rounded-lg border-2 border-flamingo bg-flamingo/10 px-4 py-2.5 font-semibold text-flamingo">{err}</p>}
          </div>

          <p className="mt-6 text-sm">
            {mode === "in" && <>New here? <button onClick={() => go("up")} className="font-bold text-gulf underline underline-offset-4">Make an account</button></>}
            {mode === "up" && <>Already have one? <button onClick={() => go("in")} className="font-bold text-gulf underline underline-offset-4">Sign in</button></>}
            {(mode === "link" || mode === "forgot") && <button onClick={() => go("in")} className="font-bold text-gulf underline underline-offset-4">← Back to sign in</button>}
          </p>

          {mode !== "forgot" && (
            <>
              <p className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-haze">
                <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
              </p>
              <div className="grid gap-2.5">
                {mode !== "link" && (
                  <button onClick={() => go("link")} className="btn btn-ghost justify-center">
                    Email me a sign-in link
                  </button>
                )}
                <button onClick={() => oauth("discord")} className="btn justify-center bg-[#5865F2] text-white hover:brightness-110">Continue with Discord</button>
                <button onClick={() => oauth("twitch")} className="btn justify-center bg-[#9146FF] text-white hover:brightness-110">Continue with Twitch</button>
                <button onClick={() => oauth("google")} className="btn btn-ghost justify-center">Continue with Google</button>
              </div>
            </>
          )}

          <p className="mt-8 text-xs text-haze">
            By making an account you agree to the{" "}
            <Link href="/rules" className="underline underline-offset-4">contest rules</Link>.
            You must be 18 or over.
          </p>
        </div>
      </div>
    </div>
  );
}
