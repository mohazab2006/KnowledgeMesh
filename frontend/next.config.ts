import type { NextConfig } from "next";

const gateway =
  process.env.GATEWAY_INTERNAL_URL?.trim() || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${gateway}/:path*` }];
  },
};

export default nextConfig;
