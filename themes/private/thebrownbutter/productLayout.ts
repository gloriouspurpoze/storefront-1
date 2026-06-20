import type { PublicProduct } from '@/lib/storefront-api'

export type TinVariant = PublicProduct & { sizeLabel: string }

export type TinGroup = {
  id: string
  name: string
  desc: string
  img?: string
  variants: TinVariant[]
}

export type BrownButterSection = {
  id: string
  label: string
  sortOrder: number
  /** `variants` = tin-style rows; `cards` = one card per product (cups). */
  layout: 'variants' | 'cards'
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

function groupTinProducts(products: PublicProduct[]): { tinGroups: TinGroup[]; cards: PublicProduct[] } {
  const byBase = new Map<string, PublicProduct[]>()

  for (const product of products) {
    const base = baseProductName(product.name)
    const bucket = byBase.get(base) ?? []
    bucket.push(product)
    byBase.set(base, bucket)
  }

  const tinGroups: TinGroup[] = []
  const cards: PublicProduct[] = []

  for (const [base, items] of byBase) {
    const sorted = [...items].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))

    if (sorted.length === 1) {
      cards.push(sorted[0])
      continue
    }

    const lead = sorted[0]
    tinGroups.push({
      id: sorted.map((p) => p.slug).sort().join('|'),
      name: base,
      desc: lead.shortDescription ?? lead.description ?? '',
      img: lead.imageUrl,
      variants: sorted.map((p) => ({
        ...p,
        sizeLabel: variantSizeLabel(p.name),
      })),
    })
  }

  tinGroups.sort((a, b) => a.name.localeCompare(b.name))
  cards.sort((a, b) => a.name.localeCompare(b.name))

  return { tinGroups, cards }
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
      if (bucket.layout === 'cards') {
        const cards = [...bucket.products].sort((a, b) => a.name.localeCompare(b.name))
        return {
          id,
          label: bucket.label,
          sortOrder: bucket.sortOrder,
          layout: 'cards' as const,
          tinGroups: [],
          cards,
        }
      }

      const { tinGroups, cards } = groupTinProducts(bucket.products)
      return {
        id,
        label: bucket.label,
        sortOrder: bucket.sortOrder,
        layout: 'variants' as const,
        tinGroups,
        cards,
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
}
