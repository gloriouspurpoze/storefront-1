import { Fragment, type ReactNode } from 'react'
import type { StorefrontCmsFaq, StorefrontCmsTestimonial, StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { TrustSection } from '../TrustSection'
import type { PublicService, ThemeTenant } from '../types'
import { TradeProAbout } from './TradeProAbout'
import { TradeProFaq } from './TradeProFaq'
import { TradeProFinalCta } from './TradeProFinalCta'
import { TradeProFooter } from './TradeProFooter'
import { TradeProHeader } from './TradeProHeader'
import { TradeProHero } from './TradeProHero'
import { TradeProHowItWorks } from './TradeProHowItWorks'
import { TradeProServiceGrid } from './TradeProServiceGrid'
import { TradeProShell } from './TradeProShell'
import { TradeProStatsBar } from './TradeProStatsBar'
import { TradeProWhyChooseUs } from './TradeProWhyChooseUs'
import { homepageSectionOrder, THEME_SECTIONS } from '@/lib/storefrontSections'

const TRADE_PRO_SECTIONS = THEME_SECTIONS['trade-pro']

export function TradeProPage({
  tenant,
  config,
  navLinks,
  footerLinks,
  services,
  faqs,
  testimonials,
  addonsSlot,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
  services: PublicService[]
  faqs: StorefrontCmsFaq[]
  testimonials: StorefrontCmsTestimonial[]
  addonsSlot?: ReactNode
}) {
  const headline = config?.content?.heroHeadline || `${tenant.name}, done right the first time.`
  const subcopy = config?.content?.heroSubcopy || tenant.tagline
  const ctaLabel = config?.content?.heroCtaLabel
  const phone = config?.branding?.contactPhone
  const avgRating = averageRating(services)
  const reviews = totalReviews(services)
  // DESIGN: hide rating chip when there are no reviews (not just missing rating).
  const rating = avgRating != null && reviews > 0 ? avgRating : undefined
  const reviewCount = reviews > 0 ? reviews : undefined

  const blocks: Record<(typeof TRADE_PRO_SECTIONS)[number], ReactNode> = {
    hero: (
      <TradeProHero
        headline={headline}
        subcopy={subcopy}
        services={services}
        rating={rating}
        reviewCount={reviewCount}
        ctaLabel={ctaLabel}
        phone={phone}
      />
    ),
    stats: <TradeProStatsBar />,
    services: (
      <TradeProServiceGrid
        services={services}
        title="Our services"
        subtitle="Licensed pros for every job, big or small."
        phone={phone}
      />
    ),
    howItWorks: <TradeProHowItWorks />,
    whyChooseUs: <TradeProWhyChooseUs />,
    trust: testimonials.length > 0 ? <TrustSection testimonials={testimonials} /> : null,
    about: <TradeProAbout title={config?.content?.aboutTitle} body={config?.content?.aboutBody} />,
    faq: <TradeProFaq faqs={faqs} />,
    cta: <TradeProFinalCta phone={phone} />,
  }

  return (
    <TradeProShell tenantId={tenant.id}>
      <TradeProHeader
        tenant={tenant}
        navLinks={navLinks}
        phone={phone}
        serviceArea={config?.branding?.address}
      />

      <main>
        {homepageSectionOrder(config, TRADE_PRO_SECTIONS).map((type) => (
          <Fragment key={type}>{blocks[type as keyof typeof blocks]}</Fragment>
        ))}

        {addonsSlot}
      </main>

      <TradeProFooter tenant={tenant} config={config} navLinks={footerLinks} />
    </TradeProShell>
  )
}

function averageRating(services: PublicService[]): number | null {
  const rated = services.filter((s) => typeof s.rating === 'number' && s.rating > 0)
  if (!rated.length) return null
  return rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length
}

function totalReviews(services: PublicService[]): number {
  return services.reduce((sum, s) => sum + (s.reviewCount ?? 0), 0)
}
