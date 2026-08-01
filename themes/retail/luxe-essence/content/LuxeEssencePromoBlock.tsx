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
        <div className="le-promo-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
        </div>
      ) : null}
      <div className="le-promo-copy">
        <h3 className="le-promo-title">{slide.title}</h3>
        {subtitle ? <p className="le-promo-sub">{subtitle}</p> : null}
        {description ? <p className="le-promo-desc">{description}</p> : null}
        {ctaText && ctaUrl ? <span className="le-promo-cta">{ctaText}</span> : null}
      </div>
    </>
  )

  if (ctaUrl) {
    const external = /^https?:\/\//i.test(ctaUrl)
    if (external) {
      return (
        <a
          className="le-promo-card"
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {inner}
        </a>
      )
    }
    return (
      <Link className="le-promo-card" href={ctaUrl}>
        {inner}
      </Link>
    )
  }

  return <article className="le-promo-card">{inner}</article>
}

export function LuxeEssencePromoBlock({ slides }: { slides: StorefrontSlider[] }) {
  if (!slides.length) return null

  return (
    <PromoBlock
      items={slides}
      className="le-promo"
      listClassName="le-promo-list"
      itemClassName="le-promo-item"
      getItemKey={(slide) => slide.id}
      renderItem={(slide) => <PromoCard slide={slide} />}
    />
  )
}
