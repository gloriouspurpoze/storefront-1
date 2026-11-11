import { ArrowRight } from 'lucide-react'
import { launchOfferLive } from '@profixer/marketing-data'
import { PLATFORM_BRAND, signupUrl, siteUrl } from '@/platform/config'
import { HOME_FAQ, HOME_META_DESCRIPTION, HOME_TITLE } from '@/platform/content/home'
import { platformSiteContent } from '@/platform/siteContent'
import { HOME_ICONS } from '@/platform/components/icons'
import { pageMetadata } from '@/platform/seo'
import { pageFaqs, pageTestimonials, platformSeoOverride } from '@/platform/cms'
import { AttributionLink } from '@/platform/components/AttributionLink'
import { CtaBand } from '@/platform/components/CtaBand'
import { DemoCallButton } from '@/platform/components/DemoRequest'
import { Faq, faqJsonLd } from '@/platform/components/Faq'
import { Header } from '@/platform/components/Header'
import { JsonLd } from '@/platform/components/JsonLd'
import { OfferCountdown } from '@/platform/components/OfferCountdown'
import { PlanCards, plansJsonLd } from '@/platform/components/PlanCards'
import { ProductPreview } from '@/platform/components/ProductPreview'
import { Testimonials } from '@/platform/components/Testimonials'
import { Container, SectionTitle, outlineButton, primaryButton } from '@/platform/components/Section'

/** Static page, rebuilt hourly so the launch-offer pricing switches off on time. */
export const revalidate = 3600

export async function generateMetadata() {
  return pageMetadata({
    title: HOME_TITLE,
    absoluteTitle: true,
    description: HOME_META_DESCRIPTION,
    path: '/',
    ogTitle: 'Run your entire business from one workspace',
    eyebrow: 'Bookings · CRM · Storefront · Billing',
    override: await platformSeoOverride('/'),
  })
}

export default async function PlatformHomePage() {
  const [faqs, testimonials, site] = await Promise.all([pageFaqs('home', HOME_FAQ), pageTestimonials('home'), platformSiteContent()])
  const plans = site.plans('home_services').slice(0, 3)
  const { features, steps, trustPillars, guarantees } = site.home
  const offerLive = launchOfferLive(site.launchOffer)
  const trialHref = signupUrl()

  return (
    <>
      <JsonLd data={[plansJsonLd(plans, PLATFORM_BRAND, siteUrl('/pricing')), faqJsonLd(faqs)]} />
      <Header />
      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(41,110,249,0.16),transparent)]"
            aria-hidden
          />
          <Container className="relative pb-16 pt-16 text-center sm:pt-24">
            <AttributionLink
              href={trialHref}
              className="inline-flex items-center gap-2 rounded-full border border-tq-line bg-white px-3 py-1 text-xs font-medium text-tq-muted shadow-sm hover:text-tq-ink"
            >
              <span className="rounded-full bg-tq-primary px-2 py-0.5 text-[10px] font-semibold text-white">Free</span>
              14-day trial · No credit card required
              <ArrowRight className="h-3 w-3" aria-hidden />
            </AttributionLink>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Run your entire business from{' '}
              <span className="bg-gradient-to-r from-tq-primary-deep to-tq-primary-bright bg-clip-text text-transparent">one workspace</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-tq-muted">
              {PLATFORM_BRAND} brings bookings, orders, CRM, your online storefront, GST-ready billing and your team into one
              place — set up for your industry in minutes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <AttributionLink href={trialHref} className={primaryButton}>
                Start free trial
                <ArrowRight className="h-4 w-4" aria-hidden />
              </AttributionLink>
              <DemoCallButton className={outlineButton} />
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <ProductPreview />
            </div>
          </Container>
        </section>

        {/* Industries */}
        <section className="border-y border-tq-line bg-tq-wash py-10" id="industries">
          <Container>
            <h2 className="text-center text-sm font-medium text-tq-muted">Ready-made for your industry</h2>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {site.verticals.map((v) => (
                <li key={v.key}>
                  <a
                    href={`/${v.marketingSlug}`}
                    className="inline-block rounded-full border border-tq-line bg-white px-4 py-1.5 text-sm font-medium text-tq-ink hover:border-tq-primary/50 hover:text-tq-primary"
                  >
                    {v.label}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Features */}
        <section className="py-24" id="features">
          <Container>
            <SectionTitle
              eyebrow="Everything in one place"
              title="Replace five tools with one."
              subtitle="Stop juggling spreadsheets, WhatsApp and disconnected apps."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {features.map(({ icon, title, body }) => {
                const Icon = HOME_ICONS[icon]
                return (
                <div key={title} className="rounded-2xl border border-tq-line bg-white p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tq-primary/10 text-tq-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-tq-muted">{body}</p>
                </div>
                )
              })}
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section className="bg-tq-wash py-24">
          <Container>
            <SectionTitle eyebrow="Get started" title={stepsTitle(steps.length)} />
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-tq-line bg-white p-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tq-ink text-sm font-semibold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-tq-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Trust */}
        <section className="py-24" id="trust">
          <Container>
            <SectionTitle
              eyebrow={`Why businesses trust ${PLATFORM_BRAND}`}
              title="Built on trust."
              subtitle="You're putting your customers, payments and team on this. Here's what you can count on."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {trustPillars.map(({ icon, title, body }) => {
                const Icon = HOME_ICONS[icon]
                return (
                <div key={title} className="rounded-2xl border border-tq-line bg-white p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-tq-success">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-tq-muted">{body}</p>
                </div>
                )
              })}
            </div>
            <ul className="mt-6 grid gap-4 rounded-2xl bg-tq-ink p-6 text-white sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
              {guarantees.map(({ icon, title, body }) => {
                const Icon = HOME_ICONS[icon]
                return (
                <li key={title} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-tq-primary-bright" aria-hidden />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-white/70">{body}</p>
                  </div>
                </li>
                )
              })}
            </ul>
          </Container>
        </section>

        <Testimonials items={testimonials} />

        {/* Pricing */}
        <section className="bg-tq-wash py-24" id="pricing">
          <Container>
            <SectionTitle eyebrow="Pricing" title="Simple plans that grow with you." subtitle="Every plan starts with a 14-day free trial. Prices in INR." />
            {offerLive && site.launchOffer ? <OfferCountdown offer={site.launchOffer} /> : null}
            <PlanCards plans={plans} trialHref={trialHref} offerLive={offerLive} />
            <p className="mt-8 text-center text-sm text-tq-muted">
              Restaurants, salons and retail have their own plans —{' '}
              <a href="/pricing" className="font-medium text-tq-primary hover:underline">
                see all pricing
              </a>
              .
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-24" id="faq">
          <Container>
            <SectionTitle eyebrow="FAQ" title={`Questions about ${PLATFORM_BRAND}`} />
            <Faq items={faqs} />
          </Container>
        </section>

        <CtaBand trialHref={trialHref} />
      </main>
    </>
  )
}

const STEP_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six']

/** "Live in three steps." — follows however many steps admin lists. */
function stepsTitle(count: number): string {
  return STEP_WORDS[count] ? `Live in ${STEP_WORDS[count]} step${count === 1 ? '' : 's'}.` : 'Live in a few steps.'
}
