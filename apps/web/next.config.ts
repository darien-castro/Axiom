import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: Object.values(networkInterfaces())
    .flat()
    .filter((address) => address?.family === "IPv4" && !address.internal)
    .map((address) => address!.address),
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
