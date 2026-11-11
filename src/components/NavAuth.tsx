"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { sb } from "@/lib/supabase";
import { TierMedal } from "@/components/TierMedal";
import type { TierId } from "@/lib/tiers";

/** The account control in the top bar.
 *
 *  Signed out: one button. Signed in: your medal, which opens a menu with
 *  everything that belongs to you — and, for the first time, a way out. */
export function NavAuth() {
  const { user, profile, loading, paying } = useUser();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("mousedown", away); addEventListener("keydown", esc);
    return () => { removeEventListener("mousedown", away); removeEventListener("keydown", esc); };
  }, [open]);

  if (loading) return <span className="inline-block size-9 rounded-full bg-ink-2 animate-pulse" aria-hidden />;
  if (!user) {
    return <Link href="/pricing" className="btn btn-hot !py-1.5 !pl-2 !pr-4 text-sm whitespace-nowrap inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/coins/kingpin.webp" alt="" className="size-7 coin-spin" /> Join</Link>;
  }

  const tier = ((paying ? profile?.tier : "free") ?? "free") as TierId;
  const name = profile?.display_name ?? "Player";

  async function signOut() {
    setLeaving(true);
    await sb()?.auth.signOut();
    location.href = "/";
  }

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}
        className="acct-btn" aria-label={`Account menu for ${name}`}>
        <TierMedal tier={tier} className="size-9" />
        <span className="acct-name">{name}</span>
        <svg viewBox="0 0 12 12" className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="acct-menu">
          <div className="acct-head">
            <TierMedal tier={tier} className="size-12 shrink-0" />
            <div className="min-w-0">
              <p className="font-extrabold truncate">{name}</p>
              <p className="text-xs opacity-75 capitalize">{tier === "free" ? "Free account" : `${tier} member`}</p>
            </div>
          </div>
          <nav className="acct-links" onClick={() => setOpen(false)}>
            <Link role="menuitem" href="/dashboard">Dashboard</Link>
            <Link role="menuitem" href="/wallet">Wallet & billing</Link>
            <Link role="menuitem" href="/favorites">Favorites</Link>
            <Link role="menuitem" href="/support">Support</Link>
            <Link role="menuitem" href="/submit">Send a clip</Link>
            <Link role="menuitem" href="/settings">Settings</Link>
            {!paying && <Link role="menuitem" href="/pricing" className="acct-up">Upgrade</Link>}
          </nav>
          <button role="menuitem" onClick={signOut} disabled={leaving} className="acct-out">
            {leaving ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
