const STORAGE_KEY = 'fixer-admin:tenant-context:v3'

type StoredTenantContext = {
  tenantId: string
  verticalKey?: string
  featureModules?: string[] | null
  planKey?: string
  billingStatus?: string
}

function readAll(): Record<string, StoredTenantContext> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, StoredTenantContext>
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, StoredTenantContext>) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota */
  }
}

export function saveTenantContext(ctx: StoredTenantContext) {
  if (!ctx.tenantId) return
  const map = readAll()
  map[ctx.tenantId] = ctx
  writeAll(map)
}

export function loadTenantContext(tenantId: string | null): StoredTenantContext | null {
  if (!tenantId) return null
  return readAll()[tenantId] ?? null
}
