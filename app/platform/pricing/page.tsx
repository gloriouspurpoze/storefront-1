import { launchOfferLive, marketingPlansForVertical, type MarketingVertical, type VerticalKey } from '@profixer/marketing-data'
import { PLATFORM_BRAND, signupUrl, siteUrl } from '@/platform/config'
import { platformSiteContent } from '@/platform/siteContent'
import { pageMetadata } from '@/platform/seo'
import { pageFaqs, platformSeoOverride } from '@/platform/cms'
import { CtaBand } from '@/platform/components/CtaBand'
import { Faq, faqJsonLd } from '@/platform/components/Faq'
import { Header } from '@/platform/components/Header'
import { JsonLd } from '@/platform/components/JsonLd'
import { OfferCountdown } from '@/platform/components/OfferCountdown'
import { PlanCards, plansJsonLd } from '@/platform/components/PlanCards'
import { Container, SectionTitle } from '@/platform/components/Section'

export const revalidate = 3600

export async function generateMetadata() {
  return pageMetadata({
    title: 'Pricing — plans in INR with a 14-day free trial',
    description: `${PLATFORM_BRAND} pricing for home services, restaurants, salons, retail and more. Simple monthly plans in INR, every plan with a 14-day free trial and no credit card.`,
    path: '/pricing',
    ogTitle: 'Simple plans that grow with you',
    eyebrow: `${PLATFORM_BRAND} pricing · INR`,
    override: await platformSeoOverride('/pricing'),
  })
}

/** Industries with their own plan set; every other industry uses the home-services plans. */
const PLAN_GROUPS: { key: VerticalKey; title: string; note: string }[] = [
  { key: 'home_services', title: 'Services businesses', note: '' },
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

export default async function PricingPage() {
  const [faqs, site] = await Promise.all([pageFaqs('pricing', PRICING_FAQ), platformSiteContent()])
  const offerLive = launchOfferLive(site.launchOffer)
  // A group shows only while one of its industries is visible and it still has a plan.
  const groups = PLAN_GROUPS.map((g) => ({ ...g, members: groupMembers(g.key, site.verticals), plans: site.plans(g.key) })).filter(
    (g) => g.members.length && g.plans.length,
  )
  return (
    <>
      <JsonLd
        data={[
          ...groups.map((g) => plansJsonLd(g.plans, `${PLATFORM_BRAND} — ${g.title}`, siteUrl('/pricing'))),
          faqJsonLd(faqs),
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
            {offerLive && site.launchOffer ? <OfferCountdown offer={site.launchOffer} /> : null}
          </Container>
        </section>
        {groups.map((group) => {
          const verticalLabel = site.isVisible(group.key) ? site.vertical(group.key).label : group.title
          const note = group.note || listLabels(group.members)
          return (
            <section key={group.key} className="py-14" id={group.key}>
              <Container>
                <div className="mx-auto max-w-5xl">
                  <h2 className="text-2xl font-semibold tracking-tight">{group.title}</h2>
                  <p className="mt-1 text-sm text-tq-muted">{note}</p>
                </div>
                <PlanCards
                  plans={group.plans}
                  trialHref={signupUrl(group.key)}
                  offerLive={offerLive}
                  ctaLabel={`Start free trial — ${verticalLabel}`}
                />
              </Container>
            </section>
          )
        })}
        <section className="bg-tq-wash py-20">
          <Container>
            <SectionTitle eyebrow="FAQ" title="Pricing questions" />
            <Faq items={faqs} />
          </Container>
        </section>
        <CtaBand trialHref={signupUrl()} />
      </main>
    </>
  )
}

/** Visible industries that sell the same plan set as `key` (e.g. fitness → home-services plans). */
function groupMembers(key: VerticalKey, visible: readonly MarketingVertical[]): MarketingVertical[] {
  const planKey = marketingPlansForVertical(key)[0]?.key
  return visible.filter((v) => marketingPlansForVertical(v.key)[0]?.key === planKey)
}

/** "Home Services, Fitness & gyms and Healthcare". */
function listLabels(verticals: readonly MarketingVertical[]): string {
  const labels = verticals.map((v) => v.label)
  return labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}` : (labels[0] ?? '')
}
