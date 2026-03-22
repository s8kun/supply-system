import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LARAVEL_API_URL:
      process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? process.env.LARAVEL_API_URL,
  },
};

export default nextConfig;
