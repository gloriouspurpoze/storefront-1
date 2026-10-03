import Link from 'next/link'
import './sections.css'

/** Brand-coloured call-to-action band (gift match, booking, newsletter-free CTAs). */
export function PromoBand({
  eyebrow,
  title,
  text,
  ctaLabel,
  ctaHref,
}: {
  eyebrow?: string
  title: string
  text?: string
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <section className="sf-section sf-container">
      <div className="sf-promo-band">
        <div>
          {eyebrow && <p className="sf-promo-band__eyebrow">{eyebrow}</p>}
          <h2 className="sf-promo-band__title">{title}</h2>
          {text && <p className="sf-promo-band__text">{text}</p>}
        </div>
        <Link href={ctaHref} className="sf-btn sf-btn--lg sf-btn--inverse">
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
