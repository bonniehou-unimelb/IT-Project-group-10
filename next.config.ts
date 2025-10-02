import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during production builds (CI included)
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
