import { createApiClient, createServices } from '@profixer/api-client'
import { AppConfig } from '@/config/env'
import { getSecureToken } from '@/services/auth/keychain'

let onUnauthorized: (() => void) | undefined
/** Wired in bootstrapApi — reads Redux `tenant.tenantId` (same as web admin api base). */
let resolveTenantIdFromStore: (() => string | null) | undefined

export function setApiUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function setTenantIdResolver(fn: () => string | null) {
  resolveTenantIdFromStore = fn
}

export const api = createApiClient({
  baseURL: AppConfig.API_URL,
  getToken: getSecureToken,
  getTenantId: async () => {
    const fromStore = resolveTenantIdFromStore?.() ?? null
    if (fromStore) return fromStore
    return AppConfig.DEFAULT_TENANT_ID || null
  },
  tenantHeader: AppConfig.TENANT_HEADER,
  onUnauthorized: () => onUnauthorized?.(),
})

export const services = createServices(api)
export const AuthApi = services.auth
