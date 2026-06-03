import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow job photo uploads (default Server Action body limit is 1MB).
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
