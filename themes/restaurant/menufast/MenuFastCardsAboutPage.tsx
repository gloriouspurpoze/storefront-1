import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import type { ThemeTenant } from '../types'
import { MenuFastCardsContentShell } from './MenuFastCardsContentShell'

export function MenuFastCardsAboutPage({
  tenant,
  config,
  cmsPage,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  cmsPage?: StorefrontCmsPage | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const aboutTitle = cmsPage?.title?.trim() || config?.content?.aboutTitle?.trim()
  const aboutBody = cmsPage?.content?.trim() || config?.content?.aboutBody?.trim()
  const isHtml = Boolean(cmsPage?.content?.trim())

  return (
    <MenuFastCardsContentShell tenant={tenant} config={config} title="About">
      <article className="mf-cards-content-article">
        <h2 className="mf-cards-content-heading">{aboutTitle || siteName}</h2>
        {aboutBody ? (
          isHtml ? (
            <div
              className="mf-cards-content-prose prose prose-neutral max-w-none"
              dangerouslySetInnerHTML={{ __html: aboutBody }}
            />
          ) : (
            <div className="mf-cards-content-prose">{aboutBody}</div>
          )
        ) : (
          <p className="mf-cards-content-muted">
            {config?.branding?.tagline || 'Welcome to our online menu.'}
          </p>
        )}
      </article>
    </MenuFastCardsContentShell>
  )
}
