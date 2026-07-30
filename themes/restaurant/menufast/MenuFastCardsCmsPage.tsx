import type { StorefrontConfig } from '@/lib/storefront-api'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import type { ThemeTenant } from '../types'
import { MenuFastCardsContentShell } from './MenuFastCardsContentShell'

/** Published CMS static page (privacy, terms, custom slugs) in Cards chrome. */
export function MenuFastCardsCmsPage({
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

  return (
    <MenuFastCardsContentShell tenant={tenant} config={config} title={page.title}>
      <article className="mf-cards-content-article">
        <h2 className="mf-cards-content-heading">{page.title}</h2>
        {excerpt ? <p className="mf-cards-content-muted">{excerpt}</p> : null}
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
