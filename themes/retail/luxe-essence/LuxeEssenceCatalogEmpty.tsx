'use client'

import type { ReactNode } from 'react'

/** Default from THEME_BRIEF.yaml → data.emptyCatalogMessage */
export const LUXE_ESSENCE_EMPTY_CATALOG_MESSAGE =
  'Products coming soon — add items in your admin dashboard under Store / Products.'

export function LuxeEssenceCatalogSectionShell({ children }: { children: ReactNode }) {
  return (
    <section id="products" className="le-section" aria-label="Product catalog">
      <p className="le-section-label">Shop</p>
      <h2 className="le-section-title">Featured products</h2>
      {children}
    </section>
  )
}

export function LuxeEssenceCatalogEmpty({
  message = LUXE_ESSENCE_EMPTY_CATALOG_MESSAGE,
}: {
  message?: string
}) {
  return (
    <LuxeEssenceCatalogSectionShell>
      <div className="le-catalog-empty" role="status">
        <p className="le-catalog-empty-copy">{message}</p>
      </div>
    </LuxeEssenceCatalogSectionShell>
  )
}
