import type { ProductCategoryNav } from '@/lib/productCategories'
import type { StorefrontMenuNavLink } from '@/components/StorefrontMenuDrawer'
import type { StorefrontProductCategory } from '@/lib/storefront-api'

export type LuxeNavItem = {
  href: string
  label: string
}

const LUXE_STATIC_TAIL: LuxeNavItem[] = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

const LUXE_DRAWER_ACCOUNT: StorefrontMenuNavLink[] = [
  { href: '/account', label: 'My orders' },
  { href: '/orders/track', label: 'Track order' },
  { href: '/account/login', label: 'Sign in' },
  { href: '/account/login?signup=1', label: 'Sign up' },
]

export function toLuxeNavCategories(
  categories: Array<ProductCategoryNav | StorefrontProductCategory>,
): ProductCategoryNav[] {
  return categories
    .map((c) => ({
      slug: c.slug?.trim() ?? '',
      name: c.name?.trim() || c.slug?.trim() || '',
      sortOrder: c.sortOrder ?? 100,
    }))
    .filter((c) => c.slug)
}

export function categoryHref(slug: string): string {
  return `/categories/${encodeURIComponent(slug.trim())}`
}

/**
 * Desktop primary nav: one Categories dropdown (never inline pills) + static tail.
 * Zero categories → All products only (no Categories control).
 */
export function buildLuxeDesktopNav(categories: ProductCategoryNav[]): {
  inline: LuxeNavItem[]
  dropdown: LuxeNavItem[]
} {
  const catLinks = categories.map((c) => ({
    href: categoryHref(c.slug),
    label: c.name,
  }))
  const allProducts: LuxeNavItem = { href: '/products', label: 'All products' }
  const viewAll: LuxeNavItem = { href: '/products', label: 'View all' }

  if (catLinks.length === 0) {
    return { inline: [allProducts, ...LUXE_STATIC_TAIL], dropdown: [] }
  }

  return {
    inline: [...LUXE_STATIC_TAIL],
    dropdown: [...catLinks, viewAll],
  }
}

/** Flat drawer links excluding categories (categories render in a dedicated section). */
export function buildLuxeDrawerNav(
  categories: ProductCategoryNav[],
  cmsNavLinks?: StorefrontMenuNavLink[] | null,
): StorefrontMenuNavLink[] {
  const allProducts: StorefrontMenuNavLink = { href: '/products', label: 'All products' }

  const fallback: StorefrontMenuNavLink[] = [...LUXE_STATIC_TAIL, ...LUXE_DRAWER_ACCOUNT]
  const rest = (cmsNavLinks?.length ? cmsNavLinks : fallback).filter((link) => {
    const href = link.href.trim()
    if (href === '#products' || href === '/products') return false
    if (categories.some((c) => href === categoryHref(c.slug) || href === `/categories/${c.slug}`)) {
      return false
    }
    return true
  })

  return [allProducts, ...rest]
}

export function buildLuxeDrawerCategoryLinks(categories: ProductCategoryNav[]): StorefrontMenuNavLink[] {
  return categories.map((c) => ({
    href: categoryHref(c.slug),
    label: c.name,
  }))
}
