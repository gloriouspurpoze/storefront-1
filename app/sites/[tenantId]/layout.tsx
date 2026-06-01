import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { resolveTenant } from '@/lib/tenant-resolver'
import type { ResolvedTenant } from '@/lib/types'

interface RouteParams {
  params: Promise<{ tenantId: string }>
}

/**
 * Reads tenant info from the headers stamped by `middleware.ts`. Falls back to
 * a fresh resolve in case the request bypassed middleware (e.g. dev-time
 * direct hit to `/_sites/<id>` — useful for previews).
 */
async function getTenant(): Promise<ResolvedTenant | null> {
  const h = await headers()
  const host = h.get('host') ?? ''
  // Trust middleware-stamped headers first (it already resolved + cached).
  const id = h.get('x-tenant-id')
  const slug = h.get('x-tenant-slug')
  const verticalKey = h.get('x-tenant-vertical') as ResolvedTenant['verticalKey'] | null
  const nameRaw = h.get('x-tenant-name')
  if (id && slug && verticalKey && nameRaw) {
    return {
      id,
      slug,
      name: decodeURIComponent(nameRaw),
      verticalKey,
      publicSiteTheme: null, // theme isn't worth stuffing into headers; resolved fresh below if needed
      matchedBy: 'platform_subdomain',
    }
  }
  // Fallback: full resolve.
  return resolveTenant(host)
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  void params
  const tenant = await getTenant()
  if (!tenant) return { title: 'Site not found' }
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: `Welcome to ${tenant.name} — powered by Profixer.`,
    openGraph: {
      title: tenant.name,
      description: `Welcome to ${tenant.name}.`,
      type: 'website',
    },
    robots: { index: true, follow: true },
  }
}

/**
 * Injects per-tenant brand color into a CSS custom property so any descendant
 * can use `var(--site-brand)` for theming.
 */
function brandStyle(tenant: ResolvedTenant): React.CSSProperties {
  const brand = (tenant.publicSiteTheme?.brandColor as string | undefined) || '#0f172a'
  return { ['--site-brand' as never]: brand }
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ tenantId: string }>
}) {
  void params
  const tenant = await getTenant()
  if (!tenant) notFound()
  return (
    <div className="min-h-screen" style={brandStyle(tenant)} data-tenant={tenant.slug}>
      {children}
    </div>
  )
}
