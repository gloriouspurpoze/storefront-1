import type { ResolvedTenant } from '@/lib/types'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { PageHeader } from '@/ui'
import { MarketplaceCartClient } from './MarketplaceCartClient'
import { MarketplaceCheckoutClient } from './MarketplaceCheckoutClient'
import { CheckoutSuccessClient } from './CheckoutSuccessClient'
import { toThemeTenant } from './types'

export async function MarketplaceCartPage({ tenant }: { tenant: ResolvedTenant }) {
  const config = await fetchStorefrontConfig(tenant.id)
  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <PageHeader title="Your cart" crumbs={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <div className="sf-container">
          <MarketplaceCartClient tenantId={tenant.id} />
        </div>
      </main>
    </SiteChrome>
  )
}

export async function MarketplaceCheckoutPage({ tenant }: { tenant: ResolvedTenant }) {
  const config = await fetchStorefrontConfig(tenant.id)
  const tagline = config?.branding?.tagline || ''
  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <PageHeader title="Checkout" crumbs={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
        <div className="sf-container">
          <MarketplaceCheckoutClient tenant={toThemeTenant(tenant, tagline)} />
        </div>
      </main>
    </SiteChrome>
  )
}

export async function MarketplaceCheckoutSuccessPage({ tenant, checkoutNumber }: { tenant: ResolvedTenant; checkoutNumber: string }) {
  const config = await fetchStorefrontConfig(tenant.id)
  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <CheckoutSuccessClient tenantId={tenant.id} checkoutNumber={checkoutNumber} />
      </main>
    </SiteChrome>
  )
}
