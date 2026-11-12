import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cheerio"],
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

export default nextConfig;
