'use client'

import Link from 'next/link'
import { StorefrontMenuDrawer, type StorefrontMenuNavLink } from '@/components/StorefrontMenuDrawer'
import type { ProductCategoryNav } from '@/lib/productCategories'
import type { ComponentProps } from 'react'
import {
  buildLuxeDrawerCategoryLinks,
  buildLuxeDrawerNav,
  toLuxeNavCategories,
} from './luxeEssenceNav'

type MenuDrawerProps = Omit<ComponentProps<typeof StorefrontMenuDrawer>, 'drawerId' | 'navExtra'> & {
  categories?: Array<ProductCategoryNav | { slug: string; name: string; sortOrder?: number }>
}

/** Luxe Essence mobile nav — Categories group, then All products + CMS / theme defaults. */
export function LuxeEssenceMenuDrawer({ navLinks, categories = [], onClose, ...props }: MenuDrawerProps) {
  const navCategories = toLuxeNavCategories(categories)
  const categoryLinks = buildLuxeDrawerCategoryLinks(navCategories)
  const merged: StorefrontMenuNavLink[] = buildLuxeDrawerNav(navCategories, navLinks)

  const categoriesBlock =
    categoryLinks.length > 0 ? (
      <nav className="le-drawer-categories" aria-label="Categories">
        <p className="le-drawer-categories-label">Categories</p>
        <ul className="le-drawer-categories-list">
          {categoryLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="le-drawer-categories-link" onClick={onClose}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    ) : null

  return (
    <StorefrontMenuDrawer
      {...props}
      onClose={onClose}
      drawerId="storefront-menu-drawer"
      navExtra={categoriesBlock}
      navLinks={merged}
      shippingPolicyLabel="Shipping policy"
    />
  )
}
