import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,
  
  // Configure image optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
