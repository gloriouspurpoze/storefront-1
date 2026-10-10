import Link from 'next/link'
import type { ResolvedTenant } from '@/lib/types'
import { fetchProducts, fetchStorefrontCategories, type StorefrontConfig } from '@/lib/storefront-api'
import { fetchStorefrontCmsChrome } from '@/lib/cms-content'
import { fetchSellers, listingCardFromProduct, searchMarketplace } from '@/lib/marketplace-api'
import { homepageSectionOrder, themeSectionDefaults } from '@/lib/storefrontSections'
import { CategoryTiles } from '@/components/sections/CategoryTiles'
import { FaqSection } from '@/components/sections/FaqSection'
import { Testimonials } from '@/components/sections/Testimonials'
import { IconSearch } from '@/ui'
import { MarketplaceShell } from './MarketplaceShell'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { ListingRail } from './ListingRail'
import { SellerCard } from './SellerCard'
import { toThemeTenant } from './types'
import './marketplace.css'

function flagOn(cfg: StorefrontConfig | null, key: string): boolean {
  const flags = cfg?.featureFlags as Record<string, boolean | undefined> | undefined
  if (cfg?.featureAddons?.[key]?.purchased) return true
  return flags?.[key] !== false
}

const BUYER_STEPS = [
  { title: 'Discover makers', text: 'Browse curated products from independent sellers, or search across the whole marketplace.' },
  { title: 'One secure checkout', text: 'Buy from several sellers in a single payment — we split the order for you.' },
  { title: 'Shipped by the seller', text: 'Each seller packs and ships their part. Track every parcel from your account.' },
]

/**
 * Marketplace homepage (`marketplace-classic` + classic fallback). Block order and on/off come
 * from the API's `effectiveSections` (Studio), resolved against the theme's designed order.
 */
export async function MarketplaceHome({ tenant, cfg, addonsSlot }: { tenant: ResolvedTenant; cfg: StorefrontConfig | null; addonsSlot?: React.ReactNode }) {
  const tagline = cfg?.branding?.tagline || cfg?.content?.heroSubcopy || 'Independent makers, one marketplace.'
  const themeTenant = toThemeTenant(tenant, tagline)
  const order = homepageSectionOrder(cfg, themeSectionDefaults(cfg?.themeKey, 'marketplace'))
  const on = (t: string) => order.includes(t)

  const [categories, products, featured, newest, chrome] = await Promise.all([
    fetchStorefrontCategories(tenant.id),
    on('categories') || on('products') ? fetchProducts(tenant.id, 48) : Promise.resolve([]),
    on('featuredSellers') || on('hero') ? fetchSellers(tenant.id, { featured: true, limit: 8 }) : null,
    on('newArrivals') ? searchMarketplace(tenant.id, { sort: 'newest', limit: 8 }) : null,
    fetchStorefrontCmsChrome(tenant.id, 'marketplace'),
  ])
  // No sellers marked featured yet → show the top-rated ones instead of an empty rail.
  const sellers =
    featured && featured.sellers.length > 0
      ? featured
      : on('featuredSellers')
        ? await fetchSellers(tenant.id, { limit: 8 })
        : featured
  const picks = products
    .map(listingCardFromProduct)
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .slice(0, 8)
  const { headerNavLinks, footerNavLinks, faqs, testimonials } = chrome
  const sortedCats = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const faqItems = faqs.length ? faqs : (cfg?.content?.faqItems ?? [])

  const blocks: Record<string, React.ReactNode> = {
    hero: flagOn(cfg, 'showHero') ? (
      <section className="mk-hero">
        <div className="sf-container mk-hero__inner">
          <p className="sf-eyebrow">{tenant.name}</p>
          <h1 className="mk-hero__title">{cfg?.content?.heroHeadline || 'Find something made with care.'}</h1>
          <p className="mk-hero__subtitle">{tagline}</p>
          <form action="/search" role="search" className="mk-hero__search">
            <input type="search" name="q" placeholder="Search products, gifts and sellers…" aria-label="Search the marketplace" />
            <button type="submit" className="sf-btn sf-btn--pill">
              <IconSearch size={18} />
              <span>Search</span>
            </button>
          </form>
          {sortedCats.length > 0 ? (
            <nav className="mk-hero__chips" aria-label="Popular categories">
              {sortedCats.slice(0, 6).map((c) => (
                <Link key={c.slug} href={`/categories/${c.slug}`}>
                  {c.name}
                </Link>
              ))}
            </nav>
          ) : null}
          {sellers && sellers.pagination.total > 1 ? (
            <p className="mk-hero__stats">
              <span>
                <strong>{sellers.pagination.total.toLocaleString('en-IN')}</strong> independent sellers
              </span>
              <span>One secure checkout</span>
            </p>
          ) : null}
        </div>
      </section>
    ) : null,
    categories: <CategoryTiles categories={categories} products={products} />,
    featuredSellers:
      sellers && sellers.sellers.length > 0 ? (
        <section className="sf-section sf-container">
          <div className="sf-section-head">
            <div>
              <p className="sf-eyebrow">Meet the makers</p>
              <h2 className="sf-heading">Featured sellers</h2>
            </div>
            <Link href="/sellers" className="sf-btn sf-btn--link">
              All sellers
            </Link>
          </div>
          <ul className="mk-seller-grid">
            {sellers.sellers.slice(0, 8).map((s) => (
              <li key={s.id}>
                <SellerCard seller={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null,
    products: flagOn(cfg, 'showProducts') ? (
      <ListingRail eyebrow="Curated" title="Popular right now" listings={picks} viewAllHref="/products" />
    ) : null,
    newArrivals: newest ? (
      <ListingRail eyebrow="Just listed" title="New arrivals" listings={newest.listings} viewAllHref="/products?sort=newest" />
    ) : null,
    howItWorks: (
      <section className="sf-section sf-container">
        <div className="sf-section-head">
          <h2 className="sf-heading">How {tenant.name} works</h2>
        </div>
        <ol className="mk-steps">
          {BUYER_STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    ),
    sellCta: (
      <section className="sf-section sf-container">
        <div className="mk-sell-cta">
          <div>
            <h2>Sell on {tenant.name}</h2>
            <p>Open your shop, reach new buyers, and get paid out automatically.</p>
          </div>
          <Link href="/sell" className="sf-btn sf-btn--lg sf-btn--pill">
            Start selling
          </Link>
        </div>
      </section>
    ),
    trust:
      flagOn(cfg, 'showTestimonials') && testimonials.length > 0 ? (
        <Testimonials testimonials={testimonials} title="What buyers say" />
      ) : null,
    faq: flagOn(cfg, 'showFaq') && faqItems.length > 0 ? <FaqSection items={faqItems} /> : null,
  }

  return (
    <MarketplaceShell tenantId={tenant.id}>
      <SiteHeader tenant={themeTenant} config={cfg} navLinks={headerNavLinks} categories={categories} />
      <main>
        {order.map((t) => (blocks[t] ? <div key={t}>{blocks[t]}</div> : null))}
        {addonsSlot}
      </main>
      <SiteFooter tenant={themeTenant} navLinks={footerNavLinks} config={cfg} />
    </MarketplaceShell>
  )
}
