import type { ComponentProps } from 'react'
import { headers } from 'next/headers'
import { JsonLd } from '@/components/seo/JsonLd'
import { resolveStorefrontBaseUrl } from '@/lib/product-seo'
import { BrownButterPage } from './BrownButterPage'
import { buildBrownButterHomeJsonLd } from './brownButterSeo'
import { fetchCategoryMarketing } from '@/lib/storefront-api'
import { normalizeCategoryMarketingRecord } from '@/lib/categoryMarketing'
import { buildFaqPageJsonLd, completeFaqs } from '@/lib/faq-jsonld'

export type MenuSectionCopy = Record<string, { intro: string; faqs: Array<{ question: string; answer: string }> }>

/** Intro + FAQs per menu section (category slug), written in admin → SEO → Categories. */
async function loadSectionCopy(tenantId: string): Promise<MenuSectionCopy> {
  const raw = await fetchCategoryMarketing(tenantId).catch(() => ({}))
  const out: MenuSectionCopy = {}
  for (const [slug, cfg] of Object.entries(normalizeCategoryMarketingRecord(raw))) {
    const intro = cfg.intro.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const faqs = completeFaqs(cfg.faqs)
    if (intro || faqs.length) out[slug.trim().toLowerCase()] = { intro, faqs }
  }
  return out
}

/**
 * Server wrapper for the (client) Brown Butter menu page: puts the Bakery + menu
 * structured data in the server HTML so non-JS crawlers and LLM bots get it.
 */
export async function BrownButterHome(props: ComponentProps<typeof BrownButterPage>) {
  const { tenant, config, products = [] } = props
  const h = await headers()
  const baseUrl = resolveStorefrontBaseUrl(config, h.get('host'), h.get('x-forwarded-proto') ?? 'https')
  const siteName = config?.branding?.siteName || tenant.name
  const logoUrl = config?.branding?.logoUrl || tenant.logoUrl || undefined
  const jsonLd = buildBrownButterHomeJsonLd({ config, siteName, baseUrl, logoUrl, products })
  const sectionCopy = await loadSectionCopy(tenant.id)
  // Only sections that are on the menu show their FAQs, so only those are marked up.
  const liveSlugs = new Set(products.map((p) => (p.categorySlug || '').toLowerCase()))
  const faqLd = buildFaqPageJsonLd(
    Object.entries(sectionCopy).flatMap(([slug, c]) => (liveSlugs.has(slug) ? c.faqs : [])),
  )

  return (
    <>
      <JsonLd id="bb-home-jsonld" data={jsonLd} />
      {faqLd ? <JsonLd id="bb-home-faq-jsonld" data={faqLd} /> : null}
      <BrownButterPage {...props} sectionCopy={sectionCopy} />
    </>
  )
}
