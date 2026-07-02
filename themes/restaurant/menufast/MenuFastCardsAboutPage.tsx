import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '../types'
import { MenuFastCardsContentShell } from './MenuFastCardsContentShell'

export function MenuFastCardsAboutPage({
  tenant,
  config,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const aboutTitle = config?.content?.aboutTitle?.trim()
  const aboutBody = config?.content?.aboutBody?.trim()

  return (
    <MenuFastCardsContentShell tenant={tenant} config={config} title="About">
      <article className="mf-cards-content-article">
        <h2 className="mf-cards-content-heading">{aboutTitle || siteName}</h2>
        {aboutBody ? (
          <div className="mf-cards-content-prose">{aboutBody}</div>
        ) : (
          <p className="mf-cards-content-muted">
            {config?.branding?.tagline || 'Welcome to our online menu.'}
          </p>
        )}
      </article>
    </MenuFastCardsContentShell>
  )
}
