import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/console", "/api/", "/overlay/", "/settings", "/dashboard", "/wallet", "/favorites", "/login", "/auth/", "/edge/lab", "/edge/archive"] }],
    sitemap: "https://www.livefromleonida.com/sitemap.xml",
    host: "https://www.livefromleonida.com",
  };
}
