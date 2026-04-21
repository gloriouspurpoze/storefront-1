import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getDefaultTenantIdFromEnv, SAAS_MODE } from '../../lib/saasEnv'
import { extractTenantFromAuthPayload } from '../../lib/extractTenantFromAuth'
import { loginUser, registerUser, getUserProfile, logoutUser, logout } from './authSlice'

export interface TenantState {
  /** Build flag: multi-tenant product behavior */
  saasMode: boolean
  /** Active organization / tenant for API isolation */
  tenantId: string | null
  name: string | null
  slug: string | null
}

const envDefault = getDefaultTenantIdFromEnv()

const initialState: TenantState = {
  saasMode: SAAS_MODE,
  tenantId: envDefault,
  name: null,
  slug: null,
}

function applyTenantRef(
  state: TenantState,
  ref: { id: string; name?: string; slug?: string } | null
) {
  if (!ref) return
  state.tenantId = ref.id
  state.name = ref.name ?? null
  state.slug = ref.slug ?? null
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (
      state,
      action: PayloadAction<{ id: string; name?: string; slug?: string }>
    ) => {
      applyTenantRef(state, action.payload)
    },
    clearTenant: (state) => {
      state.tenantId = envDefault
      state.name = null
      state.slug = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        const ref = extractTenantFromAuthPayload(action.payload)
        if (ref) applyTenantRef(state, ref)
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const ref = extractTenantFromAuthPayload(action.payload)
        if (ref) applyTenantRef(state, ref)
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        const ref = extractTenantFromAuthPayload({ user: action.payload })
        if (ref) applyTenantRef(state, ref)
      })
      .addCase(logout, () => ({
        ...initialState,
        saasMode: SAAS_MODE,
        tenantId: envDefault,
        name: null,
        slug: null,
      }))
      .addCase(logoutUser.fulfilled, () => ({
        ...initialState,
        saasMode: SAAS_MODE,
        tenantId: envDefault,
        name: null,
        slug: null,
      }))
  },
})

export const { setTenant, clearTenant } = tenantSlice.actions
export default tenantSlice.reducer
