import type { PublicMenuCategory } from './storefront-api'

/** Total menu items across all categories (ignores empty category shells). */
export function countMenuItems(categories: PublicMenuCategory[]): number {
  return categories.reduce((total, category) => total + category.items.length, 0)
}

/** Categories that contain at least one item — avoids empty section headers in the grid. */
export function categoriesWithItems(categories: PublicMenuCategory[]): PublicMenuCategory[] {
  return categories.filter((category) => category.items.length > 0)
}

export type MenuCategoryFilterId = 'all' | string

/** Filter by category tab and optional search query (name + description). */
export function filterMenuCategories(
  categories: PublicMenuCategory[],
  opts: { categoryId?: MenuCategoryFilterId; searchQuery?: string },
): PublicMenuCategory[] {
  const q = opts.searchQuery?.trim().toLowerCase() ?? ''
  const categoryId = opts.categoryId ?? 'all'

  return categories
    .map((cat) => {
      if (categoryId !== 'all' && cat.id !== categoryId) return null
      const items = q
        ? cat.items.filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              (item.description ?? '').toLowerCase().includes(q),
          )
        : cat.items
      if (items.length === 0) return null
      return { ...cat, items }
    })
    .filter((cat): cat is PublicMenuCategory => cat !== null)
}