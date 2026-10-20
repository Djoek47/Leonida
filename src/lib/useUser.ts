"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { sb, isLive } from "./supabase";

export type Profile = {
  id: string; display_name: string; platform: string | null; gamertag: string | null;
  gamertag_verified: boolean; verify_code: string | null; payout_method: string | null;
  payout_handle: string | null; is_admin: boolean; role?: string; is_club?: boolean;
};

const DEMO_USER = { id: "demo", email: "demo@leonida.live" } as unknown as User;
export const DEMO_PROFILE: Profile = {
  id: "demo", display_name: "ViceCityVandal", platform: "ps5", gamertag: "ViceCityVandal",
  gamertag_verified: false, verify_code: "K7Q2ZP", payout_method: "paypal", payout_handle: "", is_admin: true, role: "owner", is_club: true,
};

/** Current user + profile. In demo mode (no Supabase env) a sample signed-in user is returned. */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sb();
    if (!c) { setUser(DEMO_USER); setProfile(DEMO_PROFILE); setLoading(false); return; }
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data } = await c.from("profiles").select("*").eq("id", u.id).single();
        setProfile(data as Profile);
      } else setProfile(null);
      setLoading(false);
    };
    c.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = c.auth.onAuthStateChange((_e, s) => load(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, profile, setProfile, loading, demo: !isLive };
}
