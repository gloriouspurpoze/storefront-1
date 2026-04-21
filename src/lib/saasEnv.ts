/**
 * SaaS / multi-tenant build-time configuration (Create React App: REACT_APP_*).
 * Backend should accept the same header name and enforce tenant isolation server-side.
 */

/** When true, the UI may show tenant-aware affordances (org switcher, billing nav, etc.). */
export const SAAS_MODE = process.env.REACT_APP_SAAS_MODE === 'true'

/** HTTP header sent on API calls when a tenant id is known (override if your API uses another name). */
export const TENANT_HEADER =
  (process.env.REACT_APP_TENANT_HEADER && process.env.REACT_APP_TENANT_HEADER.trim()) || 'X-Tenant-Id'

/**
 * Optional dev/default tenant UUID — only set in local `.env` for integration testing.
 * Production should rely on login/profile payload or explicit org selection.
 */
export function getDefaultTenantIdFromEnv(): string | null {
  const raw = process.env.REACT_APP_DEFAULT_TENANT_ID
  if (!raw || !String(raw).trim()) return null
  return String(raw).trim()
}
