'use client'

import Link from 'next/link'
import { PromoBlock } from '@/components/content/PromoBlock'
import type { StorefrontSlider } from '@/lib/storefront-api'
import { getSlideImageUrl } from '@/lib/storefrontContent'

function PromoCard({ slide }: { slide: StorefrontSlider }) {
  const imageUrl = getSlideImageUrl(slide)
  const subtitle = slide.subtitle?.trim()
  const description = slide.description?.trim()
  const ctaText = slide.button_text?.trim()
  const ctaUrl = slide.button_url?.trim()

  const inner = (
    <>
      {imageUrl ? (
        <div className="mf-cards-promo-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
        </div>
      ) : null}
      <div className="mf-cards-promo-copy">
        <h3 className="mf-cards-promo-title">{slide.title}</h3>
        {subtitle ? <p className="mf-cards-promo-sub">{subtitle}</p> : null}
        {description ? <p className="mf-cards-promo-desc">{description}</p> : null}
        {ctaText && ctaUrl ? <span className="mf-cards-promo-cta">{ctaText}</span> : null}
      </div>
    </>
  )

  if (ctaUrl) {
    const external = /^https?:\/\//i.test(ctaUrl)
    if (external) {
      return (
        <a
          className="mf-cards-promo-card"
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {inner}
        </a>
      )
    }
    return (
      <Link className="mf-cards-promo-card" href={ctaUrl}>
        {inner}
      </Link>
    )
  }

  return <article className="mf-cards-promo-card">{inner}</article>
}

export function MenuFastCardsPromoBlock({ slides }: { slides: StorefrontSlider[] }) {
  if (!slides.length) return null

  return (
    <PromoBlock
      items={slides}
      className="mf-cards-promo"
      listClassName="mf-cards-promo-list"
      itemClassName="mf-cards-promo-item"
      getItemKey={(slide) => slide.id}
      renderItem={(slide) => <PromoCard slide={slide} />}
    />
  )
}
