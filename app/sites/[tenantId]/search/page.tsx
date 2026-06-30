import { searchMarketplace } from '@/lib/runMarketplaceCheckout'
import { loadThemeTenant } from '@/themes/home-services/loadThemeTenant'
import Link from 'next/link'

export default async function MarketplaceSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<{ q?: string; types?: string }>
}) {
  const { tenantId } = await params
  const sp = await searchParams
  const tenant = await loadThemeTenant(tenantId)
  const data = await searchMarketplace({
    tenantId,
    q: sp.q,
    types: sp.types,
  }).catch(() => ({ listings: [] as Array<Record<string, unknown>> }))

  const listings = (data.listings ?? []) as Array<{
    _id?: string
    title?: string
    slug?: string
    listingType?: string
    priceInr?: number
    sellerId?: { displayName?: string; slug?: string }
  }>

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Search {tenant?.name ?? 'marketplace'}</h1>
      <form className="mt-4 flex gap-2" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="Search products, services, bazaar…"
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Search
        </button>
      </form>
      <ul className="mt-6 space-y-4">
        {listings.length === 0 ? (
          <li className="text-muted-foreground">No results.</li>
        ) : (
          listings.map((l) => (
            <li key={String(l._id)} className="rounded border p-4">
              <p className="font-medium">{l.title}</p>
              <p className="text-sm text-gray-600">
                {l.listingType} · ₹{(l.priceInr ?? 0).toLocaleString('en-IN')}
                {l.sellerId && typeof l.sellerId === 'object' && l.sellerId.slug ? (
                  <>
                    {' · '}
                    <Link
                      href={`/sites/${tenantId}/store/${l.sellerId.slug}`}
                      className="text-blue-600 hover:underline"
                    >
                      {l.sellerId.displayName}
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))
        )}
      </ul>
    </main>
  )
}
