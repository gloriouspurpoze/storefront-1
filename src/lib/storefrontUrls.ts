import {
  storefrontDomainsService,
  type StorefrontDomain,
} from '../services/api/storefrontDomains.service'

/** True when the admin app is served from localhost / *.localhost. */
export function isLocalAdminHost(): boolean {
  if (typeof window === 'undefined') return false
  return /^(localhost|127\.0\.0\.1|.*\.localhost)$/.test(window.location.hostname)
}

/** Local storefront host suffix — lvh.me resolves to 127.0.0.1 and works with Google OAuth. */
const DEV_STOREFRONT_HOST_SUFFIX = 'lvh.me'
const DEV_STOREFRONT_PORT = 3001

export function platformStorefrontDevUrl(slug: string): string {
  const s = slug.trim().toLowerCase()
  return `http://${s}.${DEV_STOREFRONT_HOST_SUFFIX}:${DEV_STOREFRONT_PORT}`
}

export function platformStorefrontProdUrl(slug: string): string {
  const s = slug.trim().toLowerCase()
  return `https://${s}.profixer.app`
}

/**
 * Best URL to open/preview the storefront.
 * Verified primary custom domain wins, then any verified domain, else platform subdomain.
 */
export function pickStorefrontUrl(input: {
  slug: string
  domains?: StorefrontDomain[]
}): string {
  const { slug, domains = [] } = input
  const verifiedPrimary = domains.find((d) => d.verified && d.isPrimary)
  const verifiedFallback = domains.find((d) => d.verified)
  const custom = verifiedPrimary ?? verifiedFallback
  if (custom?.hostname) {
    return `https://${custom.hostname}`
  }
  return isLocalAdminHost() ? platformStorefrontDevUrl(slug) : platformStorefrontProdUrl(slug)
}

/** Fetches domain list and returns the best storefront URL for this tenant. */
export async function resolveStorefrontUrl(tenantId: string, slug: string): Promise<string> {
  try {
    const res = await storefrontDomainsService.list(tenantId)
    return pickStorefrontUrl({ slug, domains: res.data?.domains ?? [] })
  } catch {
    return pickStorefrontUrl({ slug })
  }
}
