import type { Metadata } from 'next'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadMarketplaceTenant } from '@/themes/marketplace/loadThemeTenant'
import { SellLandingPage } from '@/themes/marketplace/SellLandingPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await loadMarketplaceTenant()
  const cfg = await fetchStorefrontConfig(tenant.id)
  const siteName = cfg?.branding?.siteName || tenant.name
  return {
    title: `Sell on ${siteName}`,
    description: `Open a shop on ${siteName}: reach new buyers, get paid automatically.`,
    alternates: { canonical: '/sell' },
  }
}

export default async function SellPage() {
  const tenant = await loadMarketplaceTenant()
  return <SellLandingPage tenant={tenant} />
}
