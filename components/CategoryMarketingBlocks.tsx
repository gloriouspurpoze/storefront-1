'use client'

import type { CategoryMarketingConfig } from '@/lib/categoryMarketing'
import { SanitizedMarketingHtml } from './SanitizedMarketingHtml'
import './category-marketing.css'

export function CategoryMarketingBlocks({
  config,
  className = '',
}: {
  config: CategoryMarketingConfig
  className?: string
}) {
  const cards = config.serviceCards.filter((c) => c.title.trim())
  const types = config.serviceTypes.filter((s) => s.title.trim())
  const trust = config.trustBenefits.filter((t) => t.heading.trim())
  const faqs = config.faqs.filter((f) => f.question.trim())
  const pricing = config.spareParts.filter((p) => p.name.trim())
  const chips = config.topicChips.filter((x) => x.trim())
  const related = config.relatedLinks.filter((l) => l.label.trim() && l.url.trim())
  const hasHero =
    config.mainHeading.trim() ||
    config.intro.trim() ||
    config.heroTrustBadge.trim() ||
    config.heroChip.trim() ||
    config.image1?.trim()

  if (
    !hasHero &&
    !cards.length &&
    !types.length &&
    !trust.length &&
    !faqs.length &&
    !pricing.length &&
    !related.length
  ) {
    return null
  }

  return (
    <section className={`mf-cat-marketing ${className}`.trim()} aria-label="Category information">
      {hasHero ? (
        <div className="mf-cat-marketing-hero">
          {config.heroTrustBadge.trim() ? (
            <span className="mf-cat-marketing-badge">{config.heroTrustBadge}</span>
          ) : null}
          {config.mainHeading.trim() ? (
            <h2 className="mf-cat-marketing-title">{config.mainHeading}</h2>
          ) : null}
          {config.heroChip.trim() ? (
            <p className="mf-cat-marketing-chip">{config.heroChip}</p>
          ) : null}
          {config.intro.trim() ? (
            <SanitizedMarketingHtml html={config.intro} className="mf-cat-marketing-intro" />
          ) : null}
          {config.image1?.trim() ? (
            <div className="mf-cat-marketing-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.image1}
                alt={config.mainHeading.trim() || 'Category'}
                className="mf-cat-marketing-img"
                loading="lazy"
              />
              {config.image2?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.image2}
                  alt=""
                  className="mf-cat-marketing-img mf-cat-marketing-img--secondary"
                  loading="lazy"
                />
              ) : null}
            </div>
          ) : null}
          {chips.length > 0 ? (
            <div className="mf-cat-marketing-chips">
              {chips.map((chip) => (
                <span key={chip} className="mf-cat-marketing-chip-pill">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {cards.length > 0 ? (
        <div className="mf-cat-marketing-block">
          {config.serviceCardsEyebrow.trim() ? (
            <p className="mf-cat-marketing-eyebrow">{config.serviceCardsEyebrow}</p>
          ) : null}
          <h3 className="mf-cat-marketing-h3">
            {config.serviceCardsHeading.trim() || 'Featured'}
          </h3>
          <div className="mf-cat-marketing-cards">
            {cards.map((card) => (
              <article key={card.title} className="mf-cat-marketing-card">
                <h4 className="mf-cat-marketing-card-title">{card.title}</h4>
                {card.price.trim() ? (
                  <p className="mf-cat-marketing-card-price">{card.price}</p>
                ) : null}
                {card.description.trim() ? (
                  <SanitizedMarketingHtml
                    html={card.description}
                    className="mf-cat-marketing-card-desc"
                  />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {types.length > 0 ? (
        <div className="mf-cat-marketing-block">
          {config.serviceTypesEyebrow.trim() ? (
            <p className="mf-cat-marketing-eyebrow">{config.serviceTypesEyebrow}</p>
          ) : null}
          <h3 className="mf-cat-marketing-h3">
            {config.serviceTypesHeading.trim() || 'Highlights'}
          </h3>
          <div className="mf-cat-marketing-types">
            {types.map((st) => (
              <article key={st.title} className="mf-cat-marketing-type">
                <h4 className="mf-cat-marketing-card-title">{st.title}</h4>
                {st.description.trim() ? (
                  <SanitizedMarketingHtml html={st.description} className="mf-cat-marketing-card-desc" />
                ) : null}
                {st.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mf-cat-marketing-bullets">
                    {st.bullets.filter((b) => b.trim()).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {trust.length > 0 ? (
        <div className="mf-cat-marketing-block">
          {config.trustBenefitsEyebrow.trim() ? (
            <p className="mf-cat-marketing-eyebrow">{config.trustBenefitsEyebrow}</p>
          ) : null}
          <h3 className="mf-cat-marketing-h3">
            {config.trustBenefitsHeading.trim() || 'Why order from us'}
          </h3>
          <div className="mf-cat-marketing-trust">
            {trust.map((t) => (
              <div key={t.heading} className="mf-cat-marketing-trust-item">
                <h4 className="mf-cat-marketing-card-title">{t.heading}</h4>
                {t.body.trim() ? (
                  <SanitizedMarketingHtml html={t.body} className="mf-cat-marketing-card-desc" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pricing.length > 0 ? (
        <div className="mf-cat-marketing-block">
          <h3 className="mf-cat-marketing-h3">
            {config.pricingHeading.trim() || 'Pricing guide'}
          </h3>
          <ul className="mf-cat-marketing-pricing">
            {pricing.map((row) => (
              <li key={row.name}>
                <span>{row.name}</span>
                {row.priceRange.trim() ? <span>{row.priceRange}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {faqs.length > 0 ? (
        <div className="mf-cat-marketing-block">
          <h3 className="mf-cat-marketing-h3">FAQs</h3>
          <dl className="mf-cat-marketing-faqs">
            {faqs.map((faq) => (
              <div key={faq.question} className="mf-cat-marketing-faq">
                <dt className="mf-cat-marketing-faq-q">{faq.question}</dt>
                {faq.answer.trim() ? (
                  <dd>
                    <SanitizedMarketingHtml html={faq.answer} className="mf-cat-marketing-card-desc" />
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {config.closingParagraph.trim() ? (
        <SanitizedMarketingHtml
          html={config.closingParagraph}
          className="mf-cat-marketing-closing"
        />
      ) : null}

      {related.length > 0 ? (
        <nav className="mf-cat-marketing-related" aria-label="Related links">
          {related.map((link) => (
            <a key={`${link.label}-${link.url}`} href={link.url}>
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </section>
  )
}
