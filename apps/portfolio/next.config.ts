import type { NextConfig } from "next";

const isStaticExport = process.env.PORTFOLIO_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  experimental: {
    sri: {
      algorithm: "sha256"
    }
  },
  output: isStaticExport ? "export" : undefined
};

export default nextConfig;
