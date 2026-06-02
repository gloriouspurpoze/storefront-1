import type { LoginResponse } from '@profixer/api-client'
import { extractTenantFromAuthPayload, mapBackendUserToAppUser } from '@profixer/utils'
import type { AuthUser } from '@/types/auth'

export function mapLoginPayload(payload: LoginResponse & Record<string, unknown>): {
  user: AuthUser
  token: string
  refreshToken?: string
  tenantId?: string
} | null {
  const token =
    (payload.tokens as { accessToken?: string } | undefined)?.accessToken ??
    payload.token ??
    (payload as { access_token?: string }).access_token
  const refreshToken =
    (payload.tokens as { refreshToken?: string } | undefined)?.refreshToken ??
    payload.refreshToken ??
    (payload as { refresh_token?: string }).refresh_token

  if (!token) return null

  const rawUser = (payload.user ?? payload) as Record<string, unknown>
  const tenantRef = extractTenantFromAuthPayload(payload)
  const user = mapBackendUserToAppUser(rawUser, tenantRef)

  return {
    user,
    token: String(token),
    refreshToken: refreshToken ? String(refreshToken) : undefined,
    tenantId: tenantRef?.id,
  }
}
