import { MARKETING_VERTICALS, marketingPlansForVertical, type VerticalKey } from '@profixer/marketing-data'
import { PLATFORM_BRAND, signupUrl, siteUrl } from '@/platform/config'
import { launchOfferLive } from '@/platform/content/offer'
import { pageMetadata } from '@/platform/seo'
import { CtaBand } from '@/platform/components/CtaBand'
import { Faq, faqJsonLd } from '@/platform/components/Faq'
import { Header } from '@/platform/components/Header'
import { JsonLd } from '@/platform/components/JsonLd'
import { OfferCountdown } from '@/platform/components/OfferCountdown'
import { PlanCards, plansJsonLd } from '@/platform/components/PlanCards'
import { Container, SectionTitle } from '@/platform/components/Section'

export const revalidate = 3600

export const metadata = pageMetadata({
  title: 'Pricing — plans in INR with a 14-day free trial',
  description: `${PLATFORM_BRAND} pricing for home services, restaurants, salons, retail and more. Simple monthly plans in INR, every plan with a 14-day free trial and no credit card.`,
  path: '/pricing',
  ogTitle: 'Simple plans that grow with you',
  eyebrow: `${PLATFORM_BRAND} pricing · INR`,
})

/** Industries with their own plan set; every other industry uses the home-services plans. */
const PLAN_GROUPS: { key: VerticalKey; title: string; note: string }[] = [
  { key: 'home_services', title: 'Services businesses', note: 'Home services, fitness, real estate, B2B services, healthcare and education' },
  { key: 'restaurant', title: 'Restaurants', note: 'Menu, orders, reservations and kitchen operations' },
  { key: 'salon', title: 'Salons & spas', note: 'Appointments, stylists, treatments and retail' },
  { key: 'retail', title: 'Retail & e-commerce', note: 'Products, orders and your online store' },
]

const PRICING_FAQ = [
  { q: 'Is there a free trial?', a: 'Yes. Every plan starts with a 14-day free trial with every feature unlocked, and no credit card is needed.' },
  { q: 'What currency are prices in?', a: 'All prices are monthly, in Indian rupees (INR).' },
  { q: 'Can I change plans later?', a: 'Yes. You can upgrade or change plans at any time as your team and bookings grow.' },
  {
    q: `Does ${PLATFORM_BRAND} take a commission on my bookings or orders?`,
    a: `No. ${PLATFORM_BRAND} is a subscription. Bookings and orders taken on your storefront are yours, with no per-order commission.`,
  },
]

export default function PricingPage() {
  const offerLive = launchOfferLive()
  return (
    <>
      <JsonLd
        data={[
          ...PLAN_GROUPS.map((g) => plansJsonLd(marketingPlansForVertical(g.key), `${PLATFORM_BRAND} — ${g.title}`, siteUrl('/pricing'))),
          faqJsonLd(PRICING_FAQ),
        ]}
      />
      <Header />
      <main>
        <section className="bg-tq-wash pb-8 pt-16 sm:pt-24">
          <Container>
            <SectionTitle
              as="h1"
              eyebrow="Pricing"
              title="Simple plans that grow with you."
              subtitle="Pick the plans for your industry. Every plan starts with a 14-day free trial. Prices in INR, billed monthly."
            />
            {offerLive ? <OfferCountdown /> : null}
          </Container>
        </section>
        {PLAN_GROUPS.map((group) => {
          const verticalLabel = MARKETING_VERTICALS.find((v) => v.key === group.key)?.label ?? group.title
          return (
            <section key={group.key} className="py-14" id={group.key}>
              <Container>
                <div className="mx-auto max-w-5xl">
                  <h2 className="text-2xl font-semibold tracking-tight">{group.title}</h2>
                  <p className="mt-1 text-sm text-tq-muted">{group.note}</p>
                </div>
                <PlanCards
                  plans={marketingPlansForVertical(group.key)}
                  trialHref={signupUrl(group.key)}
                  ctaLabel={`Start free trial — ${verticalLabel}`}
                />
              </Container>
            </section>
          )
        })}
        <section className="bg-tq-wash py-20">
          <Container>
            <SectionTitle eyebrow="FAQ" title="Pricing questions" />
            <Faq items={PRICING_FAQ} />
          </Container>
        </section>
        <CtaBand trialHref={signupUrl()} />
      </main>
    </>
  )
}
