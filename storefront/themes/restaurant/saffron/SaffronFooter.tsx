import type { ThemeTenant } from '../types'
import type { StorefrontConfig } from '@/lib/storefront-api'

export function SaffronFooter({
  tenant,
  config,
}: {
  tenant: ThemeTenant
  config?: StorefrontConfig | null
}) {
  const branding = config?.branding ?? {}
  const year = new Date().getFullYear()
  const siteName = branding.siteName || tenant.name

  return (
    <footer
      style={{
        background: 'var(--ink, #1A1714)',
        color: 'rgba(250,248,243,0.7)',
        padding: '2.5rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: '20px',
              fontWeight: 500,
              color: 'var(--cream, #FAF8F3)',
              marginBottom: '6px',
            }}
          >
            {siteName}
          </div>
          {branding.tagline && (
            <div style={{ fontSize: '13px', maxWidth: '260px', lineHeight: 1.5 }}>
              {branding.tagline}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div
          style={{
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {branding.contactPhone && (
            <a
              href={`tel:${branding.contactPhone}`}
              style={{ color: 'inherit', textDecoration: 'none', display: 'flex', gap: '8px' }}
            >
              <span aria-hidden>📞</span>
              {branding.contactPhone}
            </a>
          )}
          {branding.contactEmail && (
            <a
              href={`mailto:${branding.contactEmail}`}
              style={{ color: 'inherit', textDecoration: 'none', display: 'flex', gap: '8px' }}
            >
              <span aria-hidden>✉️</span>
              {branding.contactEmail}
            </a>
          )}
          {branding.address && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span aria-hidden>📍</span>
              {branding.address}
            </div>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '1.5rem auto 0',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(250,248,243,0.1)',
          fontSize: '12px',
          textAlign: 'center',
        }}
      >
        © {year} {siteName}. All rights reserved. Powered by Profixer.
      </div>
    </footer>
  )
}
