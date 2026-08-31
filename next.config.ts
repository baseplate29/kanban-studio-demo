import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e suite runs its own dev server (see playwright.config.ts); a
  // separate dist dir lets it coexist with the main `npm run dev` instance.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    serverActions: {
      // Allow form posts through the Codespaces forwarded URL in development.
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;
