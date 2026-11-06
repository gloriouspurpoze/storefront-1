import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { buildWhatsAppChatUrl, resolveWhatsAppNumber, whatsAppPrefillMessage } from '@/lib/storefrontWhatsApp'

/**
 * CMS paste (Word/Docs → Quill) often joins every word with &nbsp;, which makes a
 * paragraph one unbreakable word and forces mid-word wrapping ("cho|colate").
 * Turn those back into normal spaces and drop empty paragraphs.
 */
export function normalizeProseHtml(html: string): string {
  return html
    .replace(/(&nbsp;| )/g, ' ')
    .replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '')
    .trim()
}

/** Same intro on every Brown Butter page: breadcrumb → kicker → title → lead. */
export function BrownButterPageIntro({
  crumbs,
  kicker,
  title,
  lead,
  meta,
}: {
  /** Middle/last crumbs after "Menu"; last one is the current page. */
  crumbs: Array<{ label: string; href?: string }>
  kicker?: string
  title: string
  lead?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="bb-intro">
      <nav className="bb-crumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Menu</Link>
          </li>
          {crumbs.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
              {crumb.href && i < crumbs.length - 1 ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
            </li>
          ))}
        </ol>
      </nav>
      {kicker ? <p className="bb-kicker">{kicker}</p> : null}
      <h1 className="bb-page-title">{title}</h1>
      {meta ? <p className="bb-intro__meta">{meta}</p> : null}
      {lead ? <p className="bb-lead">{lead}</p> : null}
    </header>
  )
}

/** Sticky side card on reading pages: brings readers back to ordering. */
export function BrownButterOrderCard({
  config,
  siteName,
  logoUrl,
}: {
  config: StorefrontConfig | null
  siteName: string
  logoUrl?: string
}) {
  const waDigits = resolveWhatsAppNumber(config)
  const waHref = waDigits ? buildWhatsAppChatUrl(waDigits, whatsAppPrefillMessage(siteName)) : null
  return (
    <aside className="bb-order-card" aria-label={`Order from ${siteName}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="bb-order-card__logo" src={logoUrl} alt="" width={64} height={64} />
      ) : null}
      <p className="bb-order-card__title">Fresh cookies, baked to order</p>
      <p className="bb-order-card__text">Small-batch, pure veg. Pickup in Mira Road or delivery across Mumbai.</p>
      <Link href="/" className="btn bb-order-card__cta">
        <span>Browse the menu</span>
        <span aria-hidden>→</span>
      </Link>
      {waHref ? (
        <a className="bb-order-card__wa" href={waHref} target="_blank" rel="noopener noreferrer">
          Questions? Chat on WhatsApp
        </a>
      ) : null}
    </aside>
  )
}
