/**
 * Host → tenant resolution for the multi-tenant storefront.
 *
 * Cascade:
 *   1. **Edge Config** (`EDGE_CONFIG` env). 1–5 ms reads at the edge — preferred
 *      in production. Skipped automatically if `@vercel/edge-config` is not
 *      installed or `EDGE_CONFIG` is unset.
 *   2. **API fallback** — calls `fixer-backend/api/platform/tenants/resolve`.
 *      Used in dev and as a cache-miss path. Response cached via Next's
 *      `fetch({ next: { revalidate, tags } })` machinery.
 *
 * Important: middleware can't directly read this module's heavy deps, so the
 * Edge Config branch is dynamically imported. If you are running on the Node
 * runtime (Phase 0 default) this whole file is fine; on the Edge runtime,
 * keep the deps thin.
 */
import { env } from './env'
import { resolveTenantViaApi } from './api'
import type { ResolvedTenant } from './types'

/** Strip port + `www.` from a Host header value. */
function stripPortAndWww(host: string): string {
  const noPort = host.split(':')[0] ?? ''
  return noPort.startsWith('www.') ? noPort.slice(4) : noPort
}

/** Extract a slug from a `*.<platform-suffix>` host, or `null`. */
export function slugFromPlatformHost(host: string): string | null {
  const clean = stripPortAndWww(host.toLowerCase())
  for (const suffix of env.HOST_SUFFIXES) {
    if (clean === suffix) return null
    const dotSuffix = `.${suffix}`
    if (clean.endsWith(dotSuffix)) {
      const sub = clean.slice(0, -dotSuffix.length)
      if (!sub || sub.includes('.')) return null
      return /^[a-z0-9][a-z0-9-]{1,62}$/.test(sub) ? sub : null
    }
  }
  return null
}

interface EdgeConfigEntry {
  id: string
  slug: string
  name: string
  verticalKey: ResolvedTenant['verticalKey']
  publicSiteTheme?: ResolvedTenant['publicSiteTheme']
  matchedBy?: ResolvedTenant['matchedBy']
}

async function resolveViaEdgeConfig(host: string): Promise<ResolvedTenant | null> {
  if (!env.EDGE_CONFIG) return null
  try {
    // Dynamic import so the storefront still builds without the dep installed.
    // The `@vercel/edge-config` package is an *optional* runtime dep — install
    // it on Vercel deployments where `EDGE_CONFIG` is configured.
    // @ts-expect-error optional peer dep, not bundled by default
    const mod = (await import(/* webpackIgnore: true */ '@vercel/edge-config').catch(
      () => null,
    )) as { get?: (key: string) => Promise<EdgeConfigEntry | undefined> } | null
    if (!mod?.get) return null
    const key = `tenant:${host}`
    const hit = await mod.get(key)
    if (!hit?.id || !hit?.slug) return null
    return {
      id: hit.id,
      slug: hit.slug,
      name: hit.name ?? hit.slug,
      verticalKey: hit.verticalKey ?? 'home_services',
      publicSiteTheme: hit.publicSiteTheme ?? null,
      matchedBy: hit.matchedBy ?? 'custom_domain',
    }
  } catch (e) {
    console.error('[storefront] edge-config lookup failed', e)
    return null
  }
}

/**
 * Public entry point used by middleware and pages.
 *
 * Returns the resolved tenant or `null` if the host is unrecognized,
 * suspended, or inactive. Callers should render their own 404 on `null`.
 */
export async function resolveTenant(host: string): Promise<ResolvedTenant | null> {
  if (!host) return null
  const clean = stripPortAndWww(host.toLowerCase())
  console.log('clean', clean)
  const edge = await resolveViaEdgeConfig(clean)
  console.log('edge', edge)
  if (edge) return edge
  console.log('resolveTenantViaApi', clean)
  return resolveTenantViaApi(clean)
}
