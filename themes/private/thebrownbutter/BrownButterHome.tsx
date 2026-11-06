import type { ComponentProps } from 'react'
import { headers } from 'next/headers'
import { JsonLd } from '@/components/seo/JsonLd'
import { resolveStorefrontBaseUrl } from '@/lib/product-seo'
import { BrownButterPage } from './BrownButterPage'
import { buildBrownButterHomeJsonLd } from './brownButterSeo'

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

  return (
    <>
      <JsonLd id="bb-home-jsonld" data={jsonLd} />
      <BrownButterPage {...props} />
    </>
  )
}
