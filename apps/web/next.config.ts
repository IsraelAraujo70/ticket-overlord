import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
