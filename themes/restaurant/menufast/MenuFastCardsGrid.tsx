'use client'

import type { PublicMenuCategory, PublicMenuItem } from '@/lib/storefront-api'
import { formatListPrice, isVariantInStock } from '@/lib/productVariants'
import { formatMenuPrice, type CartMap } from './useMenuCart'
import { MenuFastCardsAddControl } from './MenuFastCardsAddControl'

function cartQtyForItem(cart: CartMap, itemId: string): number {
  return Object.keys(cart)
    .filter((k) => k === itemId || k.startsWith(`${itemId}:`))
    .reduce((sum, k) => sum + (cart[k] ?? 0), 0)
}

function MenuFastCard({
  item,
  qty,
  authReady,
  onSelect,
  onAdd,
  onRemove,
}: {
  item: PublicMenuItem
  qty: number
  authReady: boolean
  onSelect: () => void
  onAdd: () => void
  onRemove: () => void
}) {
  const hasImage = Boolean(item.imageUrl?.trim())
  const inStock = isVariantInStock(item)

  return (
    <article
      className={`mf-item-card${!inStock ? ' mf-item-card--unavail' : ''}${!hasImage ? ' mf-item-card--no-image' : ''}`}
    >
      {hasImage ? (
        <div className="mf-item-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" />
        </div>
      ) : null}
      <div className="mf-item-info">
        <button type="button" className="mf-item-card-main" onClick={onSelect}>
          <div className="mf-item-info-top">
            <h3 className="mf-item-card-name">{item.name}</h3>
            <div className="mf-item-card-price">
              {formatListPrice(item, (amount) => formatMenuPrice(amount, item.currency))}
            </div>
          </div>
          {item.description ? <p className="mf-item-card-desc">{item.description}</p> : null}
        </button>
        <MenuFastCardsAddControl
          item={item}
          qty={qty}
          authReady={authReady}
          onSelectOptions={onSelect}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </div>
    </article>
  )
}

export function MenuFastCardsGrid({
  categories,
  showCategoryTitles,
  cart,
  authReady,
  onSelectItem,
  onAddItem,
  onRemoveItem,
}: {
  categories: PublicMenuCategory[]
  showCategoryTitles: boolean
  cart: CartMap
  authReady: boolean
  onSelectItem: (itemId: string) => void
  onAddItem: (item: PublicMenuItem) => void
  onRemoveItem: (itemId: string) => void
}) {
  return (
    <>
      {categories.map((cat) => (
        <section key={cat.id} className="mf-cat-section" aria-label={cat.name}>
          {showCategoryTitles ? <h2 className="mf-cat-title">{cat.name}</h2> : null}
          <ul className="mf-item-list">
            {cat.items.map((item) => (
              <li key={item.id}>
                <MenuFastCard
                  item={item}
                  qty={cartQtyForItem(cart, item.id)}
                  authReady={authReady}
                  onSelect={() => onSelectItem(item.id)}
                  onAdd={() => onAddItem(item)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
