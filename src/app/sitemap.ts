import type { MetadataRoute } from "next";
const SITE = "https://www.livefromleonida.com";
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: Array<[string, number, MetadataRoute.Sitemap[number]["changeFrequency"]]> = [
    ["", 1, "daily"], ["/gta-6-clips", 0.95, "weekly"], ["/leonida", 0.9, "weekly"], ["/clips/all", 0.8, "daily"], ["/clips/daily", 0.6, "daily"], ["/clips/featured", 0.6, "daily"], ["/support", 0.3, "yearly"], ["/clips", 0.9, "daily"],
    ["/result", 0.8, "weekly"], ["/earn", 0.7, "weekly"], ["/pricing", 0.7, "monthly"], ["/submit", 0.6, "monthly"], ["/edge", 0.6, "weekly"],
    ["/rules", 0.5, "monthly"], ["/chat", 0.4, "daily"], ["/credits", 0.3, "monthly"], ["/terms", 0.2, "yearly"], ["/privacy", 0.2, "yearly"],
  ];
  return pages.map(([p, priority, changeFrequency]) => ({ url: `${SITE}${p}`, lastModified: now, changeFrequency, priority }));
}
