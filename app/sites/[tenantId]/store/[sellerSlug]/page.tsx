import { fetchSellerStore } from '@/lib/runMarketplaceCheckout'
import { loadThemeTenant } from '@/themes/home-services/loadThemeTenant'
import Link from 'next/link'

export default async function SellerStorePage({
  params,
}: {
  params: Promise<{ tenantId: string; sellerSlug: string }>
}) {
  const { tenantId, sellerSlug } = await params
  const tenant = await loadThemeTenant(tenantId)
  const data = await fetchSellerStore({ tenantId, sellerSlug }).catch(() => null)

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p>Seller not found.</p>
        <Link href={`/sites/${tenantId}/search`} className="text-blue-600 hover:underline">
          Back to search
        </Link>
      </main>
    )
  }

  const seller = data.seller as { displayName?: string; slug?: string; rating?: number }
  const listings = (data.listings ?? []) as Array<{
    _id?: string
    title?: string
    listingType?: string
    priceInr?: number
  }>

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-gray-500">{tenant?.name}</p>
      <h1 className="text-2xl font-bold">{seller.displayName ?? sellerSlug}</h1>
      {seller.rating != null && seller.rating > 0 ? (
        <p className="text-sm text-gray-600">Rating {seller.rating.toFixed(1)}</p>
      ) : null}
      <h2 className="mt-6 text-lg font-semibold">Listings</h2>
      <ul className="mt-3 space-y-3">
        {listings.map((l) => (
          <li key={String(l._id)} className="rounded border p-3">
            <p className="font-medium">{l.title}</p>
            <p className="text-sm text-gray-600">
              {l.listingType} · ₹{(l.priceInr ?? 0).toLocaleString('en-IN')}
            </p>
          </li>
        ))}
      </ul>
      <Link href={`/sites/${tenantId}/search`} className="mt-6 inline-block text-blue-600 hover:underline">
        Search marketplace
      </Link>
    </main>
  )
}
