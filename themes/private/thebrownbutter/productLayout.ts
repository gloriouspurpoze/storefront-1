import type { PublicProduct } from '@/lib/storefront-api'
import { productHasVariants } from '@/lib/productVariants'

export type TinVariant = PublicProduct & { sizeLabel: string; variantId?: string }

export type TinGroup = {
  id: string
  name: string
  desc: string
  img?: string
  variants: TinVariant[]
}

export type BrownButterSectionItem =
  | { kind: 'tin'; group: TinGroup }
  | { kind: 'card'; product: PublicProduct }

export type BrownButterSection = {
  id: string
  label: string
  sortOrder: number
  /** `variants` = tin-style rows; `cards` = one card per product (cups). */
  layout: 'variants' | 'cards'
  /** Display items in API/catalog order (tins and cards interleaved). */
  items: BrownButterSectionItem[]
  tinGroups: TinGroup[]
  cards: PublicProduct[]
}

const UNCategorized_KEY = '__uncategorized__'

function baseProductName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim()
}

function variantSizeLabel(name: string): string {
  const paren = name.match(/\(([^)]+)\)\s*$/)
  return paren?.[1] ?? name
}

function isCupCategory(categorySlug?: string): boolean {
  if (!categorySlug) return false
  return categorySlug === 'bb-cookie-cups' || categorySlug.includes('cup')
}

function embeddedVariantsToTinGroup(product: PublicProduct): TinGroup | null {
  if (!productHasVariants(product) || !product.variants?.length) return null
  return {
    id: product.id,
    name: product.name,
    desc: product.shortDescription ?? product.description ?? '',
    img: product.imageUrl,
    variants: product.variants.map((v) => ({
      ...product,
      price: v.price,
      originalPrice: v.originalPrice,
      inStock: v.inStock !== false,
      imageUrl: v.imageUrl?.trim() || product.imageUrl,
      sizeLabel: v.name,
      variantId: v.id,
    })),
  }
}

function buildTinGroupFromNameVariants(base: string, items: PublicProduct[]): TinGroup {
  const lead = items[0]
  return {
    id: items.map((p) => p.slug).join('|'),
    name: base,
    desc: lead.shortDescription ?? lead.description ?? '',
    img: lead.imageUrl,
    variants: items.map((p) => ({
      ...p,
      sizeLabel: variantSizeLabel(p.name),
    })),
  }
}

/**
 * Group products into tin rows / cards while preserving API catalog order.
 * First appearance of a base name (or embedded-variant product) sets its grid position.
 */
function groupTinProducts(products: PublicProduct[]): {
  items: BrownButterSectionItem[]
  tinGroups: TinGroup[]
  cards: PublicProduct[]
} {
  const byBase = new Map<string, PublicProduct[]>()
  const embeddedById = new Map<string, TinGroup>()
  const orderKeys: Array<{ type: 'embedded'; id: string } | { type: 'base'; base: string }> = []
  const seenBase = new Set<string>()

  for (const product of products) {
    const embedded = embeddedVariantsToTinGroup(product)
    if (embedded) {
      embeddedById.set(product.id, embedded)
      orderKeys.push({ type: 'embedded', id: product.id })
      continue
    }

    const base = baseProductName(product.name)
    const bucket = byBase.get(base) ?? []
    bucket.push(product)
    byBase.set(base, bucket)
    if (!seenBase.has(base)) {
      seenBase.add(base)
      orderKeys.push({ type: 'base', base })
    }
  }

  const items: BrownButterSectionItem[] = []
  const tinGroups: TinGroup[] = []
  const cards: PublicProduct[] = []

  for (const key of orderKeys) {
    if (key.type === 'embedded') {
      const group = embeddedById.get(key.id)
      if (!group) continue
      tinGroups.push(group)
      items.push({ kind: 'tin', group })
      continue
    }

    const nameItems = byBase.get(key.base)
    if (!nameItems?.length) continue

    if (nameItems.length === 1) {
      cards.push(nameItems[0])
      items.push({ kind: 'card', product: nameItems[0] })
      continue
    }

    const group = buildTinGroupFromNameVariants(key.base, nameItems)
    tinGroups.push(group)
    items.push({ kind: 'tin', group })
  }

  return { items, tinGroups, cards }
}

function layoutCardsSection(products: PublicProduct[]): {
  items: BrownButterSectionItem[]
  tinGroups: TinGroup[]
  cards: PublicProduct[]
} {
  const items: BrownButterSectionItem[] = []
  const tinGroups: TinGroup[] = []
  const cards: PublicProduct[] = []

  for (const p of products) {
    const embedded = embeddedVariantsToTinGroup(p)
    if (embedded) {
      tinGroups.push(embedded)
      items.push({ kind: 'tin', group: embedded })
    } else {
      cards.push(p)
      items.push({ kind: 'card', product: p })
    }
  }

  return { items, tinGroups, cards }
}

/**
 * Builds storefront sections from live products.
 *
 * - **Category** decides which section a product appears in (assign in admin).
 * - **Cookie Cups** categories render one card per product.
 * - **All other categories** group products that share the same base name
 *   (text before parentheses) into variant rows — e.g. "New Flavor (Mini 200g)"
 *   + "New Flavor (Standard 500g)" become one tin card automatically.
 * - **New categories** you create in admin become new sections on the page.
 * - Product order within each section follows API catalog order (`sortOrder`).
 * - Section order follows `categorySortOrder` (category catalog order).
 */
export function layoutBrownButterProducts(products: PublicProduct[]): BrownButterSection[] {
  const sectionMap = new Map<
    string,
    { label: string; sortOrder: number; layout: 'variants' | 'cards'; products: PublicProduct[] }
  >()

  for (const product of products) {
    const key = product.categorySlug || UNCategorized_KEY
    const label =
      product.categoryName ||
      (key === UNCategorized_KEY ? 'More' : key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    const sortOrder = product.categorySortOrder ?? (key === UNCategorized_KEY ? 999 : 100)
    const layout = isCupCategory(product.categorySlug) ? 'cards' : 'variants'

    const existing = sectionMap.get(key)
    if (existing) {
      existing.products.push(product)
      continue
    }

    sectionMap.set(key, { label, sortOrder, layout, products: [product] })
  }

  return [...sectionMap.entries()]
    .map(([id, bucket]) => {
      const laidOut =
        bucket.layout === 'cards'
          ? layoutCardsSection(bucket.products)
          : groupTinProducts(bucket.products)

      return {
        id,
        label: bucket.label,
        sortOrder: bucket.sortOrder,
        layout: bucket.layout,
        items: laidOut.items,
        tinGroups: laidOut.tinGroups,
        cards: laidOut.cards,
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
}
