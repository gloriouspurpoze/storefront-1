import { assertRouteTenant } from '@/lib/load-tenant'
import { notFound } from 'next/navigation'
import { SellerStorePage, sellerStoreMetadata } from '@/themes/marketplace/SellerStorePage'
import { parseCatalogQuery } from '@/themes/marketplace/catalogQuery'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ tenantId: string; sellerSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Seller shop pages exist only on the marketplace vertical. */
async function marketplaceTenant(tenantId: string) {
  const tenant = await assertRouteTenant(tenantId)
  if (tenant.verticalKey !== 'marketplace') notFound()
  return tenant
}

export async function generateMetadata({ params }: PageProps) {
  const { tenantId, sellerSlug } = await params
  return sellerStoreMetadata(await marketplaceTenant(tenantId), sellerSlug)
}

export default async function Page({ params, searchParams }: PageProps) {
  const { tenantId, sellerSlug } = await params
  const tenant = await marketplaceTenant(tenantId)
  return <SellerStorePage tenant={tenant} sellerSlug={sellerSlug} query={parseCatalogQuery(await searchParams)} />
}
