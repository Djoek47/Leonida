"use client";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";

export function NavAuth() {
  const { user, loading } = useUser();
  if (loading) return <span className="text-sm text-haze">…</span>;
  return user
    ? <Link href="/dashboard" className="btn btn-ghost !py-2 !px-3 sm:!px-4 text-sm whitespace-nowrap">My winnings</Link>
    : <Link href="/login" className="btn btn-hot !py-2 !px-4 text-sm whitespace-nowrap">Sign in</Link>;
}
