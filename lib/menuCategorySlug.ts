import type { PublicMenuCategory } from './storefront-api'

export type MenuCategoryFilterId = 'all' | string

/** Resolve `?category=` slug to the menu API category id (Mongo id). */
export function menuCategoryIdForSlug(
  categories: PublicMenuCategory[],
  slug: string | null | undefined,
): MenuCategoryFilterId {
  const normalized = slug?.trim().toLowerCase() ?? ''
  if (!normalized || normalized === 'all') return 'all'
  const match = categories.find(
    (c) => (c.slug ?? c.id).toLowerCase() === normalized,
  )
  return match?.id ?? 'all'
}

export function menuCategorySlugForId(
  categories: PublicMenuCategory[],
  categoryId: MenuCategoryFilterId,
): string | null {
  if (categoryId === 'all') return null
  return categories.find((c) => c.id === categoryId)?.slug ?? null
}
