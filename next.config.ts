import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Allow phones / tablets on the local Wi-Fi to load HMR + static
  // dev assets from this Mac. Next.js 16 blocks cross-origin dev
  // requests by default for safety.
  allowedDevOrigins: [
    "192.168.1.143",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
    "10.10.10.*",
    "172.20.10.*", // iPhone personal-hotspot range (phone testing)
  ],
};

export default nextConfig;
