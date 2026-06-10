import type { ThemeTenant } from '../types'
import type { StorefrontConfig } from '@/lib/storefront-api'

const DEFAULT_OFFERS = ['🎉 50% off first order', 'Free delivery over ₹499']

interface SaffronHeroProps {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
  /** Promotional pill labels, pulled from config or hardcoded defaults. */
  offers?: string[]
}

export function SaffronHero({ tenant, config, offers = DEFAULT_OFFERS }: SaffronHeroProps) {
  const headline = config?.content?.heroHeadline ?? 'Fresh from our kitchen to you'
  const address = config?.branding?.address ?? ''

  return (
    <div
      style={{
        background: 'var(--ink, #1A1714)',
        color: 'var(--cream, #FAF8F3)',
        padding: '3rem 2rem',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: '2rem',
      }}
      className="saffron-hero"
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            margin: 0,
          }}
        >
          {headline}
        </h1>

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <HeroBadge icon="clock" label="30–45 min delivery" />
          <HeroBadge icon="star" label={`4.8 · ${tenant.name} kitchen`} />
          {address && <HeroBadge icon="location" label={address} />}
        </div>
      </div>

      {offers.length > 0 && (
        <div
          className="saffron-hero-offers"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
          }}
        >
          {offers.map((offer, i) => (
            <span
              key={i}
              style={{
                background: 'var(--terracotta, #C4633A)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '100px',
                whiteSpace: 'nowrap',
              }}
            >
              {offer}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function HeroBadge({
  icon,
  label,
}: {
  icon: 'clock' | 'star' | 'location'
  label: string
}) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        color: 'rgba(250,248,243,0.65)',
      }}
    >
      {icon === 'clock' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}
      {icon === 'star' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {icon === 'location' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )}
      {label}
    </span>
  )
}
