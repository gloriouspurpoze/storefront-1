'use client'

import Link from 'next/link'
import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import type { ThemeTenant } from '../types'
import { LuxeEssenceLayoutPage } from './LuxeEssenceLayoutPage'

export function LuxeEssenceAboutPage({
  tenant,
  config,
  cmsPage,
  footerLinks,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  cmsPage?: StorefrontCmsPage | null
  footerLinks?: StorefrontNavLink[]
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const title = cmsPage?.title?.trim() || 'Our story'
  const html = cmsPage?.content?.trim()
  const excerpt = cmsPage?.excerpt?.trim()

  return (
    <LuxeEssenceLayoutPage
      tenant={tenant}
      config={config}
      mainClassName="sf-page-shell sf-page-shell--narrow"
      footerLinks={footerLinks}
    >
      <p className="sf-page-eyebrow">About</p>
      <h1 className="sf-page-title">{title}</h1>
      {html ? (
        <div
          className="prose prose-neutral mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="sf-page-lead">
          {excerpt ||
            `${siteName} is built on quality, care, and consistency. Whether you are visiting for the first time or returning as a regular, we are glad you are here.`}
        </p>
      )}
      <nav className="le-policy-links" aria-label="Related links">
        <Link href="/">Back to store</Link>
        <Link href="/products">Shop all</Link>
        <Link href="/contact">Contact us</Link>
      </nav>
    </LuxeEssenceLayoutPage>
  )
}
