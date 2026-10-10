import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@/app/globals.css'

/**
 * Root document for tenant storefronts and the unknown-host page. The marketing site
 * (`app/platform/layout.tsx`) is a separate root layout so it can declare `lang="en-IN"`
 * without reading request headers — which would make every page dynamic.
 *
 * Per-tenant theming (brand color) is overridden by `sites/[tenantId]/layout.tsx`, so
 * this holds neutral fallbacks only.
 */
export const STORE_ROOT_METADATA: Metadata = {
  title: { default: 'Torq Studio', template: '%s' },
  description: 'Powered by Torq Studio - the multi-vertical SaaS platform.',
  robots: { index: false, follow: true },
}

export const STORE_ROOT_VIEWPORT: Viewport = {
  themeColor: '#0f172a',
}

export function StoreRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
