"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { sb, isLive } from "./supabase";
import { tierById, type TierId } from "./tiers";

export type Profile = {
  id: string; display_name: string; platform: string | null; gamertag: string | null;
  gamertag_verified: boolean; verify_code: string | null; payout_method: string | null;
  payout_handle: string | null; is_admin: boolean; role?: string;
  tier: TierId; billing_period: "monthly" | "annual" | null;
  subscription_status: "none" | "active" | "past_due" | "canceled" | "trialing";
  current_period_end: string | null; credits_remaining: number;
};

/** What the member sees about their own account (public.my_account). */
export type Account = {
  tier: TierId; credits_remaining: number; credits_per_month: number;
  votes: number; daily_submissions: number; submitted_today: number;
  pending_cents: number; lifetime_downloads: number; current_period_end: string | null;
  streak_days: number; best_streak: number; freezes_left: number; streak_freezes: number;
  stars: number; badges: number;
};

const DEMO_USER = { id: "demo", email: "demo@livefromleonida.com" } as unknown as User;

export const DEMO_PROFILE: Profile = {
  id: "demo", display_name: "ViceCityVandal", platform: "ps5", gamertag: "ViceCityVandal",
  gamertag_verified: false, verify_code: "K7Q2ZP", payout_method: "paypal", payout_handle: "",
  is_admin: true, role: "owner",
  tier: "kingpin", billing_period: "monthly", subscription_status: "active",
  current_period_end: new Date(Date.now() + 18 * 864e5).toISOString(), credits_remaining: 5,
};

const DEMO_ACCOUNT: Account = {
  tier: "kingpin", credits_remaining: 14, credits_per_month: 20,
  votes: 6, daily_submissions: 100, submitted_today: 1,
  pending_cents: 1890, lifetime_downloads: 27,
  current_period_end: DEMO_PROFILE.current_period_end,
  streak_days: 9, best_streak: 21, freezes_left: 2, streak_freezes: 3,
  stars: 2, badges: 5,
};

/** True when this account's subscription is good right now. */
export function isPaying(p: Pick<Profile, "tier" | "subscription_status"> | null | undefined) {
  return Boolean(p && p.tier !== "free" && ["active", "trialing"].includes(p.subscription_status));
}

/** Current user, profile and account. Without Supabase env vars a sample member is returned. */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sb();
    if (!c) { setUser(DEMO_USER); setProfile(DEMO_PROFILE); setAccount(DEMO_ACCOUNT); setLoading(false); return; }
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const [{ data: p }, { data: a }] = await Promise.all([
          c.from("profiles").select("*").eq("id", u.id).single(),
          c.from("my_account").select("*").maybeSingle(),
        ]);
        setProfile(p as Profile);
        setAccount((a as Account) ?? null);
      } else { setProfile(null); setAccount(null); }
      setLoading(false);
    };
    c.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = c.auth.onAuthStateChange((_e, s) => load(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const paying = isPaying(profile);
  return { user, profile, account, setProfile, setAccount, loading, demo: !isLive, paying, tier: tierById(profile?.tier) };
}
