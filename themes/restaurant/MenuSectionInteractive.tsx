'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicMenuCategory, PublicMenuItem } from '@/lib/storefront-api'
import { isMenuItemInStock } from '@/lib/storefront-api'
import { formatMoney } from '@/lib/format'
import { productHasVariants } from '@/lib/productVariants'
import { MenuItemDetailModal } from '@/components/MenuItemDetailModal'
import { openCartDrawer } from '@/components/commerce/cartDrawerBus'
import { useCartAuthGate } from '@/lib/useCartAuthGate'
import { Badge, IconBag, IconPlus, QuantityStepper, cx } from '@/ui'
import { useCart } from './cart'
import '@/components/commerce/menu-board.css'

/** Veg / non-veg marker from free-form dietary tags (Indian menu convention). */
function dietMark(item: PublicMenuItem): 'veg' | 'nonveg' | null {
  const tags = (item.dietary ?? []).map((d) => d.toLowerCase().replace(/[\s_-]+/g, ''))
  if (tags.some((t) => t === 'nonveg' || t === 'nonvegetarian' || t === 'egg')) return 'nonveg'
  if (tags.some((t) => t === 'veg' || t === 'vegetarian' || t === 'vegan' || t === 'jain')) return 'veg'
  return null
}

/**
 * Restaurant menu board: sticky category tabs with scroll-spy, dish cards with
 * inline quantity steppers (variant dishes open the detail modal), and a
 * floating "View cart" bar on mobile that opens the shared cart drawer.
 */
export function MenuSectionInteractive({
  categories,
  compact = false,
}: {
  categories: PublicMenuCategory[]
  compact?: boolean
}) {
  const { lines, addItem, setQuantity, itemCount, subtotal } = useCart()
  const { requireAuthForCart } = useCartAuthGate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<string | null>(categories[0]?.id ?? null)
  const tabsRef = useRef<HTMLDivElement | null>(null)

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories])
  const selectedItem = selectedId != null ? allItems.find((item) => item.id === selectedId) ?? null : null

  const qtyFor = (id: string, variantId?: string) =>
    lines.filter((l) => l.productId === id && (variantId === undefined || l.variantId === variantId)).reduce((n, l) => n + l.quantity, 0)

  // Scroll-spy: highlight the category nearest the top of the viewport.
  useEffect(() => {
    if (compact || typeof IntersectionObserver === 'undefined') return
    const sections = categories.map((c) => document.getElementById(`menu-${c.id}`)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveCat(visible[0].target.id.replace(/^menu-/, ''))
      },
      { rootMargin: '-140px 0px -60% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [categories, compact])

  // Keep the active tab visible in the scrolling tab bar.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${activeCat}"]`)
    tab?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeCat])

  if (!categories.length) {
    return <p className="sf-product-empty">Our menu is being updated. Check back soon.</p>
  }

  function add(item: PublicMenuItem) {
    if (!requireAuthForCart()) return
    addItem(item, 1)
  }

  const currency = lines[0]?.currency ?? allItems[0]?.currency ?? 'INR'

  return (
    <>
      <MenuItemDetailModal
        item={selectedItem}
        open={selectedItem != null}
        onClose={() => setSelectedId(null)}
        getQuantity={(variantId) => (selectedItem ? qtyFor(selectedItem.id, variantId) : 0)}
        onAdd={(variantId) => {
          if (selectedItem && requireAuthForCart()) addItem(selectedItem, 1, variantId)
        }}
        onRemove={(variantId) => {
          if (selectedItem) setQuantity(selectedItem.id, qtyFor(selectedItem.id, variantId) - 1, variantId)
        }}
      />

      {!compact && categories.length > 1 && (
        <nav className="sf-menu-tabs" aria-label="Menu categories">
          <div ref={tabsRef} className="sf-tabs">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#menu-${c.id}`}
                data-cat={c.id}
                className="sf-tab"
                aria-current={activeCat === c.id ? 'true' : undefined}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name}
                <span className="sf-menu-tabs__count">{c.items.length}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className={cx('sf-menu', compact && 'sf-menu--compact')}>
        {categories.map((cat) => (
          <section key={cat.id} id={`menu-${cat.id}`} className="sf-menu__section" aria-labelledby={`menu-h-${cat.id}`}>
            <h2 id={`menu-h-${cat.id}`} className="sf-menu__heading">
              {cat.name}
            </h2>
            <ul className="sf-dish-grid">
              {cat.items.map((item) => {
                const inStock = isMenuItemInStock(item)
                const hasVariants = productHasVariants(item)
                const qty = qtyFor(item.id)
                const mark = dietMark(item)
                const otherTags = (item.dietary ?? []).filter((d) => !/^(non[\s_-]?)?veg(etarian)?$|^vegan$|^egg$|^jain$/i.test(d.trim()))
                return (
                  <li key={item.id} className="sf-dish" data-soldout={!inStock || undefined}>
                    <button type="button" className="sf-dish__open" onClick={() => setSelectedId(item.id)}>
                      <span className="sf-visually-hidden">View {item.name}</span>
                    </button>
                    <div className="sf-dish__body">
                      <div className="sf-dish__title-row">
                        {mark && <span className={`sf-diet sf-diet--${mark}`} title={mark === 'veg' ? 'Vegetarian' : 'Non-vegetarian'} />}
                        <h3 className="sf-dish__name">{item.name}</h3>
                      </div>
                      <p className="sf-dish__price">{formatMoney(item.price, item.currency)}{hasVariants ? '+' : ''}</p>
                      {item.description && <p className="sf-dish__desc">{item.description}</p>}
                      {otherTags.length > 0 && (
                        <div className="sf-dish__tags">
                          {otherTags.slice(0, 3).map((d) => (
                            <Badge key={d} tone="soft">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="sf-dish__media">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
                      ) : null}
                      <div className="sf-dish__cta">
                        {!inStock ? (
                          <span className="sf-dish__soldout">Sold out</span>
                        ) : hasVariants ? (
                          <button type="button" className="sf-dish__add" onClick={() => setSelectedId(item.id)}>
                            {qty > 0 ? `${qty} added` : 'Add'} <IconPlus size={14} />
                          </button>
                        ) : qty === 0 ? (
                          <button type="button" className="sf-dish__add" onClick={() => add(item)}>
                            Add <IconPlus size={14} />
                          </button>
                        ) : (
                          <QuantityStepper
                            size="sm"
                            min={0}
                            value={qty}
                            label={`Quantity of ${item.name}`}
                            className="sf-dish__qty"
                            onChange={(q) => (q > qty ? add(item) : setQuantity(item.id, q))}
                          />
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {!compact && itemCount > 0 && (
        <div className="sf-menu-cartbar" data-storefront-bottom-bar="">
          <button
            type="button"
            className="sf-menu-cartbar__btn"
            onClick={() => {
              if (!openCartDrawer()) window.location.assign('/checkout')
            }}
          >
            <span className="sf-menu-cartbar__count">
              <IconBag size={18} /> {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
            <span>View cart · {formatMoney(subtotal, currency)}</span>
          </button>
        </div>
      )}
    </>
  )
}
