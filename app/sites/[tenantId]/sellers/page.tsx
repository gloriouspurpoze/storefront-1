import type { Metadata } from 'next'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { loadMarketplaceTenant } from '@/themes/marketplace/loadThemeTenant'
import { SellersDirectoryPage } from '@/themes/marketplace/SellersDirectoryPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await loadMarketplaceTenant()
  const cfg = await fetchStorefrontConfig(tenant.id)
  const siteName = cfg?.branding?.siteName || tenant.name
  return {
    title: `Sellers | ${siteName}`,
    description: `Browse the independent sellers and makers on ${siteName}.`,
    alternates: { canonical: '/sellers' },
  }
}

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const tenant = await loadMarketplaceTenant()
  const sp = await searchParams
  const page = Number(sp.page)
  return (
    <SellersDirectoryPage
      tenant={tenant}
      q={sp.q?.trim().slice(0, 80) || undefined}
      page={Number.isFinite(page) && page > 0 ? Math.floor(page) : undefined}
    />
  )
}
