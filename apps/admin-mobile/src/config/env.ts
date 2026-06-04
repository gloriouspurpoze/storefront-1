import { Platform } from 'react-native'

/**
 * Env access for the mobile app.
 *
 * Primary source: `react-native-config` (reads `apps/admin-mobile/.env` at
 * native build time). Falls back to defaults. Never throws.
 */

let nativeConfig: Record<string, string | undefined> | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const mod = require('react-native-config')
  const candidate = (mod && (mod.default ?? mod)) as Record<string, string | undefined> | null
  nativeConfig = candidate ?? null
} catch (err) {
  console.warn('[env] react-native-config not available:', err)
  nativeConfig = null
}

function read(key: string, fallback = ''): string {
  try {
    const fromConfig = nativeConfig?.[key]
    if (fromConfig && String(fromConfig).trim()) return String(fromConfig).trim()
  } catch {
    /* Config proxy can throw if native module is null */
  }
  const fromProcess = process.env[key]
  if (fromProcess && fromProcess.trim()) return fromProcess.trim()
  return fallback
}

/** Same default as web admin `.env` (fixer-backend on port 8005). */
const defaultApiUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8005/api'
    : 'http://localhost:8005/api'

/**
 * On Android emulator, `localhost` is the emulator itself — not your Mac.
 * Rewrite so login hits the host machine where the API runs.
 */
function resolveApiUrl(): string {
  let url = read('API_URL', defaultApiUrl)
  if (Platform.OS === 'android' && /localhost|127\.0\.0\.1/i.test(url)) {
    const fixed = url.replace(/localhost|127\.0\.0\.1/gi, '10.0.2.2')
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[env] API_URL was "${url}" — using "${fixed}" on Android emulator`)
    }
    url = fixed
  }
  return url.replace(/\/$/, '')
}

const apiUrl = resolveApiUrl()

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log(`[env] API_URL → ${apiUrl}`)
}

/** Same org default as web admin (`REACT_APP_DEFAULT_TENANT_ID` in root `.env`). */
const defaultTenantId =
  read('DEFAULT_TENANT_ID') || read('REACT_APP_DEFAULT_TENANT_ID') || ''

export const AppConfig = {
  API_URL: apiUrl,
  ONESIGNAL_APP_ID: read('ONESIGNAL_APP_ID'),
  GOOGLE_MAPS_API_KEY: read('GOOGLE_MAPS_API_KEY'),
  SAAS_MODE: read('SAAS_MODE') === 'true',
  TENANT_HEADER: read('TENANT_HEADER', 'X-Tenant-Id'),
  DEFAULT_TENANT_ID: defaultTenantId,
} as const

/** @deprecated kept for older imports — use `AppConfig` */
export { AppConfig as Config }
