import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { ComingSoon } from '@/themes/coming-soon/ComingSoon'
import { HomePageSections } from '@/components/HomePageSections'

export const dynamic = 'force-dynamic'

export default async function TenantHomePage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) notFound()

  const cfg = await fetchStorefrontConfig(tenant.id)

  switch (tenant.verticalKey) {
    case 'home_services':
    case 'restaurant':
    case 'retail':
      return <HomePageSections tenant={tenant} cfg={cfg} />
    default:
      return <ComingSoon tenant={tenant} />
  }
}
