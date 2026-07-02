import type { NextConfig } from 'next'

/**
 * Storefront Next.js config.
 *
 * Custom domains live on Vercel's `cname.vercel-dns.com`; tenant resolution
 * happens in `middleware.ts`. Image patterns cover Cloudinary plus our own
 * platform host so admins can paste logo URLs without manual config.
 */
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  /** Allow tenant subdomains (e.g. bazaar.lvh.me:3001) to load /_next/* in dev. */
  allowedDevOrigins: ['*.lvh.me', 'lvh.me'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.profixer.app' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default config
