import { api } from './base'
import { settingsService } from './settings.service'

export type IntegrationCheck = {
  id: string
  label: string
  description: string
  ok: boolean
  latencyMs: number | null
  /** Which path succeeded when multiple fallbacks were tried */
  endpointUsed?: string
  detail?: string
}

function apiBaseDisplay(): string {
  return (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

/**
 * Try GET paths in order; succeeds on first 2xx. Matches real backends where route sets differ.
 */
async function tryApiPaths(paths: string[]): Promise<
  { ok: true; ms: number; endpointUsed: string } | { ok: false; ms: number; detail: string }
> {
  let lastDetail = ''
  const startAll = performance.now()
  for (const path of paths) {
    const start = performance.now()
    try {
      await api.get<unknown>(path, {
        showLoading: false,
        showErrorToast: false,
        showSuccessToast: false,
      })
      return { ok: true, ms: Math.round(performance.now() - start), endpointUsed: path }
    } catch (e: unknown) {
      lastDetail = errMessage(e)
    }
  }
  return {
    ok: false,
    ms: Math.round(performance.now() - startAll),
    detail: lastDetail || 'All fallback endpoints failed',
  }
}

async function probeSettings(): Promise<
  { ok: true; ms: number; endpointUsed: string } | { ok: false; ms: number; detail: string }
> {
  const start = performance.now()
  const res = await settingsService.getSettings()
  if (res.success && res.data) {
    return { ok: true, ms: Math.round(performance.now() - start), endpointUsed: '/settings' }
  }
  const fallbacks = ['/settings/global', '/settings/client-controls']
  for (const path of fallbacks) {
    try {
      await api.get<unknown>(path, {
        showLoading: false,
        showErrorToast: false,
        showSuccessToast: false,
      })
      return { ok: true, ms: Math.round(performance.now() - start), endpointUsed: path }
    } catch (e: unknown) {
      /* try next */
    }
  }
  return {
    ok: false,
    ms: Math.round(performance.now() - start),
    detail: res.error || res.message || 'Settings endpoints unavailable',
  }
}

/**
 * Lightweight integration probes using the same auth + base URL as the rest of the admin app.
 * Uses fallbacks so checks stay green when the backend exposes alternate routes.
 */
export async function runIntegrationHealthChecks(): Promise<{
  apiBaseUrl: string
  checks: IntegrationCheck[]
  checkedAt: string
}> {
  const checkedAt = new Date().toISOString()
  const checks: IntegrationCheck[] = []

  const auth = await tryApiPaths(['/auth/profile', '/auth/me'])
  checks.push({
    id: 'auth',
    label: 'Authenticated API',
    description: 'Session token accepted (profile/me). Fails only when logged out or JWT invalid.',
    ok: auth.ok,
    latencyMs: auth.ms,
    endpointUsed: auth.ok ? auth.endpointUsed : undefined,
    detail: auth.ok ? undefined : auth.detail,
  })

  const dash = await tryApiPaths([
    '/dashboard/quick-stats',
    '/dashboard/admin',
    '/orders/dashboard?limit=1',
    '/orders/stats',
  ])
  checks.push({
    id: 'dashboard',
    label: 'Dashboard & operational data',
    description:
      'Tries quick-stats → admin dashboard → orders dashboard → order stats (whichever your API implements).',
    ok: dash.ok,
    latencyMs: dash.ms,
    endpointUsed: dash.ok ? dash.endpointUsed : undefined,
    detail: dash.ok ? undefined : dash.detail,
  })

  const settingsProbe = await probeSettings()
  checks.push({
    id: 'settings',
    label: 'Settings API',
    description: 'GET /settings, then /settings/global or /settings/client-controls.',
    ok: settingsProbe.ok,
    latencyMs: settingsProbe.ms,
    endpointUsed: settingsProbe.ok ? settingsProbe.endpointUsed : undefined,
    detail: settingsProbe.ok ? undefined : settingsProbe.detail,
  })

  const notif = await tryApiPaths([
    '/notifications/unread-count',
    '/notifications?page=1&limit=1',
  ])
  checks.push({
    id: 'notifications',
    label: 'Notifications API',
    description: 'Unread count or list endpoint — confirms notification routes are mounted.',
    ok: notif.ok,
    latencyMs: notif.ms,
    endpointUsed: notif.ok ? notif.endpointUsed : undefined,
    detail: notif.ok ? undefined : notif.detail,
  })

  return {
    apiBaseUrl: apiBaseDisplay(),
    checks,
    checkedAt,
  }
}

export const systemHealthMeta = {
  apiBaseDisplay,
}
