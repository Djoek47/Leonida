import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "@/components/A";
import "./globals.css";
import { Ticker } from "@/components/Ticker";
import { NavAuth } from "@/components/NavAuth";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import { SkyBar } from "@/components/SkyBar";
import { Radio } from "@/components/Radio";
import { PlatformIcon } from "@/components/Icons";
import { socials } from "@/lib/content";

const archivo = localFont({ src: "../fonts/overpass-latin-wght-normal.woff2", variable: "--font-overpass", weight: "100 900", display: "swap" });

const SITE = "https://www.livefromleonida.com";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Live From Leonida — GTA VI clips, prizes and the Leonida guide", template: "%s — Live From Leonida" },
  description: "Live From Leonida: send your GTA VI clips, let the state vote, and win cash every week. Plus the Leonida guide: Vice City, the Keys, Grassrivers, Port Gellhorn, Ambrosia and Mount Kalaga.",
  keywords: ["Leonida", "Live From Leonida", "GTA VI", "GTA 6", "Vice City", "Leonida map", "GTA VI clips", "GTA 6 contest", "Leonida Keys", "Port Gellhorn", "Grassrivers"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Live From Leonida", url: SITE, title: "Live From Leonida", description: "GTA VI clips, weekly cash prizes and the Leonida guide.",
    images: [{ url: "/brand/banner-x-1500x500.png", width: 1500, height: 500, alt: "Live From Leonida" }] },
  twitter: { card: "summary_large_image", title: "Live From Leonida", description: "GTA VI clips, weekly cash prizes and the Leonida guide.", images: ["/brand/banner-x-1500x500.png"] },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE}/#site`, url: SITE, name: "Live From Leonida", alternateName: ["LiveFromLeonida", "Leonida Live"] },
    { "@type": "Organization", "@id": `${SITE}/#org`, name: "Live From Leonida", url: SITE, logo: `${SITE}/brand/live-from-leonida-avatar-400.png`,
      sameAs: ["https://www.tiktok.com/@lfleonida", "https://www.instagram.com/lfleonida", "https://www.twitch.tv/livefromleonida"] },
  ],
};

const nav = [
  { href: "/clips", label: "This week's clips" },
  { href: "/submit", label: "Send a clip" },
  { href: "/earn", label: "How to earn" },
  { href: "/edge", label: "The edge" },
  { href: "/leonida", label: "Leonida guide" },
  { href: "/pricing", label: "Go Pro" },
  { href: "/chat", label: "Chat" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <SkyBar />
        <header className="sky-bar sticky top-0 z-40 border-b border-line">
          <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Live From Leonida home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/brand/gta6-logo.png" alt="" className="h-8 sm:h-9 w-auto" />
              <span className="sign-sm text-center leading-[1.08] max-sm:!px-2 max-sm:!py-1.5 max-sm:!text-[13px]"><span className="block sm:inline">Live From</span><span className="block sm:inline sm:ml-[0.3em]">Leonida</span></span>
            </Link>
            <nav className="hidden lg:flex gap-5 text-sm font-semibold text-haze">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foam">{n.label}</Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2"><ThemeToggle /><NavAuth /></div>
          </div>
          <nav className="lg:hidden flex gap-4 overflow-x-auto px-4 pb-2 text-sm font-semibold text-haze">
            {nav.map((n) => <Link key={n.href} href={n.href} className="shrink-0">{n.label}</Link>)}
          </nav>
          <Ticker />
        </header>
        <main className="flex-1">{children}</main>
        <Radio />
        <footer className="bg-asphalt text-white/80 mt-24 [&_a:hover]:text-mango">
          <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm">
            <div>
              <div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/live-from-leonida-avatar-180.png" alt="Live From Leonida logo" className="size-16 rounded-full" /><p className="sign-sm !text-lg !px-4 !py-2.5">Live From Leonida</p></div>
              <p className="mt-3 max-w-md">Free to enter. Votes can&apos;t be bought. Winners are paid by PayPal, Venmo, Cash App, Interac or Wise after we confirm the gamertag is theirs.</p>
              <p className="mt-4 max-w-md text-xs opacity-70">Live From Leonida is a fan-run community and is not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA VI and related logos and artwork are trademarks and copyright of Take-Two Interactive Software, Inc.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/rules">Contest rules</Link>
              <Link href="/dashboard">My clips and winnings</Link>
              <Link href="/credits">Credits</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/admin">Staff</Link>
            </div>
            <div className="flex flex-col gap-2">
              {socials.map((x) => <a key={x.id} href={x.href} target="_blank" rel="noreferrer" className="flex items-center gap-2"><PlatformIcon name={x.id} />{x.label}</a>)}
              <a href="https://www.rockstargames.com/VI" target="_blank" rel="noreferrer">Rockstar&apos;s official site</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
