import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
  outputFileTracingExcludes: {
    "*": ["./prototype/**", "./docs/**"],
  },
  allowedDevOrigins: ["192.168.1.60", "192.168.1.71", "localhost", "demido-v0-0-1"],
};

export default nextConfig;
