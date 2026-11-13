"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb, isLive } from "@/lib/supabase";
import { plainAuthError } from "@/lib/authErrors";

type Mode = "in" | "up" | "link" | "forgot";

const HEAD: Record<Mode, { kicker: string; title: string; blurb: string }> = {
  in:     { kicker: "Leonida ID", title: "Sign in", blurb: "Welcome back. Your clips, votes and winnings are where you left them." },
  up:     { kicker: "New resident", title: "Make an account", blurb: "One account to send clips, vote on the week, and collect what you win." },
  link:   { kicker: "No password", title: "Email me a link", blurb: "We'll send a one-time link. Opening it signs you straight in." },
  forgot: { kicker: "Lost password", title: "Set a new one", blurb: "We'll email you a link to pick a new password." },
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
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setNext(q.get("next") ?? "/dashboard");
    if (q.get("confirmed")) { setDone("Email confirmed. Sign in and you're away."); setMode("in"); }
    if (q.get("email")) setEmail(q.get("email")!);
  }, []);
  const redirectTo = typeof window !== "undefined"
    ? `${location.origin}/auth/confirm?next=${encodeURIComponent(next)}` : undefined;

  // While this tab waits on a confirmation, it watches for the session the
  // confirm page creates — in another tab, or anywhere in this browser — and
  // carries the member through without a second sign-in.
  useEffect(() => {
    if (!waiting) return;
    const c = sb();
    if (!c) return;
    let dead = false;
    const land = () => { if (!dead) { dead = true; location.href = next; } };
    const check = async () => { const { data } = await c.auth.getSession(); if (data.session) land(); };
    const { data: sub } = c.auth.onAuthStateChange((_e, session) => { if (session) land(); });
    const ch = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("lfl-auth") : null;
    if (ch) ch.onmessage = (m) => { if (m.data?.type === "signed-in") check(); };
    const id = setInterval(check, 2500);
    const vis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", vis);
    return () => { dead = true; clearInterval(id); sub.subscription.unsubscribe(); ch?.close(); document.removeEventListener("visibilitychange", vis); };
  }, [waiting, next]);

  function go(m: Mode) { setMode(m); setErr(null); setDone(null); setWaiting(false); }

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
        setDone(`Account made. Open the confirmation we sent to ${email} — leave this tab open and it signs you in by itself.`);
        setMode("in"); setWaiting(true);
        return;
      }
      if (mode === "link") {
        const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        setDone(`Link sent to ${email}. Leave this tab open — opening the link signs you in right here.`);
        setWaiting(true);
        return;
      }
      const { error } = await c.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/confirm?next=/login/reset`,
      });
      if (error) throw error;
      setDone(`If there's an account on ${email}, a reset link is on its way.`);
    } catch (x) {
      setErr(plainAuthError(x instanceof Error ? x.message : "That didn't work. Try again."));
    } finally { setBusy(false); }
  }

  const wantsPassword = mode === "in" || mode === "up";
  const h = HEAD[mode];

  return (
    <div className="login-wrap">
      <div className="login-art" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/art/jason_lucia_motel_portrait.webp" alt="" />
        <div className="login-art-ink" />
        <figcaption className="login-art-words">
          <p className="login-art-k">In clips we trust</p>
          <p className="login-art-t">Film the mayhem.<br />The state votes.<br /><b>You get paid.</b></p>
        </figcaption>
      </div>

      <div className="login-col">
        <div className="login-stack">
        <div className="login-masthead">
          <p className="login-mast-k">Live From Leonida</p>
          <p className="login-mast-sub">The GTA VI clip contest. Send clips, win the week, cash out.</p>
          <ul className="login-perks">
            <li><b>Free</b> to join &amp; win</li>
            <li><b>Weekly</b> cash prizes</li>
          </ul>
        </div>
        <div className="set-card login-panel">
          <h2>{h.kicker}</h2>

          <div className="px-1">
            <h1 className="display text-[clamp(2.1rem,6vw,3.2rem)] leading-[0.95]">{h.title}</h1>
            <p className="text-haze mt-2.5">{h.blurb}</p>

            {!isLive && (
              <p className="mt-5 rounded-lg border-2 border-line bg-ink px-4 py-2.5 text-sm font-semibold">
                Demo build: accounts aren&apos;t connected here.
              </p>
            )}

            <form onSubmit={submit} className="mt-6 grid gap-4">
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
              {done && (
                <div className="login-note">
                  <p className="font-semibold">{done}</p>
                  {waiting && <p className="login-wait"><i /><i /><i /> Waiting on that link…</p>}
                </div>
              )}
              {err && <p role="alert" className="mt-4 rounded-lg border-2 border-flamingo bg-flamingo/10 px-4 py-2.5 font-semibold text-flamingo">{err}</p>}
            </div>

            {mode !== "forgot" && (
              <>
                <p className="login-or"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></p>
                {mode === "link"
                  ? <button onClick={() => go("in")} className="btn btn-ghost w-full justify-center">Use my password instead</button>
                  : <button onClick={() => go("link")} className="btn btn-ghost w-full justify-center">Email me a sign-in link</button>}
              </>
            )}

            <p className="mt-6 text-sm">
              {mode === "in" && <>New here? <button onClick={() => go("up")} className="font-bold text-gulf underline underline-offset-4">Make an account</button></>}
              {mode === "up" && <>Already have one? <button onClick={() => go("in")} className="font-bold text-gulf underline underline-offset-4">Sign in</button></>}
              {(mode === "link" || mode === "forgot") && <button onClick={() => go("in")} className="font-bold text-gulf underline underline-offset-4">← Back to sign in</button>}
            </p>
          </div>
        </div>

        <p className="login-fine">
          You must be 18 or over, and the{" "}
          <Link href="/rules" className="underline underline-offset-4">contest rules</Link> apply.
        </p>
        </div>
      </div>
    </div>
  );
}
