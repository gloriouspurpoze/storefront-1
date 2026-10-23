import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { buildWhatsAppChatUrl, resolveWhatsAppNumber } from '@/lib/storefrontWhatsApp'
import type { ThemeTenant } from '@/themes/restaurant/types'
import './brown-butter-links.css'

const DEFAULT_TAGLINE = 'Fresh baked Belgian cookies · Mira Road, Mumbai 🍪'
const DEFAULT_INSTAGRAM = 'https://www.instagram.com/brownbutter.in'
const WHATSAPP_PREFILL = 'Hi Brown Butter! I have a question.'

function splitBrandName(name: string): { lead: string; accent: string | null } {
  const trimmed = name.trim()
  if (trimmed.toLowerCase() !== 'the brown butter') return { lead: trimmed, accent: null }
  const splitAt = trimmed.lastIndexOf(' ')
  if (splitAt <= 0) return { lead: trimmed, accent: null }
  return { lead: trimmed.slice(0, splitAt), accent: trimmed.slice(splitAt) }
}

function instagramHref(raw: string | undefined): string {
  const trimmed = raw?.trim()
  if (!trimmed) return DEFAULT_INSTAGRAM
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`
}

function instagramHandle(href: string): string {
  try {
    const part = new URL(href).pathname.split('/').filter(Boolean)[0]
    if (part) return `@${decodeURIComponent(part)}`
  } catch {
    /* keep the Brown Butter handle */
  }
  return '@brownbutter.in'
}

function formatWhatsAppDisplay(digits: string): string {
  if (digits.startsWith('91') && digits.length === 12) {
    const local = digits.slice(2)
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  }
  return `+${digits}`
}

function freshPlace(address: string | undefined): { strong: string; rest: string } {
  const trimmed = address?.trim()
  if (!trimmed) return { strong: 'Mira Road', rest: ', Mumbai' }
  return { strong: trimmed, rest: '' }
}

export function BrownButterLinksView({
  tenant,
  config,
  homeLabel,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  homeLabel: string
}) {
  const siteName = (config?.branding?.siteName || tenant.name).trim() || 'The Brown Butter'
  const { lead, accent } = splitBrandName(siteName)
  const tagline = config?.branding?.tagline?.trim() || DEFAULT_TAGLINE
  const logoUrl = config?.branding?.logoUrl?.trim() || tenant.logoUrl || ''
  const instagram = instagramHref(config?.branding?.socials?.instagram)
  const handle = instagramHandle(instagram)
  const waDigits = resolveWhatsAppNumber(config)
  const waHref = waDigits ? buildWhatsAppChatUrl(waDigits, WHATSAPP_PREFILL) : null
  const place = freshPlace(config?.branding?.address)

  return (
    <main className="bb-links">
      <div className="bb-links__profile">
        <div className="bb-links__ring">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${siteName} logo`} />
          ) : (
            <span className="bb-links__avatar-fallback" aria-hidden="true">
              🍪
            </span>
          )}
        </div>
        <h1 className="bb-links__name">
          {lead}
          {accent ? <span>{accent}</span> : null}
        </h1>
        <p className="bb-links__tagline">{tagline}</p>
      </div>

      <div className="bb-links__list">
        <Link
          className="bb-links__card bb-links__card--highlight"
          href="/"
          style={{ ['--accent' as string]: '#f5c842' }}
        >
          
          <span className="bb-links__text">
            <span className="bb-links__title">Order Now</span>
            {/* <span className="bb-links__sub">Pick-up · Local delivery · Pan-India shipping</span> */}
          </span>
          <span className="bb-links__arrow" aria-hidden="true">
            →
          </span>
        </Link>

        <p className="bb-links__label">Follow Us</p>
        <a
          className="bb-links__card"
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ['--accent' as string]: '#e1306c', ['--icon-bg' as string]: '#fce4ec' }}
        >
          <span className="bb-links__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="bb-links-ig" cx="30%" cy="107%" r="130%">
                  <stop offset="0%" stopColor="#fdf497" />
                  <stop offset="5%" stopColor="#fdf497" />
                  <stop offset="45%" stopColor="#fd5949" />
                  <stop offset="60%" stopColor="#d6249f" />
                  <stop offset="90%" stopColor="#285AEB" />
                </radialGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#bb-links-ig)" />
              <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
            </svg>
          </span>
          <span className="bb-links__text">
            <span className="bb-links__title">Instagram</span>
            <span className="bb-links__sub"> {handle}</span>
          </span>
          <span className="bb-links__arrow" aria-hidden="true">
            ↗
          </span>
        </a>

        {waHref && waDigits ? (
          <>
            <p className="bb-links__label">Contact</p>
            <a
              className="bb-links__card"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ['--accent' as string]: '#25d366', ['--icon-bg' as string]: '#e8f8ee' }}
            >
              <span className="bb-links__icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#25d366">
                  <path d="M16.002 2.667C8.638 2.667 2.667 8.636 2.667 16c0 2.35.627 4.638 1.816 6.648L2.667 29.333l6.86-1.796A13.27 13.27 0 0 0 16.002 29.333C23.365 29.333 29.333 23.364 29.333 16S23.365 2.667 16.002 2.667zm0 2.4c5.92 0 10.931 5.009 10.931 10.933 0 5.923-5.011 10.933-10.931 10.933a10.9 10.9 0 0 1-5.56-1.52l-.397-.237-4.072 1.066 1.084-3.966-.26-.412A10.882 10.882 0 0 1 5.07 16c0-5.924 5.011-10.933 10.932-10.933zm-3.127 5.6c-.28 0-.735.104-1.12.52-.384.417-1.466 1.432-1.466 3.49 0 2.06 1.5 4.052 1.71 4.333.208.28 2.912 4.622 7.163 6.297 3.54 1.396 4.258 1.118 5.025 1.048.768-.07 2.476-.998 2.826-1.965.35-.966.35-1.794.245-1.966-.104-.173-.384-.278-.803-.487-.418-.208-2.476-1.224-2.859-1.362-.384-.14-.663-.209-.942.208-.28.416-1.083 1.362-1.327 1.64-.244.278-.488.313-.906.105-.419-.209-1.768-.651-3.368-2.079-1.245-1.11-2.086-2.48-2.33-2.898-.244-.418-.026-.644.183-.852.188-.187.419-.487.628-.73.209-.243.278-.417.418-.696.14-.278.07-.522-.035-.73-.104-.208-.93-2.275-1.29-3.108-.34-.81-.694-.7-.942-.71-.244-.01-.523-.013-.802-.013z" />
                </svg>
              </span>
              <span className="bb-links__text">
                <span className="bb-links__title">WhatsApp Us</span>
                <span className="bb-links__sub"> {formatWhatsAppDisplay(waDigits)}</span>
              </span>
              <span className="bb-links__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </>
        ) : null}

        </div>

      <p className="bb-links__footer">
        Made fresh in <strong>{place.strong}</strong>
        {place.rest}
        <br />
        <Link href="/">{homeLabel}</Link>
      </p>
    </main>
  )
}
