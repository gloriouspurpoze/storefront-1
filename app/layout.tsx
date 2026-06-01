import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

/**
 * Storefront root layout — applies to ALL tenants. Per-tenant theming (brand
 * color) is overridden by `sites/[tenantId]/layout.tsx`, so this file holds
 * neutral fallbacks only.
 */
export const metadata: Metadata = {
  title: { default: 'Profixer', template: '%s · Profixer' },
  description: 'Powered by Profixer — the multi-vertical SaaS platform.',
  robots: { index: false, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
