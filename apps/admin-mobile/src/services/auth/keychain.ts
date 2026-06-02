import * as Keychain from 'react-native-keychain'

const TOKEN_SERVICE = 'profixer_admin_access_token'
const REFRESH_SERVICE = 'profixer_admin_refresh_token'
const TENANT_SERVICE = 'profixer_admin_tenant_id'

async function readSecret(service: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service })
    if (credentials && typeof credentials !== 'boolean') {
      return credentials.password || null
    }
    return null
  } catch {
    return null
  }
}

async function writeSecret(service: string, value: string | null): Promise<void> {
  if (!value) {
    await Keychain.resetGenericPassword({ service })
    return
  }
  // Username is required by the API but unused for token-only storage.
  await Keychain.setGenericPassword('profixer', value, {
    service,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  })
}

export const getSecureToken = () => readSecret(TOKEN_SERVICE)
export const setSecureToken = (token: string | null) => writeSecret(TOKEN_SERVICE, token)

export const getRefreshToken = () => readSecret(REFRESH_SERVICE)
export const setRefreshToken = (token: string | null) => writeSecret(REFRESH_SERVICE, token)

export const getTenantId = () => readSecret(TENANT_SERVICE)
export const setTenantId = (tenantId: string | null) => writeSecret(TENANT_SERVICE, tenantId)

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([
    Keychain.resetGenericPassword({ service: TOKEN_SERVICE }),
    Keychain.resetGenericPassword({ service: REFRESH_SERVICE }),
    Keychain.resetGenericPassword({ service: TENANT_SERVICE }),
  ])
}
