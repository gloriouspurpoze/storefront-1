'use client'

import type { PublicProductVariant } from '@/lib/storefront-api'
import './product-variant-selector.css'

export type VariantSelectorTone = 'default' | 'soft-studio' | 'luxe' | 'restaurant' | 'saffron'

export function ProductVariantSelector({
  variants,
  selectedId,
  onSelect,
  label = 'Options',
  tone = 'default',
}: {
  variants: PublicProductVariant[]
  selectedId?: string | null
  onSelect: (variantId: string) => void
  label?: string
  tone?: VariantSelectorTone
}) {
  if (!variants.length) return null

  const toneClass =
    tone === 'default' ? '' : ` sf-variant-selector--${tone}`

  return (
    <div className={`sf-variant-selector${toneClass}`}>
      <p className="sf-variant-selector__label" id="sf-variant-label">
        {label}
      </p>
      <ul className="sf-variant-selector__options" role="listbox" aria-labelledby="sf-variant-label">
        {variants.map((v) => {
          const selected = v.id === selectedId
          const outOfStock = v.inStock === false
          return (
            <li key={v.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                aria-pressed={selected}
                disabled={outOfStock}
                className={`sf-variant-selector__chip${outOfStock ? ' sf-variant-selector__chip--oos' : ''}`}
                onClick={() => onSelect(v.id)}
              >
                {v.name}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
