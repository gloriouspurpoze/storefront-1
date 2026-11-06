import type { Metadata } from 'next'
import { env } from './env'
import { withTenantId } from './tenant-headers'
import { fetchStorefrontConfig } from './storefront-api'

/**
 * Admin → SEO → "Page titles" entry for one exact public path of a tenant storefront
 * (`/`, `/menu`, `/products/classic-og-nyc-cookie`). Missing or inactive → the page keeps
 * its built-in metadata.
 */
export type TenantSeoOverride = {
  title?: string
  description?: string
  ogImage?: string
  canonical?: string
  noindex: boolean
}

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

export async function fetchTenantSeoOverride(tenantId: string, path: string): Promise<TenantSeoOverride | null> {
  if (!tenantId || !path) return null
  try {
    const res = await fetch(`${env.API_BASE_URL.replace(/\/+$/, '')}/cms/seo/${encodeURIComponent(path)}`, {
      headers: withTenantId(tenantId, { Accept: 'application/json' }),
      next: { revalidate: 120, tags: [`tenant:${tenantId}`, `tenant:${tenantId}:seo`] },
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as { data?: Record<string, unknown> | null } | null
    const row = json?.data
    if (!row || row.isActive === false) return null
    const ogImage = text(row.ogImage)
    const canonical = text(row.canonicalUrl) ?? text(row.canonical)
    return {
      title: text(row.title),
      description: text(row.description),
      ogImage: ogImage && /^https:\/\//i.test(ogImage) ? ogImage : undefined,
      canonical: canonical && /^https?:\/\//i.test(canonical) ? canonical : undefined,
      noindex: typeof row.robots === 'string' && /noindex/i.test(row.robots),
    }
  } catch {
    return null
  }
}

/** Layer the tenant's Page-titles override (if any) on top of a page's built-in metadata. */
export async function withTenantSeoOverride(
  tenantId: string,
  path: string,
  base: Metadata,
): Promise<Metadata> {
  const o = await fetchTenantSeoOverride(tenantId, path)
  if (!o) return base
  const next: Metadata = { ...base }
  if (o.title) next.title = { absolute: o.title }
  if (o.description) next.description = o.description
  if (o.title || o.description || o.ogImage) {
    next.openGraph = {
      ...(base.openGraph ?? {}),
      ...(o.title ? { title: o.title } : {}),
      ...(o.description ? { description: o.description } : {}),
      ...(o.ogImage ? { images: [{ url: o.ogImage }] } : {}),
    }
  }
  if (o.canonical) next.alternates = { ...(base.alternates ?? {}), canonical: o.canonical }
  if (o.noindex) next.robots = { index: false, follow: true }
  return next
}

type SeoRouteProps = { params?: Promise<Record<string, string | string[] | undefined>> }

/**
 * Wrap a tenant page's `generateMetadata` so Page-titles overrides apply to its public path.
 * `toPath` maps route params to the storefront path (`(p) => \`/products/${p.slug}\``).
 */
export function seoOverridable<P extends SeoRouteProps>(
  toPath: (params: Record<string, string>) => string,
  base: (props: P) => Promise<Metadata> | Metadata,
) {
  return async function generateMetadata(props: P): Promise<Metadata> {
    const raw = ((await props?.params) ?? {}) as Record<string, string | string[] | undefined>
    const params = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : (v ?? '')]),
    ) as Record<string, string>
    const metadata = await base(props)
    if (!params.tenantId) return metadata
    const withOverride = await withTenantSeoOverride(params.tenantId, toPath(params), metadata)
    return withDefaultShareImage(params.tenantId, withOverride)
  }
}

/**
 * A page-level `openGraph` replaces the layout's (Next does not merge it), so pages that set their
 * own lose the site share image. Fill it from Studio SEO → branding logo when the page has none.
 */
export async function withDefaultShareImage(tenantId: string, metadata: Metadata): Promise<Metadata> {
  if (!metadata.openGraph || metadata.openGraph.images) return metadata
  const cfg = await fetchStorefrontConfig(tenantId).catch(() => null)
  const image = cfg?.seo?.ogImageUrl || cfg?.branding?.logoUrl
  if (!image) return metadata
  return { ...metadata, openGraph: { ...metadata.openGraph, images: [{ url: image }] } }
}
