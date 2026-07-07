'use client'

import Link from 'next/link'
import { PopupBanner, popupStorageKey } from '@/components/content/PopupBanner'
import type { StorefrontBanner } from '@/lib/storefront-api'
import { getBannerImageUrl } from '@/lib/storefrontContent'

export function MenuFastCardsPopupBanner({
  banner,
  tenantId,
}: {
  banner: StorefrontBanner
  tenantId: string
}) {
  const imageUrl = getBannerImageUrl(banner)
  const description = banner.description?.trim()
  const cta = banner.cta
  const ctaText = cta?.text?.trim()
  const ctaUrl = cta?.link?.trim()

  return (
    <PopupBanner
      storageKey={popupStorageKey(tenantId)}
      className="mf-cards-popup-root"
      backdropClassName="mf-cards-popup-backdrop"
      panelClassName="mf-cards-popup-panel"
      closeClassName="mf-cards-popup-close"
      ariaLabel={banner.title}
    >
      {imageUrl ? (
        <div className="mf-cards-popup-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" />
        </div>
      ) : null}
      <div className="mf-cards-popup-body">
        <h2 className="mf-cards-popup-title">{banner.title}</h2>
        {description ? <p className="mf-cards-popup-desc">{description}</p> : null}
        {ctaText && ctaUrl ? (
          cta?.openInNewTab || /^https?:\/\//i.test(ctaUrl) ? (
            <a
              className="mf-cards-popup-cta"
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ctaText}
            </a>
          ) : (
            <Link className="mf-cards-popup-cta" href={ctaUrl}>
              {ctaText}
            </Link>
          )
        ) : null}
      </div>
    </PopupBanner>
  )
}
