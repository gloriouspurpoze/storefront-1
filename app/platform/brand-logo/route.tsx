import { ImageResponse } from 'next/og'

export const runtime = 'edge'

/**
 * torqstudio.com/brand-logo — square brand mark (512×512) for Organization structured data,
 * which Google shows in search and knowledge panels (it needs at least 112×112, crawlable).
 * No file extension: `.png` paths skip the middleware, so they never reach the platform routes.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0e3191 0%, #024ad8 55%, #296ef9 100%)',
        }}
      >
        <svg viewBox="0 0 32 32" width={340} height={340}>
          <path d="M4 24 L14 8 L18 8 L8 24 Z" fill="#ffffff" />
          <path d="M16 24 L26 8 L30 8 L20 24 Z" fill="#ffffff" opacity={0.55} />
        </svg>
      </div>
    ),
    { width: 512, height: 512, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' } },
  )
}
