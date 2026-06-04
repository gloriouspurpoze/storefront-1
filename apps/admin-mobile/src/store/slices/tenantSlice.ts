import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { extractTenantFromAuthPayload } from '@profixer/utils'
import { AppConfig } from '@/config/env'
import { setTenantId } from '@/services/auth/keychain'

export interface TenantState {
  tenantId: string | null
}

/** Mirror web admin `tenantSlice` — boot with env default so API calls scope correctly. */
const envDefault = AppConfig.DEFAULT_TENANT_ID || null

const initialState: TenantState = {
  tenantId: envDefault,
}

function syncTenantKeychain(tenantId: string | null) {
  void setTenantId(tenantId)
}

function applyLoginTenant(state: TenantState, payload: unknown) {
  const ref = extractTenantFromAuthPayload(payload)
  if (ref) {
    state.tenantId = ref.id
    syncTenantKeychain(ref.id)
    return
  }
  // Drop stale org from a prior session (common super_admin gotcha).
  state.tenantId = envDefault
  syncTenantKeychain(envDefault)
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (state, action: PayloadAction<string | null>) => {
      state.tenantId = action.payload
      syncTenantKeychain(action.payload)
    },
    clearTenant: (state) => {
      state.tenantId = envDefault
      syncTenantKeychain(envDefault)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('auth/loginUser/fulfilled', (state, action) => {
        applyLoginTenant(state, action.payload)
      })
      .addCase('auth/logout', () => {
        syncTenantKeychain(envDefault)
        return { tenantId: envDefault }
      })
      .addCase('auth/logoutUser/fulfilled', () => {
        syncTenantKeychain(envDefault)
        return { tenantId: envDefault }
      })
  },
})

export const { setTenant, clearTenant } = tenantSlice.actions
export default tenantSlice.reducer
