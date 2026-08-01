'use client'

import Link from 'next/link'
import { OffersStrip } from '@/components/content/OffersStrip'
import type { StorefrontSlider } from '@/lib/storefront-api'
import { getSlideImageUrl } from '@/lib/storefrontContent'

function OfferSlideCard({ slide }: { slide: StorefrontSlider }) {
  const imageUrl = getSlideImageUrl(slide)
  const subtitle = slide.subtitle?.trim()
  const description = slide.description?.trim()
  const ctaText = slide.button_text?.trim()
  const ctaUrl = slide.button_url?.trim()

  const body = (
    <>
      {imageUrl ? (
        <div className="le-offer-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
        </div>
      ) : null}
      <div className="le-offer-copy">
        <p className="le-offer-title">{slide.title}</p>
        {subtitle ? <p className="le-offer-sub">{subtitle}</p> : null}
        {description ? <p className="le-offer-desc">{description}</p> : null}
        {ctaText && ctaUrl ? <span className="le-offer-cta">{ctaText}</span> : null}
      </div>
    </>
  )

  if (ctaUrl) {
    const external = /^https?:\/\//i.test(ctaUrl)
    if (external) {
      return (
        <a
          className="le-offer-card"
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {body}
        </a>
      )
    }
    return (
      <Link className="le-offer-card" href={ctaUrl}>
        {body}
      </Link>
    )
  }

  return <article className="le-offer-card">{body}</article>
}

export function LuxeEssenceOffersStrip({ slides }: { slides: StorefrontSlider[] }) {
  if (!slides.length) return null

  return (
    <OffersStrip
      items={slides}
      className="le-offers"
      trackClassName="le-offers-track"
      slideClassName="le-offers-slide"
      dotsClassName="le-offers-dots"
      dotClassName="le-offers-dot"
      dotActiveClassName="le-offers-dot--active"
      getItemKey={(slide) => slide.id}
      renderItem={(slide) => <OfferSlideCard slide={slide} />}
    />
  )
}
