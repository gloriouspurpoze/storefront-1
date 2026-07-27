import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import { StorefrontCmsPageArticle } from '@/components/content/StorefrontCmsPageArticle'
import { loadHomeServicesTenant } from '@/themes/home-services/loadThemeTenant'
import { SiteHeader as HsHeader } from '@/themes/home-services/SiteHeader'
import { SiteFooter as HsFooter } from '@/themes/home-services/SiteFooter'
import { toThemeTenant as toHsTenant } from '@/themes/home-services/types'
import { loadRestaurantTenant } from '@/themes/restaurant/loadThemeTenant'
import { RestaurantShell } from '@/themes/restaurant/RestaurantShell'
import { SiteHeader as RestHeader } from '@/themes/restaurant/SiteHeader'
import { SiteFooter as RestFooter } from '@/themes/restaurant/SiteFooter'
import { toThemeTenant as toRestTenant } from '@/themes/restaurant/types'
import { MenuFastCardsContentShell } from '@/themes/restaurant/menufast/MenuFastCardsContentShell'
import { loadRetailTenant } from '@/themes/retail/loadThemeTenant'
import { RetailShell } from '@/themes/retail/RetailShell'
import { SiteHeader as RetailHeader } from '@/themes/retail/SiteHeader'
import { SiteFooter as RetailFooter } from '@/themes/retail/SiteFooter'
import { toThemeTenant as toRetailTenant } from '@/themes/retail/types'
import { LuxeEssenceLayoutPage } from '@/themes/retail/luxe-essence/LuxeEssenceLayoutPage'

/**
 * Renders any published CMS static page inside the active vertical/theme shell.
 */
export async function CmsStaticPageScreen({ page }: { page: StorefrontCmsPage }) {
  const resolved = await loadTenantFromRequest()
  if (!resolved) notFound()

  const article = <StorefrontCmsPageArticle page={page} />

  switch (resolved.verticalKey) {
    case 'home_services': {
      const tenant = await loadHomeServicesTenant()
      const theme = toHsTenant(tenant, tenant.fallbackTagline)
      return (
        <>
          <HsHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">{article}</main>
          <HsFooter tenant={theme} />
        </>
      )
    }
    case 'restaurant': {
      const tenant = await loadRestaurantTenant()
      const theme = toRestTenant(tenant, tenant.fallbackTagline)
      const config = await fetchStorefrontConfig(tenant.id)
      if (config?.themeKey === 'menufast-cards') {
        const html = page.content?.trim()
        return (
          <MenuFastCardsContentShell tenant={theme} config={config} title={page.title}>
            <article className="mf-cards-content-article">
              <h2 className="mf-cards-content-heading">{page.title}</h2>
              {page.excerpt?.trim() ? (
                <p className="mf-cards-content-muted">{page.excerpt.trim()}</p>
              ) : null}
              {html ? (
                <div
                  className="mf-cards-content-prose prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : null}
            </article>
          </MenuFastCardsContentShell>
        )
      }
      return (
        <RestaurantShell tenantId={tenant.id}>
          <RestHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-stone-800">{article}</main>
          <RestFooter tenant={theme} />
        </RestaurantShell>
      )
    }
    case 'retail': {
      const tenant = await loadRetailTenant()
      const theme = toRetailTenant(tenant, tenant.fallbackTagline)
      const config = await fetchStorefrontConfig(tenant.id)
      if (config?.themeKey === 'luxe-essence') {
        const html = page.content?.trim()
        return (
          <RetailShell tenantId={tenant.id}>
            <LuxeEssenceLayoutPage
              tenant={theme}
              config={config}
              mainClassName="sf-page-shell sf-page-shell--narrow"
            >
              <p className="sf-page-eyebrow">{page.slug.replace(/-/g, ' ')}</p>
              <h1 className="sf-page-title">{page.title}</h1>
              {page.excerpt?.trim() ? <p className="sf-page-lead">{page.excerpt.trim()}</p> : null}
              {html ? (
                <div
                  className="prose prose-neutral mt-6 max-w-none"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : null}
            </LuxeEssenceLayoutPage>
          </RetailShell>
        )
      }
      return (
        <RetailShell tenantId={tenant.id}>
          <RetailHeader tenant={theme} />
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-slate-800">{article}</main>
          <RetailFooter tenant={theme} />
        </RetailShell>
      )
    }
    default:
      notFound()
  }
}
