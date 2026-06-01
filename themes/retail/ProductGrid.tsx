import Link from 'next/link'
import type { PublicProduct } from '@/lib/storefront-api'
import { formatMoney } from './cart'

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  if (!products.length) {
    return (
      <p className="py-16 text-center text-slate-500">
        Our catalog is being updated. Please check back soon.
      </p>
    )
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <li key={p.id}>
          <Link
            href={`/products/${p.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="aspect-[4/5] bg-slate-100">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-300">
                  {p.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-medium text-slate-900 group-hover:text-indigo-700">{p.name}</h3>
              {p.shortDescription ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.shortDescription}</p>
              ) : null}
              <div className="mt-auto flex items-baseline gap-2 pt-3">
                <span className="font-semibold text-slate-900">
                  {formatMoney(p.price, p.currency)}
                </span>
                {p.originalPrice && p.originalPrice > p.price ? (
                  <span className="text-sm text-slate-400 line-through">
                    {formatMoney(p.originalPrice, p.currency)}
                  </span>
                ) : null}
              </div>
              {!p.inStock ? (
                <span className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-700">
                  Out of stock
                </span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
