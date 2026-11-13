import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "@/components/A";
import "./globals.css";
import { Ticker } from "@/components/Ticker";
import { NavLinks } from "@/components/NavLinks";
import { WinCelebration } from "@/components/WinCelebration";
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
  title: { default: "Live From Leonida: GTA 6 clips, weekly prizes and the Leonida guide", template: "%s | Live From Leonida" },
  description: "Live From Leonida: find, buy and sell GTA 6 clips, enter the weekly GTA VI clip contest and win cash. Plus the Leonida guide: Vice City, the Keys, Grassrivers, Port Gellhorn, Ambrosia and Mount Kalaga.",
  keywords: ["Live From Leonida", "LiveFromLeonida", "LV Leonida", "Leonida Live", "Leonida", "GTA 6 clips", "GTA VI clips", "buy GTA 6 clips", "find GTA 6 clips", "sell GTA 6 clips", "GTA 6 clips for sale", "GTA 6 clipping service", "GTA 6 clip contest", "GTA 6 gameplay", "Vice City", "Leonida map", "Leonida Keys", "Port Gellhorn", "Grassrivers"],
  applicationName: "Live From Leonida", category: "games", authors: [{ name: "Live From Leonida", url: SITE }], creator: "Live From Leonida", publisher: "Live From Leonida",
  alternates: { canonical: "/", languages: { "en": "/", "x-default": "/" } },
  openGraph: { type: "website", locale: "en_US", siteName: "Live From Leonida", url: SITE, title: "Live From Leonida: GTA 6 clips, weekly prizes and the Leonida guide", description: "Find, buy and sell GTA 6 clips. Weekly GTA VI clip contest with cash prizes.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Live From Leonida — GTA VI clips, prizes and the Leonida guide" }] },
  twitter: { card: "summary_large_image", site: "@livefromgta6", creator: "@livefromgta6", title: "Live From Leonida: GTA 6 clips and weekly prizes", description: "Find, buy and sell GTA 6 clips. Weekly GTA VI clip contest with cash prizes.", images: ["/og.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  // Google Search Console: paste the code from its "HTML tag" option into
  // GOOGLE_SITE_VERIFICATION in Vercel (just the content="…" value).
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE}/#site`, url: SITE, name: "Live From Leonida", alternateName: ["LiveFromLeonida", "Leonida Live", "LV Leonida", "LFL", "Live From Leonida GTA 6 clips"], inLanguage: "en", publisher: { "@id": `${SITE}/#org` } },
    { "@type": "Organization", "@id": `${SITE}/#org`, name: "Live From Leonida", alternateName: ["LV Leonida", "Leonida Live", "LFL"], url: SITE, logo: `${SITE}/brand/live-from-leonida-avatar-400.png`, image: `${SITE}/og.png`,
      description: "A GTA VI clip community: find, buy and sell GTA 6 clips, with a weekly clip contest and cash prizes.", slogan: "Live from Leonida",
      knowsAbout: ["GTA 6", "GTA VI clips", "Leonida", "Vice City", "video game clips"],
      sameAs: ["https://www.youtube.com/@livefromleonida", "https://www.tiktok.com/@lfleonida", "https://www.instagram.com/lfleonida", "https://www.twitch.tv/livefromleonida", "https://x.com/livefromgta6"] },
  ],
};

const nav = [
  { href: "/clips", label: "Clips from Leonida" },
  { href: "/submit", label: "Send a clip" },
  { href: "/earn", label: "How to earn" },
  { href: "/edge", label: "The edge" },
  { href: "/leonida", label: "Leonida guide" },
  { href: "/pricing", label: "Join" },
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
              <NavLinks items={nav} className="sky-link" />
            </nav>
            <div className="ml-auto flex items-center gap-2"><ThemeToggle /><NavAuth /></div>
          </div>
          <nav className="lg:hidden flex gap-4 overflow-x-auto px-4 pb-2 text-sm font-semibold text-haze">
            <NavLinks items={nav} className="shrink-0 sky-link" />
          </nav>
          <Ticker />
        </header>
        <main className="flex-1">{children}</main>
        <WinCelebration />
        <Radio />
        <footer className="bg-asphalt text-white/80 mt-24 [&_a:hover]:text-mango">
          <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr] text-sm">
            <div>
              <div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/live-from-leonida-avatar-180.png" alt="Live From Leonida logo" className="size-16 rounded-full" /><p className="sign-sm !text-lg !px-4 !py-2.5">Live From Leonida</p></div>
              <p className="mt-3 max-w-md">Free to enter. Winners are paid by PayPal, Venmo, Cash App or Interac after we confirm the gamertag is theirs.</p>
              <p className="mt-4 max-w-md text-xs opacity-70">Live From Leonida is a fan-run community and is not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA VI and related logos and artwork are trademarks and copyright of Take-Two Interactive Software, Inc.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/gta-6-clips">GTA 6 clips</Link>
              <Link href="/rules">Contest rules</Link>
              <Link href="/support">Support</Link>
              <Link href="/dashboard">My clips and winnings</Link>
              <Link href="/credits">Credits</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
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
