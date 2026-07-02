'use client'

import type { StorefrontConfig } from '@/lib/storefront-api'

/** Optional hero from admin config — hidden when headline and subcopy are unset. */
export function MenuFastCardsHero({ config }: { config: StorefrontConfig | null }) {
  const headline = config?.content?.heroHeadline?.trim()
  const subcopy = config?.content?.heroSubcopy?.trim()

  if (!headline && !subcopy) return null

  return (
    <section className="mf-cards-hero" aria-label="Featured">
      {headline ? <h2 className="mf-cards-hero-title">{headline}</h2> : null}
      {subcopy ? <p className="mf-cards-hero-sub">{subcopy}</p> : null}
    </section>
  )
}
