import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "minotar.net" },
      { protocol: "https", hostname: "cravatar.eu" },
      { protocol: "https", hostname: "mc-heads.net" },
    ],
  },
};

export default nextConfig;