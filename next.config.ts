import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/new",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
      {
        source: "/shop/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=60, s-maxage=60, stale-while-revalidate=120" },
        ],
      },
      {
        source: "/product/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=120, s-maxage=120, stale-while-revalidate=300" },
        ],
      },
      {
        source: "/blog/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },
};

export default nextConfig;
