import { headers } from 'next/headers'
import { resolveTenant } from './tenant-resolver'
import type { ResolvedTenant, VerticalKey } from './types'

/** Shared tenant loader for all vertical theme pages. */
export async function loadTenantFromRequest(): Promise<ResolvedTenant | null> {
  const h = await headers()
  const id = h.get('x-tenant-id')
  const slug = h.get('x-tenant-slug')
  const verticalKey = h.get('x-tenant-vertical') as VerticalKey | null
  const nameRaw = h.get('x-tenant-name')
  if (id && slug && verticalKey && nameRaw) {
    return {
      id,
      slug,
      name: decodeURIComponent(nameRaw),
      verticalKey,
      publicSiteTheme: null,
      matchedBy: 'platform_subdomain',
    }
  }
  return resolveTenant(h.get('host') ?? '')
}
