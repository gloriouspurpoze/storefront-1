/** Canonical tenant header — matches fixer-backend `requirePublicTenantContext`. */
export const TENANT_HEADER = 'x-tenant-id' as const

/** Merge tenant scope into fetch/request headers (case-insensitive on the wire). */
export function withTenantId(
  tenantId: string,
  headers: Record<string, string> = {},
): Record<string, string> {
  const id = tenantId?.trim()
  if (!id) return headers
  return { ...headers, [TENANT_HEADER]: id }
}
