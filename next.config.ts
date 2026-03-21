import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Optimizations for deployment
    optimizePackageImports: ['lucide-react', 'date-fns']
  }
};

export default nextConfig;
