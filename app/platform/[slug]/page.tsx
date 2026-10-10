import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Fragment, type ReactNode } from 'react'
import { ArrowRight, BadgeCheck, BellRing, Check, ListChecks, Rocket, Share2, type LucideIcon } from 'lucide-react'
import {
  MARKETING_VERTICALS,
  getVerticalLandingContent,
  marketingPlansForVertical,
  marketingVerticalBySlug,
  type MarketingVertical,
} from '@profixer/marketing-data'
import { PLATFORM_BRAND, signupUrl, siteUrl } from '@/platform/config'
import { pageFaqs, pageTestimonials, platformCmsPage, platformSeoOverride, sanitizeCmsHtml } from '@/platform/cms'
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
import { PAIN_ICONS } from '@/platform/components/icons'
import { FeatureShowcase } from '@/platform/components/FeatureShowcase'
import { previewFor } from '@/platform/content/previews'
import type { FaqItem } from '@/platform/faqs'
import type { StorefrontCmsTestimonial } from '@/lib/cms-content'
import { Testimonials } from '@/platform/components/Testimonials'

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
      override: await platformSeoOverride(`/${slug}`),
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
  if (vertical) {
    const content = getVerticalLandingContent(vertical.key)
    const page = `industry:${vertical.key}` as const
    const [faqs, testimonials] = await Promise.all([pageFaqs(page, content.faq), pageTestimonials(page)])
    return <IndustryPage vertical={vertical} faqs={faqs} testimonials={testimonials} />
  }

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
 * One page per industry pack. Testimonials come from the CMS (real customers only);
 * the placeholder testimonials and outcome stats in the shared copy are deliberately not rendered.
 */
function IndustryPage({
  vertical,
  faqs,
  testimonials,
}: {
  vertical: MarketingVertical
  faqs: FaqItem[]
  testimonials: StorefrontCmsTestimonial[]
}) {
  const content = getVerticalLandingContent(vertical.key)
  const plans = marketingPlansForVertical(vertical.key)
  const trialHref = signupUrl(vertical.key)
  const label = vertical.label.toLowerCase()
  const preview = previewFor(vertical.key)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbs([{ name: vertical.label, path: `/${vertical.marketingSlug}` }]),
          plansJsonLd(plans, `${PLATFORM_BRAND} for ${vertical.label}`, siteUrl(`/${vertical.marketingSlug}`)),
          faqJsonLd(faqs),
        ]}
      />
      <DemoIndustryHint label={vertical.label} />
      <Header trialHref={trialHref} trialLabel={content.ctaLabel} />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Fine grid fading out from the top, plus two soft brand glows. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(2,74,216,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,74,216,0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_55%_at_50%_0%,black,transparent)]"
          />
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[360px] w-[900px] -translate-x-1/2 rounded-full bg-tq-primary-bright/15 blur-3xl sm:h-[520px] sm:bg-tq-primary-bright/20" />
          <Container className="relative pt-12 pb-16 text-center sm:pt-20 lg:pt-24">
            <p className="inline-flex items-center gap-2 rounded-full border border-tq-primary/15 bg-white/80 py-1 pr-3 pl-1 text-xs font-medium text-tq-ink shadow-sm backdrop-blur">
              <span className="rounded-full bg-tq-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {content.isEarlyAccess ? 'Early access' : 'New'}
              </span>
              {content.eyebrow}
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-[2.25rem] font-bold leading-[1.05] tracking-[-0.035em] text-tq-ink sm:text-6xl lg:text-7xl">
              {noBreakHyphens(content.title)}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-balance bg-gradient-to-r from-tq-primary-deep via-tq-primary to-tq-primary-bright bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
              {content.titleAccent}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-tq-muted sm:text-lg">{content.subtitle}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <AttributionLink href={trialHref} className={`${primaryButton} shadow-lg shadow-tq-primary/30`}>
                {content.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </AttributionLink>
              <DemoCallButton className={outlineButton} />
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-tq-muted">
              <Check className="h-4 w-4 text-tq-success" aria-hidden />
              No credit card required
            </p>
            <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-3">
              {content.proof.map((p) => (
                <li key={p.label} className="inline-flex items-center gap-2 rounded-full border border-tq-line bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                  <span className="font-bold text-tq-primary">{p.value}</span>
                  <span className="text-tq-muted">{p.label}</span>
                </li>
              ))}
            </ul>

            {/* Product visual: full width, tilted on desktop, faded out at the bottom. */}
            <div className="relative mx-auto mt-14 max-w-5xl sm:mt-16 lg:[perspective:2000px]">
              <div aria-hidden className="absolute inset-x-10 -top-6 bottom-10 rounded-[2rem] bg-gradient-to-b from-tq-primary/25 to-transparent blur-2xl" />
              <div className="relative max-h-[440px] overflow-hidden sm:max-h-none sm:overflow-visible lg:origin-top lg:[transform:rotateX(12deg)]">
                <ProductPreview data={preview} />
              </div>
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
              <HeroToast className="-left-8 top-1/4" icon={BellRing} {...preview.toasts[0]} />
              <HeroToast className="-right-8 bottom-16" icon={BadgeCheck} {...preview.toasts[1]} />
            </div>
          </Container>
        </section>

        {/* Problem */}
        <section className="bg-tq-wash py-16 sm:py-20" id="problem">
          <Container>
            <SectionTitle eyebrow="The revenue leak" title={`Why ${label} businesses outgrow spreadsheets and WhatsApp`} />
            <ol className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-6">
              {content.pains.map((pain, i) => {
                const Icon = PAIN_ICONS[pain.icon]
                return (
                  <li key={pain.title} className="relative flex flex-col overflow-hidden rounded-2xl border border-tq-line bg-white p-6">
                    <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tq-primary to-tq-primary-bright" aria-hidden />
                    <div className="flex items-center justify-between">
                      <span className="inline-flex rounded-xl bg-red-50 p-3 text-red-600">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="text-3xl font-bold text-tq-line" aria-hidden>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-tq-ink">{pain.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-tq-muted">{pain.body}</p>
                    <a href="#solution" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-tq-primary hover:underline">
                      See how we fix it
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </a>
                  </li>
                )
              })}
            </ol>
          </Container>
        </section>

        <FeatureShowcase
          pillars={content.pillars}
          data={preview}
          eyebrow={`How ${PLATFORM_BRAND} helps`}
          title="Everything you need, one workspace, no second login."
        />

        <HowItWorks label={label} bookLabel={preview.bookLabel} />

        <Testimonials items={testimonials} title={`What ${label} businesses say`} />

        {/* Pricing */}
        <section className="bg-tq-wash py-16 sm:py-20" id="pricing">
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
        <section className="py-16 sm:py-20" id="faq">
          <Container>
            <SectionTitle eyebrow="Questions, answered" title={`What ${label} operators ask before they switch`} />
            <Faq items={faqs} />
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

/** Floating notification beside the hero preview — desktop only, purely decorative. */
function HeroToast({ className, icon: Icon, title, body }: { className: string; icon: LucideIcon; title: string; body: string }) {
  return (
    <div
      aria-hidden
      className={`absolute hidden items-center gap-3 rounded-2xl text-left border border-tq-line bg-white/95 px-4 py-3 shadow-[0_18px_40px_-16px_rgba(14,49,145,0.45)] backdrop-blur lg:flex ${className}`}
    >
      <span className="inline-flex rounded-xl bg-tq-primary/10 p-2 text-tq-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-tq-ink">{title}</span>
        <span className="block text-xs text-tq-muted">{body}</span>
      </span>
    </div>
  )
}

function HowItWorks({ label, bookLabel }: { label: string; bookLabel: string }) {
  const steps = [
    { icon: Rocket, title: 'Create your workspace', body: `Sign up in a minute — your ${label} setup comes pre-configured.` },
    { icon: ListChecks, title: 'Add services and team', body: 'Import your price list, staff and customers, or let us do it for you.' },
    { icon: Share2, title: 'Share your link', body: `Customers tap “${bookLabel}” on your own site — you handle the rest from one console.` },
  ]
  return (
    <section className="border-y border-tq-line bg-tq-wash py-16 sm:py-20" id="how-it-works">
      <Container>
        <SectionTitle eyebrow="How it works" title="Live in an afternoon, not a quarter." />
        <ol className="relative mt-10 grid gap-8 sm:mt-12 md:grid-cols-3 md:gap-6">
          <span className="absolute left-[16.5%] right-[16.5%] top-6 hidden h-px bg-tq-primary/25 md:block" aria-hidden />
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tq-primary text-white shadow-lg shadow-tq-primary/25">
                <Icon className="h-5 w-5" aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-tq-primary ring-1 ring-tq-line">
                  {i + 1}
                </span>
              </span>
              <div>
                <h3 className="font-semibold text-tq-ink md:mt-4">{title}</h3>
                <p className="mt-1 text-sm text-tq-muted md:mt-2">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/**
 * Keeps "no-shows" / "phone-tag" on one line — the headline only wraps at spaces. Done in
 * CSS so crawlers and AI answers still read a plain hyphen.
 */
function noBreakHyphens(text: string): ReactNode {
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      {i ? ' ' : null}
      {word.includes('-') ? <span className="whitespace-nowrap">{word}</span> : word}
    </Fragment>
  ))
}
