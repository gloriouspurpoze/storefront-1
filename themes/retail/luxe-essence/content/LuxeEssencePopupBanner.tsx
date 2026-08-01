'use client'

import Link from 'next/link'
import { PopupBanner, popupStorageKey } from '@/components/content/PopupBanner'
import type { StorefrontBanner } from '@/lib/storefront-api'
import { getBannerImageUrl } from '@/lib/storefrontContent'

export function LuxeEssencePopupBanner({
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
      className="le-popup-root"
      backdropClassName="le-popup-backdrop"
      panelClassName="le-popup-panel"
      closeClassName="le-popup-close"
      ariaLabel={banner.title}
    >
      {imageUrl ? (
        <div className="le-popup-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" />
        </div>
      ) : null}
      <div className="le-popup-body">
        <h2 className="le-popup-title">{banner.title}</h2>
        {description ? <p className="le-popup-desc">{description}</p> : null}
        {ctaText && ctaUrl ? (
          cta?.openInNewTab || /^https?:\/\//i.test(ctaUrl) ? (
            <a
              className="le-popup-cta"
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ctaText}
            </a>
          ) : (
            <Link className="le-popup-cta" href={ctaUrl}>
              {ctaText}
            </Link>
          )
        ) : null}
      </div>
    </PopupBanner>
  )
}
