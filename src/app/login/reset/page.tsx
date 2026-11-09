"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { plainAuthError } from "@/lib/authErrors";

/** Where the reset email lands. Supabase puts the caller in a recovery session
 *  when they arrive here, so all that's left is choosing the new password. */
export default function Reset() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const c = sb();
    if (!c) { setReady(false); return; }
    // The link may still be being exchanged for a session when we mount.
    c.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = c.auth.onAuthStateChange((_e, s) => { if (s) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const c = sb(); if (!c) return;
    setBusy(true); setErr(null);
    const { error } = await c.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(plainAuthError(error.message));
    else { setDone(true); setTimeout(() => { location.href = "/dashboard"; }, 1400); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 [&>*]:min-w-0">
      <h1 className="display text-[clamp(2.2rem,8vw,3.5rem)]">Set a new password</h1>

      {ready === false && (
        <p className="mt-5 rounded-lg border-2 border-flamingo bg-flamingo/10 px-4 py-3 font-semibold text-flamingo">
          This link has expired or was already used.{" "}
          <a href="/login" className="underline underline-offset-4">Ask for a fresh one</a>.
        </p>
      )}

      {done ? (
        <p className="mt-5 rounded-lg border-2 border-gulf bg-gulf/10 px-4 py-3 font-semibold text-gulf">
          Done. Taking you to your dashboard…
        </p>
      ) : ready && (
        <form onSubmit={save} className="mt-7 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">New password</span>
            <span className="relative block">
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"} required minLength={8} autoComplete="new-password"
                placeholder="At least 8 characters" className="field pr-16" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-bold text-haze hover:text-foam"
                aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
            </span>
          </label>
          <button disabled={busy} className="btn btn-hot justify-center disabled:opacity-70">
            {busy ? "Saving…" : "Save it"}
          </button>
          {err && <p role="alert" className="font-semibold text-flamingo">{err}</p>}
        </form>
      )}
    </div>
  );
}
