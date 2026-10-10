import { ImageResponse } from 'next/og'
import { PLATFORM_BRAND } from '@/platform/config'

export const runtime = 'edge'

/**
 * Open Graph image for every marketing page: `/og?title=…&eyebrow=…` (1200×630).
 * An explicit route rather than `opengraph-image.tsx`, whose URL would include the
 * internal `/platform` prefix that doesn't exist on torqstudio.com.
 */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') || `Run your entire business from one workspace`).slice(0, 120)
  const eyebrow = (searchParams.get('eyebrow') || 'Bookings · CRM · Storefront · Billing').slice(0, 80)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0e3191 0%, #024ad8 55%, #296ef9 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 40, fontWeight: 700 }}>
          <svg viewBox="0 0 32 32" width={56} height={56}>
            <path d="M4 24 L14 8 L18 8 L8 24 Z" fill="#ffffff" />
            <path d="M16 24 L26 8 L30 8 L20 24 Z" fill="#ffffff" opacity={0.55} />
          </svg>
          {PLATFORM_BRAND}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 30, color: '#c9e0fc' }}>{eyebrow}</div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>{title}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' },
    },
  )
}
