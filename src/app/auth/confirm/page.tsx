"use client";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { sb } from "@/lib/supabase";

type State = "working" | "in" | "already" | "bad";

/** Landing page for every email link (confirm sign-up, sign-in link, reset,
 *  email change). It verifies the token, signs the member in, and tells the
 *  tab they started in to carry on without them. */
export default function Confirm() {
  const [state, setState] = useState<State>("working");
  const [next, setNext] = useState("/dashboard");
  const [why, setWhy] = useState("");

  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(location.search);
      const h = new URLSearchParams(location.hash.slice(1));
      const raw = q.get("next") || "/dashboard";
      const to = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
      setNext(to);

      const c = sb();
      if (!c) { location.replace("/login"); return; }

      const err = q.get("error_description") || h.get("error_description");
      if (err) { setWhy(err.replace(/\+/g, " ")); setState("bad"); return; }

      try {
        const token_hash = q.get("token_hash");
        const type = q.get("type") as EmailOtpType | null;
        const code = q.get("code");
        if (token_hash && type) {
          const { error } = await c.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
        } else if (code) {
          const { error } = await c.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data } = await c.auth.getSession();
        if (!data.session) { setState("already"); return; }

        // Tell the tab they started in. It signs itself in and moves on.
        try { const ch = new BroadcastChannel("lfl-auth"); ch.postMessage({ type: "signed-in", next: to }); ch.close(); } catch {}

        // A password reset has nowhere to wait: send them straight to the form.
        if (to === "/login/reset") { location.replace(to); return; }
        setState("in");
      } catch {
        // Used already, or expired. The address is confirmed either way.
        setState("already");
      }
    })();
  }, []);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-16">
      <div className="set-card w-full max-w-lg px-6 py-8 text-center sm:px-10">
        {state === "working" && (
          <>
            <h1 className="display text-3xl">Checking your link…</h1>
            <p className="text-haze mt-3">One moment.</p>
          </>
        )}

        {state === "in" && (
          <>
            <p className="inline-flex rounded-full bg-gulf px-3 py-1 text-xs font-black text-white">EMAIL CONFIRMED</p>
            <h1 className="display mt-4 text-[clamp(2rem,6vw,2.8rem)] leading-[0.95]">You&apos;re in</h1>
            <p className="mt-4 text-lg font-semibold">
              Head back to the tab you started in — it&apos;s already signed you in.
            </p>
            <p className="text-haze mt-2 text-sm">
              Closed it, or came in from your email app? Carry on right here.
            </p>
            <a href={next} className="btn btn-hot mt-6 justify-center">Continue here</a>
          </>
        )}

        {state === "already" && (
          <>
            <p className="inline-flex rounded-full bg-mango px-3 py-1 text-xs font-black text-[#1c1710]">EMAIL CONFIRMED</p>
            <h1 className="display mt-4 text-[clamp(2rem,6vw,2.8rem)] leading-[0.95]">All set</h1>
            <p className="mt-4 text-lg font-semibold">
              This link has already done its job. Sign in to get going.
            </p>
            <p className="text-haze mt-2 text-sm">
              If you opened the email on another device, sign in there or here — either works.
            </p>
            <a href={`/login?confirmed=1&next=${encodeURIComponent(next)}`} className="btn btn-hot mt-6 justify-center">Sign in</a>
          </>
        )}

        {state === "bad" && (
          <>
            <h1 className="display text-[clamp(2rem,6vw,2.8rem)] leading-[0.95]">That link didn&apos;t work</h1>
            <p className="mt-4 font-semibold">{why || "It may have expired."}</p>
            <p className="text-haze mt-2 text-sm">Ask for a fresh one and it&apos;ll be with you in seconds.</p>
            <a href="/login" className="btn btn-hot mt-6 justify-center">Back to sign in</a>
          </>
        )}
      </div>
    </main>
  );
}
