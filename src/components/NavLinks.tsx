"use client";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";

type Item = { href: string; label: string };

/** The main navigation. Once you're signed in the Join tab becomes RESULT; signed out
 *  keeps Join. While the session is still loading the slot is held empty so neither
 *  label flashes. */
export function NavLinks({ items, className }: { items: Item[]; className?: string }) {
  const { user, loading } = useUser();
  return (
    <>
      {items.map((n) => {
        if (n.href !== "/pricing") return <Link key={n.href} href={n.href} className={className}>{n.label}</Link>;
        if (loading) return <span key={n.href} aria-hidden className={`${className ?? ""} invisible`}>{n.label}</span>;
        return user
          ? <Link key="/result" href="/result" className={className}>RESULT</Link>
          : <Link key={n.href} href={n.href} className={className}>{n.label}</Link>;
      })}
    </>
  );
}
