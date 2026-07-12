import type { PublicProduct } from '@/lib/storefront-api'

export type ProductCategoryNav = {
  slug: string
  name: string
  sortOrder: number
}

function readCategorySlug(product: PublicProduct): string | undefined {
  const raw = product as PublicProduct & { category_slug?: string }
  return raw.categorySlug?.trim() || raw.category_slug?.trim()
}

function readCategoryName(product: PublicProduct, slug: string): string {
  const raw = product as PublicProduct & { category_name?: string }
  return raw.categoryName?.trim() || raw.category_name?.trim() || slug
}

function readCategorySortOrder(product: PublicProduct): number {
  const raw = product as PublicProduct & { category_sort_order?: number }
  return product.categorySortOrder ?? raw.category_sort_order ?? 100
}

/** Unique catalog categories from products, sorted for nav pills. */
export function collectProductCategories(products: PublicProduct[]): ProductCategoryNav[] {
  const map = new Map<string, ProductCategoryNav>()

  for (const product of products) {
    const slug = readCategorySlug(product)
    if (!slug) continue

    const name = readCategoryName(product, slug)
    const sortOrder = readCategorySortOrder(product)
    const existing = map.get(slug)

    if (!existing || sortOrder < existing.sortOrder) {
      map.set(slug, { slug, name, sortOrder })
    }
  }

  return sortCategories(Array.from(map.values()))
}

export function sortCategories(categories: ProductCategoryNav[]): ProductCategoryNav[] {
  return [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )
}

/** Admin catalog categories merged with any product-only slugs not yet in the list. */
export function mergeStorefrontCategories(
  catalogCategories: ProductCategoryNav[],
  products: PublicProduct[],
): ProductCategoryNav[] {
  const map = new Map<string, ProductCategoryNav>()
  for (const category of catalogCategories) {
    const slug = category.slug?.trim()
    if (!slug) continue
    map.set(slug, {
      slug,
      name: category.name?.trim() || slug,
      sortOrder: category.sortOrder ?? 100,
    })
  }
  for (const fromProduct of collectProductCategories(products)) {
    if (!map.has(fromProduct.slug)) {
      map.set(fromProduct.slug, fromProduct)
    }
  }
  return sortCategories(Array.from(map.values()))
}
