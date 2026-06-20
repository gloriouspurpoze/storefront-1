import type { PublicMenuCategory } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'
import { MenuAddToCartButton } from './MenuAddToCartButton'

export function MenuSection({
  categories,
  compact = false,
}: {
  categories: PublicMenuCategory[]
  compact?: boolean
}) {
  if (!categories.length) {
    return (
      <p className="text-center text-stone-500">Our menu is being updated. Check back soon.</p>
    )
  }

  return (
    <div className={compact ? 'space-y-10' : 'space-y-14'}>
      {categories.map((cat) => (
        <section key={cat.id} id={cat.id}>
          <h2 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">{cat.name}</h2>
          <ul className="mt-6 divide-y divide-amber-100/80">
            {cat.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-stone-900">{item.name}</h3>
                    {!isMenuItemInStock(item) ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Out of stock
                      </span>
                    ) : null}
                    {item.dietary?.map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-sm text-stone-500">{item.description}</p>
                  ) : null}
                </div>
                <MenuAddToCartButton item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
