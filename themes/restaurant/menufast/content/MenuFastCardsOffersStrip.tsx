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
        <div className="mf-cards-offer-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
        </div>
      ) : null}
      <div className="mf-cards-offer-copy">
        <p className="mf-cards-offer-title">{slide.title}</p>
        {subtitle ? <p className="mf-cards-offer-sub">{subtitle}</p> : null}
        {description ? <p className="mf-cards-offer-desc">{description}</p> : null}
        {ctaText && ctaUrl ? (
          <span className="mf-cards-offer-cta">{ctaText}</span>
        ) : null}
      </div>
    </>
  )

  if (ctaUrl) {
    const external = /^https?:\/\//i.test(ctaUrl)
    if (external) {
      return (
        <a
          className="mf-cards-offer-card"
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {body}
        </a>
      )
    }
    return (
      <Link className="mf-cards-offer-card" href={ctaUrl}>
        {body}
      </Link>
    )
  }

  return <article className="mf-cards-offer-card">{body}</article>
}

export function MenuFastCardsOffersStrip({ slides }: { slides: StorefrontSlider[] }) {
  if (!slides.length) return null

  return (
    <OffersStrip
      items={slides}
      className="mf-cards-offers"
      trackClassName="mf-cards-offers-track"
      slideClassName="mf-cards-offers-slide"
      dotsClassName="mf-cards-offers-dots"
      dotClassName="mf-cards-offers-dot"
      dotActiveClassName="mf-cards-offers-dot--active"
      getItemKey={(slide) => slide.id}
      renderItem={(slide) => <OfferSlideCard slide={slide} />}
    />
  )
}
