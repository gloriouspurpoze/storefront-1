import { loadMarketplaceTenant } from '@/themes/marketplace/loadThemeTenant'
import { MarketplaceCheckoutSuccessPage } from '@/themes/marketplace/MarketplaceCommercePages'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Order confirmed', robots: { index: false } }

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const tenant = await loadMarketplaceTenant()
  const { n } = await searchParams
  const checkoutNumber = (n ?? '').trim().slice(0, 40)
  return <MarketplaceCheckoutSuccessPage tenant={tenant} checkoutNumber={checkoutNumber} />
}
