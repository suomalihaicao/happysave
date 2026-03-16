import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Turbopack 需要明确根目录 (pnpm hoisting)
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazon.com' },
      { protocol: 'https', hostname: '**.alicdn.com' },
      { protocol: 'https', hostname: '**.aliexpress.com' },
      { protocol: 'https', hostname: 'img.ltwebstatic.com' }, // SHEIN
      { protocol: 'https', hostname: '**.temu.com' },
      { protocol: 'https', hostname: '**.nike.com' },
      { protocol: 'https', hostname: '**.anker.com' },
      { protocol: 'https', hostname: '**.hostinger.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 压缩
  compress: true,

  // 重定向
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/',
        permanent: true,
      },
    ];
  },

  // 安全头 (middleware 也设了，这里是 fallback)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/store/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/category/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/guide/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/advertise',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/privacy',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=604800, stale-while-revalidate=2592000' },
        ],
      },
      {
        source: '/terms',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=604800, stale-while-revalidate=2592000' },
        ],
      },
      {
        source: '/s/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

// Sentry 配置包装
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'happy-save',
  project: process.env.SENTRY_PROJECT || 'happysave',
  silent: true,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  tunnelRoute: '/api/v1/sentry-tunnel',
  disableLogger: true,
});
