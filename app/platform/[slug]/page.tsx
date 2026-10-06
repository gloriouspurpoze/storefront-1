import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import {
  MARKETING_VERTICALS,
  getVerticalLandingContent,
  marketingPlansForVertical,
  marketingVerticalBySlug,
  type MarketingVertical,
} from '@profixer/marketing-data'
import { PLATFORM_BRAND, signupUrl, siteUrl } from '@/platform/config'
import { platformCmsPage, sanitizeCmsHtml } from '@/platform/cms'
import { pageMetadata, truncate } from '@/platform/seo'
import { AttributionLink } from '@/platform/components/AttributionLink'
import { CtaBand } from '@/platform/components/CtaBand'
import { DemoCallButton, DemoIndustryHint } from '@/platform/components/DemoRequest'
import { Faq, faqJsonLd } from '@/platform/components/Faq'
import { Header } from '@/platform/components/Header'
import { JsonLd } from '@/platform/components/JsonLd'
import { PlanCards, plansJsonLd } from '@/platform/components/PlanCards'
import { ProductPreview } from '@/platform/components/ProductPreview'
import { Container, SectionTitle, outlineButton, primaryButton } from '@/platform/components/Section'
import { PAIN_ICONS, PILLAR_ICONS } from '@/platform/components/icons'

/** Industry pages are prebuilt; any other slug is a CMS page (comparisons, features, legal). */
export const revalidate = 3600
export const dynamicParams = true

type RouteParams = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return MARKETING_VERTICALS.map((v) => ({ slug: v.marketingSlug }))
}

function industryTitle(v: MarketingVertical): string {
  return `${v.label} software — bookings, CRM & billing`
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params
  const vertical = marketingVerticalBySlug(slug)
  if (vertical) {
    const content = getVerticalLandingContent(vertical.key)
    return pageMetadata({
      title: industryTitle(vertical),
      description: truncate(content.subtitle),
      path: `/${slug}`,
      ogTitle: content.titleAccent,
      eyebrow: `${PLATFORM_BRAND} for ${vertical.label}`,
    })
  }
  const page = await platformCmsPage(slug)
  if (!page) return { title: 'Page not found', robots: { index: false } }
  return pageMetadata({
    title: page.seo?.title || page.title,
    description: truncate(page.seo?.description || page.excerpt || page.title),
    path: `/${slug}`,
    ogTitle: page.title,
  })
}

export default async function PlatformSlugPage({ params }: RouteParams) {
  const { slug } = await params
  const vertical = marketingVerticalBySlug(slug)
  if (vertical) return <IndustryPage vertical={vertical} />

  const page = await platformCmsPage(slug)
  if (!page) notFound()
  return (
    <>
      <JsonLd data={breadcrumbs([{ name: page.title, path: `/${slug}` }])} />
      <Header />
      <main>
        <Container className="max-w-3xl py-16 sm:py-24">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{page.title}</h1>
          {page.excerpt ? <p className="mt-4 text-lg text-tq-muted">{page.excerpt}</p> : null}
          <div
            className="tq-prose mt-10"
            // CMS HTML from the platform tenant (super-admin authored), sanitized server-side.
            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content ?? '') }}
          />
        </Container>
        <CtaBand trialHref={signupUrl()} />
      </main>
    </>
  )
}

function breadcrumbs(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: PLATFORM_BRAND, path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  }
}

/**
 * One page per industry pack. Testimonials and outcome stats from the shared copy are
 * deliberately not rendered: publish them only once they are real, consented customer results.
 */
function IndustryPage({ vertical }: { vertical: MarketingVertical }) {
  const content = getVerticalLandingContent(vertical.key)
  const plans = marketingPlansForVertical(vertical.key)
  const trialHref = signupUrl(vertical.key)
  const label = vertical.label.toLowerCase()

  return (
    <>
      <JsonLd
        data={[
          breadcrumbs([{ name: vertical.label, path: `/${vertical.marketingSlug}` }]),
          plansJsonLd(plans, `${PLATFORM_BRAND} for ${vertical.label}`, siteUrl(`/${vertical.marketingSlug}`)),
          faqJsonLd(content.faq),
        ]}
      />
      <DemoIndustryHint label={vertical.label} />
      <Header trialHref={trialHref} trialLabel={content.ctaLabel} />
      <main>
        {/* Hero */}
        <section className="border-b border-tq-line bg-gradient-to-b from-tq-primary-soft/40 to-white">
          <Container className="grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-tq-primary-soft px-3 py-1 text-xs font-semibold text-tq-primary-deep">
                {content.eyebrow}
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {content.title} <span className="text-tq-primary">{content.titleAccent}</span>
              </h1>
              <p className="mt-5 text-lg text-tq-muted">{content.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <AttributionLink href={trialHref} className={primaryButton}>
                  {content.ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </AttributionLink>
                <DemoCallButton className={outlineButton} />
              </div>
              <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                {content.proof.map((p) => (
                  <li key={p.label} className="rounded-xl border border-tq-line bg-white/80 p-3 text-center">
                    <p className="text-2xl font-bold text-tq-primary">{p.value}</p>
                    <p className="text-xs text-tq-muted">{p.label}</p>
                  </li>
                ))}
              </ul>
            </div>
            <ProductPreview compact />
          </Container>
        </section>

        {/* Problem */}
        <section className="bg-tq-wash py-20" id="problem">
          <Container>
            <SectionTitle eyebrow="The revenue leak" title={`Why ${label} businesses outgrow spreadsheets and WhatsApp`} />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {content.pains.map((pain) => {
                const Icon = PAIN_ICONS[pain.icon]
                return (
                  <div key={pain.title} className="rounded-2xl border border-tq-line bg-white p-6">
                    <span className="mb-4 inline-flex rounded-xl bg-tq-primary-soft p-3 text-tq-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="text-lg font-semibold">{pain.title}</h3>
                    <p className="mt-2 text-sm text-tq-muted">{pain.body}</p>
                  </div>
                )
              })}
            </div>
          </Container>
        </section>

        {/* Solution */}
        <section className="py-20" id="solution">
          <Container>
            <SectionTitle eyebrow={`How ${PLATFORM_BRAND} helps`} title="Three pillars, one workspace, no second login." />
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {content.pillars.map((p) => {
                const Icon = PILLAR_ICONS[p.icon]
                return (
                  <div key={p.title} className="rounded-2xl border border-tq-line p-6">
                    <Icon className="h-6 w-6 text-tq-primary" aria-hidden />
                    <h3 className="mt-4 font-semibold">{p.title}</h3>
                    <p className="mt-2 text-sm text-tq-muted">{p.body}</p>
                  </div>
                )
              })}
            </div>
          </Container>
        </section>

        {/* Pricing */}
        <section className="bg-tq-wash py-20" id="pricing">
          <Container>
            <SectionTitle
              eyebrow="Transparent pricing"
              title={`Plans built for ${label} — not your commission.`}
              subtitle="Start with a 14-day free trial; upgrade when you're ready. Prices in INR."
            />
            <PlanCards plans={plans} trialHref={trialHref} ctaLabel={content.ctaLabel} />
            <p className="mt-8 text-center text-sm text-tq-muted">
              Not a {label} business?{' '}
              <a href="/#industries" className="font-medium text-tq-primary hover:underline">
                See every industry
              </a>
              .
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-20" id="faq">
          <Container>
            <SectionTitle eyebrow="Questions, answered" title={`What ${label} operators ask before they switch`} />
            <Faq items={content.faq} />
          </Container>
        </section>

        <CtaBand
          title={`Ready to run your ${label} business on one platform?`}
          subtitle={
            content.isEarlyAccess
              ? `Join early-access ${label} operators shaping what ships next.`
              : 'Replace tool sprawl with one console, one CRM and one branded storefront.'
          }
          trialHref={trialHref}
          trialLabel={content.ctaLabel}
        />
      </main>
    </>
  )
}
