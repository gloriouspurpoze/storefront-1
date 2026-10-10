import Link from 'next/link'
import type { ResolvedTenant } from '@/lib/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { fetchSellers } from '@/lib/marketplace-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { FaqSection } from '@/components/sections/FaqSection'
import { ButtonLink } from '@/ui'
import { SellerCard } from './SellerCard'
import './marketplace.css'

const STEPS = [
  { title: 'Apply in minutes', text: 'Tell us about your shop and what you make. No fees to apply.' },
  { title: 'Get approved', text: 'Our team reviews every application to keep quality high — usually within a few days.' },
  { title: 'List your products', text: 'Add photos, prices and stock from your seller portal. We handle the storefront.' },
  { title: 'Ship and get paid', text: 'Orders land in your portal. Ship them, and payouts arrive on a regular schedule.' },
]

const BENEFITS = [
  { title: 'Your own shop page', text: 'A branded store with your logo, story, policies and every product you sell.' },
  { title: 'Buyers already here', text: 'Reach shoppers who come to the marketplace to discover independent makers.' },
  { title: 'Payments handled', text: 'Buyers pay once at checkout; your share is tracked in a ledger and paid out to you.' },
  { title: 'Simple tools', text: 'Manage listings, stock, orders and earnings from one seller portal.' },
]

/** `/sell` — seller acquisition landing page. */
export async function SellLandingPage({ tenant }: { tenant: ResolvedTenant }) {
  const [config, sellers] = await Promise.all([fetchStorefrontConfig(tenant.id), fetchSellers(tenant.id, { featured: true, limit: 4 })])
  const siteName = config?.branding?.siteName || tenant.name

  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <section className="mk-hero">
          <div className="sf-container mk-hero__inner">
            <p className="sf-eyebrow">Sell on {siteName}</p>
            <h1 className="mk-hero__title">Turn your craft into a business.</h1>
            <p className="mk-hero__subtitle">
              Open a shop on {siteName}, reach new buyers, and let us handle checkout and payments.
            </p>
            <div className="mk-success__actions" style={{ justifyContent: 'flex-start' }}>
              <ButtonLink href="/sell/apply" size="lg" pill>
                Apply to sell
              </ButtonLink>
              <ButtonLink href="/sellers" size="lg" pill variant="secondary">
                See who sells here
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="sf-section sf-container">
          <div className="sf-section-head">
            <h2 className="sf-heading">Why sell with us</h2>
          </div>
          <ul className="mk-benefits">
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sf-section sf-container">
          <div className="sf-section-head">
            <h2 className="sf-heading">How it works</h2>
          </div>
          <ol className="mk-steps">
            {STEPS.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {sellers.sellers.length > 0 ? (
          <section className="sf-section sf-container">
            <div className="sf-section-head">
              <h2 className="sf-heading">Join sellers like</h2>
              <Link href="/sellers" className="sf-btn sf-btn--link">
                All sellers
              </Link>
            </div>
            <ul className="mk-seller-grid">
              {sellers.sellers.map((s) => (
                <li key={s.id}>
                  <SellerCard seller={s} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <FaqSection
          title="Selling FAQ"
          items={[
            { question: 'Does it cost anything to apply?', answer: 'No. Applying is free. A commission is deducted only when you make a sale.' },
            {
              question: 'How do I get paid?',
              answer: 'Each sale is recorded in your seller ledger net of commission and shipping. Payouts are released in regular batches to your registered account.',
            },
            {
              question: 'Who ships the orders?',
              answer: 'You do. Each order you receive is your own parcel — pack it, ship it, and add the tracking number in your seller portal.',
            },
            { question: 'Do I need a GST number?', answer: 'Not to apply. Add it later in your seller profile if you have one.' },
          ]}
        />

        <section className="sf-section sf-container">
          <div className="mk-sell-cta">
            <div>
              <h2>Ready to open your shop?</h2>
              <p>It takes about five minutes to apply.</p>
            </div>
            <Link href="/sell/apply" className="sf-btn sf-btn--lg sf-btn--pill">
              Apply to sell
            </Link>
          </div>
        </section>
      </main>
    </SiteChrome>
  )
}
