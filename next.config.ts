import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/routes/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

export default nextConfig;