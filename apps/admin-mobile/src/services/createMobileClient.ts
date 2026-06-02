import { createApiClient, createServices } from '@profixer/api-client'
import { AppConfig } from '@/config/env'
import { getSecureToken, getTenantId } from '@/services/auth/keychain'

let onUnauthorized: (() => void) | undefined

export function setApiUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export const api = createApiClient({
  baseURL: AppConfig.API_URL,
  getToken: getSecureToken,
  getTenantId: async () => {
    const stored = await getTenantId()
    if (stored) return stored
    return AppConfig.DEFAULT_TENANT_ID || null
  },
  tenantHeader: AppConfig.TENANT_HEADER,
  onUnauthorized: () => onUnauthorized?.(),
})

export const services = createServices(api)
export const AuthApi = services.auth
