import type { StorefrontNavLink } from '@/lib/cms-content'
import type { StorefrontCmsPage } from '@/lib/cms-pages'
import type { StorefrontConfig } from '@/lib/storefront-api'
import type { ThemeTenant } from '@/themes/restaurant/types'
import { BrownButterFrame } from './BrownButterFrame'

export function BrownButterAboutView({
  tenant,
  config,
  navLinks,
  cmsPage,
}: {
  tenant: ThemeTenant
  config: StorefrontConfig | null
  navLinks?: StorefrontNavLink[]
  cmsPage?: StorefrontCmsPage | null
}) {
  const siteName = config?.branding?.siteName || tenant.name
  const tagline = config?.branding?.tagline?.trim()
  const title = cmsPage?.title?.trim() || config?.content?.aboutTitle?.trim() || siteName
  const cmsHtml = cmsPage?.content?.trim()
  const plain = cmsHtml ? '' : config?.content?.aboutBody?.trim() || ''

  return (
    <BrownButterFrame
      config={config}
      navLinks={navLinks}
      headerTitle={siteName}
      contactPhone={config?.branding?.contactPhone}
    >
      <article className="bb-story">
        <p className="bb-kicker">About</p>
        <h1 className="bb-page-title">{title}</h1>
        {cmsPage?.excerpt?.trim() ? <p className="bb-lead">{cmsPage.excerpt.trim()}</p> : null}
        {cmsHtml ? (
          <div className="bb-prose" dangerouslySetInnerHTML={{ __html: cmsHtml }} />
        ) : plain ? (
          <div className="bb-prose">
            {plain.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className="bb-prose">
            <p>
              {siteName} bakes in small batches. Cookies leave the oven and head out for delivery
              the same day.
            </p>
            {tagline ? <p>{tagline}</p> : null}
          </div>
        )}
      </article>
    </BrownButterFrame>
  )
}
