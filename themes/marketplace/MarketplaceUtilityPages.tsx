import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ResolvedTenant } from '@/lib/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { STOREFRONT_ADDON_FLAGS, isAddonActive } from '@/lib/storefrontAddons'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { GiftMatchWidget } from '@/components/GiftMatchWidget'
import { ShippingPolicyPageContent } from '@/components/ShippingPolicyPageContent'
import { WishlistPageClient } from '@/components/wishlist/WishlistPageClient'
import './marketplace.css'

/** `/wishlist` — saved products (add-on). Items link to the PDP, where the buyer picks options. */
export async function MarketplaceWishlistPage({ tenant }: { tenant: ResolvedTenant }) {
  const config = await fetchStorefrontConfig(tenant.id)
  if (!isAddonActive(config, STOREFRONT_ADDON_FLAGS.wishlist)) notFound()
  return (
    <SiteChrome tenant={tenant} config={config}>
      <main className="sf-page-shell">
        <h1 className="sf-page-title">Your wishlist</h1>
        <div className="sf-page-body">
          <WishlistPageClient enabled />
        </div>
      </main>
    </SiteChrome>
  )
}

/** `/gifts` — AI gift match across every seller's catalog (platform-gated `giftMatch` flag). */
export async function MarketplaceGiftsPage({ tenant }: { tenant: ResolvedTenant }) {
  const config = await fetchStorefrontConfig(tenant.id)
  const flags = config?.featureFlags as Record<string, boolean | undefined> | undefined
  if (flags?.giftMatch !== true) notFound()
  return (
    <SiteChrome tenant={tenant} config={config}>
      <main className="sf-page-shell sf-page-shell--medium">
        <p className="sf-page-eyebrow">Gift match</p>
        <h1 className="sf-page-title">Gifts they&apos;ll love</h1>
        <p className="sf-page-lead">Answer a few quick questions and we&apos;ll suggest picks from independent sellers.</p>
        <div className="sf-page-body sf-page-body--tight">
          <GiftMatchWidget tenantId={tenant.id} />
        </div>
      </main>
    </SiteChrome>
  )
}

/**
 * `/shipping-policy` — marketplace-wide terms from Studio, framed for multi-seller delivery:
 * every seller ships their own parcel and states their own terms on their shop page.
 */
export async function MarketplaceShippingPolicyPage({ tenant }: { tenant: ResolvedTenant }) {
  const config = await fetchStorefrontConfig(tenant.id)
  const siteName = config?.branding?.siteName || tenant.name
  return (
    <SiteChrome tenant={tenant} config={config}>
      <div className="sf-container sf-container--narrow" style={{ paddingTop: '2rem' }}>
        <aside className="mk-sold-by" aria-label="How delivery works on the marketplace">
          <p className="mk-sold-by__label">Shipping on {siteName}</p>
          <p className="mk-sold-by__policies">
            Every order is fulfilled by an independent seller. If your cart has items from several sellers, they arrive
            as separate parcels, each with its own shipping charge and tracking number. Seller-specific shipping and
            return terms are shown on each product page and on the seller&apos;s{' '}
            <Link href="/sellers">shop page</Link>.
          </p>
        </aside>
      </div>
      <ShippingPolicyPageContent config={config} siteName={siteName} variant="retail" />
    </SiteChrome>
  )
}
