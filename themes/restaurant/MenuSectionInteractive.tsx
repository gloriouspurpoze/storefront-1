'use client'

import { useState } from 'react'
import type { PublicMenuCategory } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'
import { MenuItemDetailModal } from '@/components/MenuItemDetailModal'
import { MenuAddToCartButton } from './MenuAddToCartButton'
import { useCart } from './cart'

export function MenuSectionInteractive({
  categories,
  compact = false,
}: {
  categories: PublicMenuCategory[]
  compact?: boolean
}) {
  const { lines, addMenuItem, setQuantity } = useCart()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem =
    selectedId != null
      ? categories.flatMap((c) => c.items).find((item) => item.id === selectedId) ?? null
      : null

  const qtyFor = (id: string) => lines.find((l) => l.productId === id)?.quantity ?? 0

  if (!categories.length) {
    return (
      <p className="text-center text-stone-500">Our menu is being updated. Check back soon.</p>
    )
  }

  return (
    <>
      <MenuItemDetailModal
        item={selectedItem}
        open={selectedItem != null}
        onClose={() => setSelectedId(null)}
        quantity={selectedItem ? qtyFor(selectedItem.id) : 0}
        onAdd={() => {
          if (selectedItem) addMenuItem(selectedItem)
        }}
        onRemove={() => {
          if (selectedItem) setQuantity(selectedItem.id, qtyFor(selectedItem.id) - 1)
        }}
      />
      <div className={compact ? 'space-y-10' : 'space-y-14'}>
        {categories.map((cat) => (
          <section key={cat.id} id={cat.id}>
            <h2 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">{cat.name}</h2>
            <ul className="mt-6 divide-y divide-amber-100/80">
              {cat.items.map((item) => (
                <li
                  key={item.id}
                  className="flex cursor-pointer flex-col gap-2 py-5 sm:flex-row sm:items-start sm:justify-between"
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(item.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
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
                      <p className="mt-1 line-clamp-2 text-sm text-stone-500">{item.description}</p>
                    ) : null}
                  </div>
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <MenuAddToCartButton item={item} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
