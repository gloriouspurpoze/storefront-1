import Link from 'next/link'
import type { ReactNode } from 'react'
import { AnnouncementBar } from '@/components/content/AnnouncementBar'
import { OffersStrip } from '@/components/content/OffersStrip'
import { PopupBanner, popupStorageKey } from '@/components/content/PopupBanner'
import { PromoBlock } from '@/components/content/PromoBlock'
import type { ResolvedAnnouncement } from '@/lib/storefrontContent'
import { getBannerImageUrl, getSlideImageUrl } from '@/lib/storefrontContent'
import type { StorefrontBanner, StorefrontSlider } from '@/lib/storefront-api'

/** Theme-skinned announcement marquee — `classPrefix` becomes `{prefix}-announcement*`. */
export function createThemedAnnouncementBar(classPrefix: string) {
  return function ThemedAnnouncementBar({ data }: { data: ResolvedAnnouncement }) {
    return (
      <AnnouncementBar
        title={data.title}
        description={data.description}
        ctaText={data.ctaText}
        ctaUrl={data.ctaUrl}
        className={`${classPrefix}-announcement`}
        innerClassName={`${classPrefix}-announcement-inner`}
        titleClassName={`${classPrefix}-announcement-title`}
        descriptionClassName={`${classPrefix}-announcement-desc`}
        ctaClassName={`${classPrefix}-announcement-cta`}
      />
    )
  }
}

/** Internal `<Link>` unless external or explicitly opened in a new tab. */
function themedLink(ctaUrl: string, className: string, children: ReactNode, openInNewTab?: boolean) {
  const external = openInNewTab || /^https?:\/\//i.test(ctaUrl)
  if (external) {
    return (
      <a className={className} href={ctaUrl} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link className={className} href={ctaUrl}>
      {children}
    </Link>
  )
}

/** Theme-skinned slide/promo media card shared by OffersStrip and PromoBlock renders. */
function createSlideCard(classPrefix: string, kind: 'offer' | 'promo', TitleTag: 'p' | 'h3') {
  return function SlideCard({ slide }: { slide: StorefrontSlider }) {
    const imageUrl = getSlideImageUrl(slide)
    const subtitle = slide.subtitle?.trim()
    const description = slide.description?.trim()
    const ctaText = slide.button_text?.trim()
    const ctaUrl = slide.button_url?.trim()
    const base = `${classPrefix}-${kind}`

    const body = (
      <>
        {imageUrl ? (
          <div className={`${base}-media`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={slide.image_alt?.trim() || slide.title} />
          </div>
        ) : null}
        <div className={`${base}-copy`}>
          <TitleTag className={`${base}-title`}>{slide.title}</TitleTag>
          {subtitle ? <p className={`${base}-sub`}>{subtitle}</p> : null}
          {description ? <p className={`${base}-desc`}>{description}</p> : null}
          {ctaText && ctaUrl ? <span className={`${base}-cta`}>{ctaText}</span> : null}
        </div>
      </>
    )

    if (ctaUrl) return themedLink(ctaUrl, `${base}-card`, body)

    return <article className={`${base}-card`}>{body}</article>
  }
}

/** Theme-skinned offers carousel — `classPrefix` becomes `{prefix}-offers*` / `{prefix}-offer-*`. */
export function createThemedOffersStrip(classPrefix: string) {
  const OfferSlideCard = createSlideCard(classPrefix, 'offer', 'p')
  return function ThemedOffersStrip({ slides }: { slides: StorefrontSlider[] }) {
    if (!slides.length) return null
    return (
      <OffersStrip
        items={slides}
        className={`${classPrefix}-offers`}
        trackClassName={`${classPrefix}-offers-track`}
        slideClassName={`${classPrefix}-offers-slide`}
        dotsClassName={`${classPrefix}-offers-dots`}
        dotClassName={`${classPrefix}-offers-dot`}
        dotActiveClassName={`${classPrefix}-offers-dot--active`}
        getItemKey={(slide) => slide.id}
        renderItem={(slide) => <OfferSlideCard slide={slide} />}
      />
    )
  }
}

/** Theme-skinned inline promo block — `classPrefix` becomes `{prefix}-promo*`. */
export function createThemedPromoBlock(classPrefix: string) {
  const PromoCard = createSlideCard(classPrefix, 'promo', 'h3')
  return function ThemedPromoBlock({ slides }: { slides: StorefrontSlider[] }) {
    if (!slides.length) return null
    return (
      <PromoBlock
        items={slides}
        className={`${classPrefix}-promo`}
        listClassName={`${classPrefix}-promo-list`}
        itemClassName={`${classPrefix}-promo-item`}
        getItemKey={(slide) => slide.id}
        renderItem={(slide) => <PromoCard slide={slide} />}
      />
    )
  }
}

/** Theme-skinned session-dismissible pop-up — `classPrefix` becomes `{prefix}-popup*`. */
export function createThemedPopupBanner(classPrefix: string) {
  return function ThemedPopupBanner({
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
        className={`${classPrefix}-popup-root`}
        backdropClassName={`${classPrefix}-popup-backdrop`}
        panelClassName={`${classPrefix}-popup-panel`}
        closeClassName={`${classPrefix}-popup-close`}
        ariaLabel={banner.title}
      >
        {imageUrl ? (
          <div className={`${classPrefix}-popup-media`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" />
          </div>
        ) : null}
        <div className={`${classPrefix}-popup-body`}>
          <h2 className={`${classPrefix}-popup-title`}>{banner.title}</h2>
          {description ? <p className={`${classPrefix}-popup-desc`}>{description}</p> : null}
          {ctaText && ctaUrl
            ? themedLink(ctaUrl, `${classPrefix}-popup-cta`, ctaText, cta?.openInNewTab)
            : null}
        </div>
      </PopupBanner>
    )
  }
}
