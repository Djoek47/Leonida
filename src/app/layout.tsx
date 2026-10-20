import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "@/components/A";
import "./globals.css";
import { Ticker } from "@/components/Ticker";
import { NavAuth } from "@/components/NavAuth";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import { Radio } from "@/components/Radio";
import { PlatformIcon } from "@/components/Icons";
import { shop, socials } from "@/lib/content";

const archivo = localFont({ src: "../fonts/overpass-latin-wght-normal.woff2", variable: "--font-overpass", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  title: "Leonida Live — get paid for your GTA VI clips",
  description: "Send your GTA VI clips, let Leonida vote, and win cash every week. Plus Versus: live console-vs-console challenges on Twitch.",
};

const nav = [
  { href: "/clips", label: "This week's clips" },
  { href: "/submit", label: "Send a clip" },
  { href: "/versus", label: "Versus" },
  { href: "/leonida", label: "Leonida guide" },
  { href: "/club", label: "’’’ Club" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-ink border-b border-line">
          <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Leonida Live home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/brand/gta6-logo.png" alt="" className="h-8 sm:h-9 w-auto" />
              <span className="sign-sm">Leonida Live</span>
            </Link>
            <nav className="hidden md:flex gap-5 text-sm font-semibold text-haze">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foam">{n.label}</Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2"><ThemeToggle /><NavAuth /></div>
          </div>
          <nav className="md:hidden flex gap-4 overflow-x-auto px-4 pb-2 text-sm font-semibold text-haze">
            {nav.map((n) => <Link key={n.href} href={n.href} className="shrink-0">{n.label}</Link>)}
          </nav>
          <Ticker />
        </header>
        <main className="flex-1">{children}</main>
        <Radio />
        <footer className="bg-asphalt text-white/80 mt-24 [&_a:hover]:text-mango">
          <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm">
            <div>
              <div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/leonida-live-avatar-400.png" alt="Leonida Live logo" className="size-14 rounded-full" /><p className="sign-sm !text-lg !px-4 !py-2.5">Leonida Live</p></div>
              <p className="mt-3 max-w-md">Free to enter. Votes can&apos;t be bought. Winners are paid by PayPal, Venmo, Cash App, Interac or Wise after we confirm the gamertag is theirs.</p>
              <p className="mt-4 max-w-md text-xs opacity-70">Leonida Live is a fan-run community and is not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA VI and related logos and artwork are trademarks and copyright of Take-Two Interactive Software, Inc.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/rules">Contest rules</Link>
              <Link href="/dashboard">My clips and winnings</Link>
              <Link href="/credits">Credits</Link>
              <Link href="/admin">Staff</Link>
            </div>
            <div className="flex flex-col gap-2">
              {socials.map((x) => <a key={x.id} href={x.href} target="_blank" rel="noreferrer" className="flex items-center gap-2"><PlatformIcon name={x.id} />{x.label}</a>)}
              <a href="https://www.rockstargames.com/VI" target="_blank" rel="noreferrer">Rockstar&apos;s official site</a>
            </div>
            <div className="flex flex-col gap-2">
              {shop.map((s) => <a key={s.title} href={s.href} target="_blank" rel="noreferrer sponsored">{s.title.replace("Grand Theft Auto VI", "GTA VI")}</a>)}
              <span className="text-xs opacity-60">Some shop links are affiliate links.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
