import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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