"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase";

export default function Login() {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const next = typeof window !== "undefined" ? new URLSearchParams(location.search).get("next") ?? "/dashboard" : "/dashboard";
  const redirectTo = typeof window !== "undefined" ? `${location.origin}${next}` : undefined;

  async function email(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = sb(); if (!c) { setSent(true); return; }
    const { error } = await c.auth.signInWithOtp({ email: String(new FormData(e.currentTarget).get("email")), options: { emailRedirectTo: redirectTo } });
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
      <div className="px-4 py-16 md:px-16 flex flex-col justify-center max-w-xl">
        <h1 className="display text-6xl md:text-7xl">Sign in to Live From Leonida</h1>
        <p className="text-haze mt-3">One account to send clips, vote and collect winnings.</p>
        <div className="mt-8 grid gap-3">
          <button onClick={() => oauth("discord")} className="btn bg-[#5865F2] text-white">Continue with Discord</button>
          <button onClick={() => oauth("twitch")} className="btn bg-[#9146FF] text-white">Continue with Twitch</button>
          <button onClick={() => oauth("google")} className="btn btn-ghost">Continue with Google</button>
        </div>
        <p className="my-6 text-sm text-haze">or get a sign-in link by email</p>
        {sent ? <p className="font-semibold text-gulf">Check your inbox for the sign-in link.</p> : (
          <form onSubmit={email} className="flex gap-2">
            <input name="email" type="email" required placeholder="you@example.com" className="field" />
            <button className="btn btn-hot shrink-0">Send link</button>
          </form>
        )}
        {err && <p role="alert" className="mt-3 text-flamingo">{err}</p>}
      </div>
    </div>
  );
}
