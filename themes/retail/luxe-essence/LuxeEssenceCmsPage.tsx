'use client'

import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

/** Published CMS static page in Luxe chrome. */
export function LuxeEssenceCmsPage({
  tenant,
  config,
  page,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  page: StorefrontCmsPage
}) {
  const html = page.content?.trim()
  const excerpt = page.excerpt?.trim()
  const eyebrow = page.slug?.replace(/-/g, ' ') || 'Page'

  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="sf-page-shell sf-page-shell--narrow"
    >
      <p className="sf-page-eyebrow">{eyebrow}</p>
      <h1 className="sf-page-title">{page.title}</h1>
      {excerpt ? <p className="sf-page-lead">{excerpt}</p> : null}
      {html ? (
        <div
          className="prose prose-neutral mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/">Back to store</Link>
        <Link href="/products">Shop all</Link>
        <Link href="/blog">Blog</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
