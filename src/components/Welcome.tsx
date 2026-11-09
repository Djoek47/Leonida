"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { TierMedal } from "@/components/TierMedal";
import { tierById, type TierId } from "@/lib/tiers";

/** Shown on the dashboard after Stripe sends a member back.
 *
 *  The browser comes back before Stripe's webhook has told us about the
 *  payment, so this waits — polling the profile for a few seconds — and only
 *  says "you're in" once the plan has really changed in the database. */
export function Welcome({ onLanded }: { onLanded: () => void }) {
  const [want, setWant] = useState<TierId | null>(null);
  const [state, setState] = useState<"waiting" | "done" | "slow">("waiting");

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("welcome") as TierId | null;
    if (!t || !["street", "hustler", "kingpin"].includes(t)) return;
    setWant(t);
    history.replaceState(null, "", location.pathname + location.hash);
    const c = sb(); if (!c) { setState("done"); return; }
    let tries = 0, stop = false;
    const check = async () => {
      if (stop) return;
      const { data: { user } } = await c.auth.getUser();
      const { data } = user ? await c.from("profiles").select("tier, subscription_status").eq("id", user.id).maybeSingle() : { data: null };
      if (data?.tier === t && ["active", "trialing"].includes(data.subscription_status)) { setState("done"); onLanded(); return; }
      if (++tries >= 15) { setState("slow"); return; }
      setTimeout(check, 1500);
    };
    check();
    return () => { stop = true; };
  }, [onLanded]);

  if (!want) return null;
  const tier = tierById(want);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="wel-t" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={() => state !== "waiting" && setWant(null)}>
      <div className="welcome-card w-full max-w-md rounded-2xl border-2 border-mango bg-asphalt p-7 text-center text-white" onClick={(e) => e.stopPropagation()}>
        <TierMedal tier={want} className={`mx-auto size-32 ${state === "waiting" ? "animate-pulse" : "welcome-medal"}`} />
        {state === "waiting" && <>
          <h2 id="wel-t" className="display mt-5 text-4xl">Confirming your payment…</h2>
          <p className="mt-3 text-white/75">Stripe is telling us it went through. This takes a few seconds.</p>
        </>}
        {state === "done" && <>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-mango">Payment confirmed</p>
          <h2 id="wel-t" className="display mt-2 text-5xl">Welcome to {tier.label}.</h2>
          <ul className="mt-5 grid gap-1.5 text-left text-sm text-white/85">
            {tier.perks.slice(0, 4).map((p) => <li key={p} className="flex gap-2"><span className="text-mango">★</span>{p}</li>)}
          </ul>
          <p className="mt-4 text-sm text-white/65">Your receipt is on its way to your email.</p>
          <button autoFocus onClick={() => setWant(null)} className="btn btn-hot mt-6 w-full">Let&apos;s go</button>
        </>}
        {state === "slow" && <>
          <h2 id="wel-t" className="display mt-5 text-4xl">Payment received.</h2>
          <p className="mt-3 text-white/75">Your plan is taking longer than usual to switch on. Refresh in a minute; you won&apos;t be charged twice. Your receipt will come by email.</p>
          <button onClick={() => location.reload()} className="btn btn-hot mt-6 w-full">Refresh</button>
        </>}
      </div>
    </div>
  );
}
