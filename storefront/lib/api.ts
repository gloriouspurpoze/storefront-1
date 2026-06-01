/**
 * Minimal typed client for the **public** endpoints on fixer-backend.
 *
 * - No JWT is attached. The storefront is anonymous.
 * - Errors return `null` rather than throwing so callers can short-circuit to
 *   a 404 page without try/catch noise.
 * - All requests carry a short revalidate window so RSC caches them between
 *   tenants instead of hammering the backend.
 */
import { env } from './env'
import type { ResolvedTenant } from './types'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
}

interface ResolvePublicResponse {
  id?: string
  tenantId?: string
  slug: string
  name?: string
  verticalKey?: ResolvedTenant['verticalKey']
  publicSiteTheme?: ResolvedTenant['publicSiteTheme']
  matchedBy?: ResolvedTenant['matchedBy']
}

const RESOLVE_REVALIDATE_SECONDS = 60

export async function resolveTenantViaApi(host: string): Promise<ResolvedTenant | null> {
  if (!host) return null
  const url = new URL(`${env.API_BASE_URL.replace(/\/+$/, '')}/platform/tenants/resolve`)
  url.searchParams.set('host', host)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: RESOLVE_REVALIDATE_SECONDS, tags: [`host:${host}`] },
    })
  } catch {
    // Backend unreachable — treat as unresolved; surface a friendly 404 page.
    return null
  }

  if (res.status === 404) return null
  if (!res.ok) {
    // 5xx — log and return null so the page can render an "outage" notice.
    console.error('[storefront] resolve API failed', host, res.status)
    return null
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<ResolvePublicResponse> | null
  const data = json?.data
  if (!json?.success || !data) return null

  const id = data.id ?? data.tenantId
  if (!id || !data.slug) return null

  // The backward-compat envelope from the legacy resolver only returns
  // `{ tenantId, slug }`. When that happens we synthesize sensible defaults.
  return {
    id,
    slug: data.slug,
    name: data.name ?? data.slug,
    verticalKey: data.verticalKey ?? 'home_services',
    publicSiteTheme: data.publicSiteTheme ?? null,
    matchedBy: data.matchedBy ?? 'platform_subdomain',
  }
}
