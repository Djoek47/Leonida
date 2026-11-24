import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a static preview (sample data, no server). Vercel uses the normal build.
// The watermark routes run the bundled ffmpeg binary and read the seal + font files at runtime,
// so they're kept out of the bundle and traced into those functions explicitly.
const watermarkFiles = ["./node_modules/ffmpeg-static/ffmpeg", "./public/brand/live-from-leonida-avatar-180.png", "./src/assets/watermark/*.ttf"];
const nextConfig: NextConfig = process.env.STATIC_EXPORT ? { output: "export", trailingSlash: true } : {
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/clips/watermark": watermarkFiles, "/api/cron/watermark": watermarkFiles },
};
export default nextConfig;
