/** Shared resolver for home-services routes — keeps each page lean. */
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { resolveTenant } from '../../lib/tenant-resolver'
import type { ResolvedTenant, VerticalKey } from '../../lib/types'

export async function loadHomeServicesTenant(
  fallbackTagline = 'Trusted local pros, on demand.',
): Promise<ResolvedTenant & { fallbackTagline: string }> {
  const h = await headers()
  const id = h.get('x-tenant-id')
  const slug = h.get('x-tenant-slug')
  const verticalKey = h.get('x-tenant-vertical') as VerticalKey | null
  const nameRaw = h.get('x-tenant-name')

  let tenant: ResolvedTenant | null =
    id && slug && verticalKey && nameRaw
      ? {
          id,
          slug,
          name: decodeURIComponent(nameRaw),
          verticalKey,
          publicSiteTheme: null,
          matchedBy: 'platform_subdomain',
        }
      : await resolveTenant(h.get('host') ?? '')

  if (!tenant || tenant.verticalKey !== 'home_services') notFound()
  return { ...tenant, fallbackTagline }
}
