import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/console", "/api/", "/overlay/", "/settings", "/dashboard"] }],
    sitemap: "https://www.livefromleonida.com/sitemap.xml",
    host: "https://www.livefromleonida.com",
  };
}
