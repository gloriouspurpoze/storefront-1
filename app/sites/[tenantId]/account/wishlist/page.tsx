import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { STOREFRONT_ADDON_FLAGS, isAddonActive } from '@/lib/storefrontAddons'
import { AccountPageHeader } from '@/components/account/AccountPageHeader'
import { WishlistPageClient } from '@/components/wishlist/WishlistPageClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return { title: 'Wishlist', description: tenant ? `Products you saved at ${tenant.name}` : 'Saved products' }
}

/** Account-dashboard view of the Wishlist add-on (same list as `/wishlist`). */
export default async function AccountWishlistPage() {
  const tenant = await loadTenantFromRequest()
  if (!tenant) notFound()
  const config = await fetchStorefrontConfig(tenant.id)
  if (!isAddonActive(config, STOREFRONT_ADDON_FLAGS.wishlist)) notFound()

  return (
    <>
      <AccountPageHeader title="Wishlist" subtitle="Products you saved for later." />
      <WishlistPageClient enabled loginReturnTo="/account/wishlist" />
    </>
  )
}
