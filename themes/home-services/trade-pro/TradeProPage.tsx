import type { StorefrontCmsFaq, StorefrontCmsTestimonial, StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import { ServiceGrid } from '../ServiceGrid'
import { TrustSection } from '../TrustSection'
import type { PublicService, ThemeTenant } from '../types'
import { TradeProAbout } from './TradeProAbout'
import { TradeProFaq } from './TradeProFaq'
import { TradeProFinalCta } from './TradeProFinalCta'
import { TradeProFooter } from './TradeProFooter'
import { TradeProHeader } from './TradeProHeader'
import { TradeProHero } from './TradeProHero'
import { TradeProHowItWorks } from './TradeProHowItWorks'
import { TradeProStatsBar } from './TradeProStatsBar'
import { TradeProWhyChooseUs } from './TradeProWhyChooseUs'

export function TradeProPage({
  tenant,
  config,
  navLinks,
  footerLinks,
  services,
  faqs,
  testimonials,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  footerLinks?: StorefrontNavLink[]
  services: PublicService[]
  faqs: StorefrontCmsFaq[]
  testimonials: StorefrontCmsTestimonial[]
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

  return (
    <>
      <TradeProHeader
        tenant={tenant}
        navLinks={navLinks}
        phone={phone}
        serviceArea={config?.branding?.address}
      />

      <main>
        <TradeProHero
          tenantId={tenant.id}
          headline={headline}
          subcopy={subcopy}
          services={services}
          rating={rating}
          reviewCount={reviewCount}
          ctaLabel={ctaLabel}
          phone={phone}
        />

        <TradeProStatsBar />

        <ServiceGrid
          services={services}
          title="Our services"
          subtitle="Licensed pros for every job, big or small."
          phone={phone}
        />

        <TradeProHowItWorks />

        <TradeProWhyChooseUs />

        {testimonials.length > 0 && <TrustSection testimonials={testimonials} />}

        <TradeProAbout title={config?.content?.aboutTitle} body={config?.content?.aboutBody} />

        <TradeProFaq faqs={faqs} />

        <TradeProFinalCta phone={phone} />
      </main>

      <TradeProFooter tenant={tenant} config={config} navLinks={footerLinks} />
    </>
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
