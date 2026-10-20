import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a static preview (sample data, no server). Vercel uses the normal build.
const nextConfig: NextConfig = process.env.STATIC_EXPORT ? { output: "export", trailingSlash: true } : {};
export default nextConfig;
