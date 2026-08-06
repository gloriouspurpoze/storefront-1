'use client'

import type { ReactNode } from 'react'

/** Default from THEME_BRIEF.yaml → data.emptyCatalogMessage */
export const LUXE_ESSENCE_EMPTY_CATALOG_MESSAGE =
  'Products coming soon — add items in your admin dashboard under Store / Products.'

export function LuxeEssenceCatalogSectionShell({
  children,
  label = 'Shop',
  title = 'Featured products',
}: {
  children: ReactNode
  label?: string
  title?: string
}) {
  return (
    <section id="products" className="le-section" aria-label="Product catalog">
      <p className="le-section-label">{label}</p>
      <h2 className="le-section-title">{title}</h2>
      {children}
    </section>
  )
}

export function LuxeEssenceCatalogEmpty({
  message = LUXE_ESSENCE_EMPTY_CATALOG_MESSAGE,
  label,
  title,
}: {
  message?: string
  label?: string
  title?: string
}) {
  return (
    <LuxeEssenceCatalogSectionShell label={label} title={title}>
      <div className="le-catalog-empty" role="status">
        <p className="le-catalog-empty-copy">{message}</p>
      </div>
    </LuxeEssenceCatalogSectionShell>
  )
}
