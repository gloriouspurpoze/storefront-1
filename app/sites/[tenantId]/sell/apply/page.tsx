import type { Metadata } from 'next'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { SiteChrome } from '@/components/chrome/SiteChrome'
import { PageHeader } from '@/ui'
import { loadMarketplaceTenant } from '@/themes/marketplace/loadThemeTenant'
import { SellerApplyForm } from '@/themes/marketplace/SellerApplyForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await loadMarketplaceTenant()
  return { title: `Apply to sell | ${tenant.name}`, robots: { index: false } }
}

export default async function SellApplyPage() {
  const tenant = await loadMarketplaceTenant()
  const config = await fetchStorefrontConfig(tenant.id)
  const siteName = config?.branding?.siteName || tenant.name
  return (
    <SiteChrome tenant={tenant} config={config}>
      <main>
        <PageHeader
          title="Apply to sell"
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Sell', href: '/sell' }, { label: 'Apply' }]}
        >
          <p className="sf-page-head__sub">Tell us about your shop. It takes about five minutes.</p>
        </PageHeader>
        <div className="sf-container sf-container--narrow" style={{ paddingBottom: 'var(--sf-section-y)' }}>
          <SellerApplyForm tenantId={tenant.id} siteName={siteName} />
        </div>
      </main>
    </SiteChrome>
  )
}
