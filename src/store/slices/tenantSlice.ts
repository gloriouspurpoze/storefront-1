import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getDefaultTenantIdFromEnv, SAAS_MODE } from '../../lib/saasEnv'
import { extractTenantFromAuthPayload } from '../../lib/extractTenantFromAuth'
import { loginUser, registerUser, getUserProfile, logoutUser, logout } from './authSlice'
import { DEFAULT_VERTICAL_KEY, normalizeVerticalKey, type VerticalKey } from '../../verticals/core/types'
import { loadTenantContext, saveTenantContext } from '../../lib/tenantContextStorage'

export interface TenantState {
  /** Build flag: multi-tenant product behavior */
  saasMode: boolean
  /** Active organization / tenant for API isolation */
  tenantId: string | null
  name: string | null
  slug: string | null
  /** Industry vertical pack for sidebar + domain labels */
  verticalKey: VerticalKey
  /** Cached org module allowlist (null = full access) */
  featureModules: string[] | null
  planKey: string | null
  billingStatus: string | null
}

const envDefault = getDefaultTenantIdFromEnv()

const initialState: TenantState = {
  saasMode: SAAS_MODE,
  tenantId: envDefault,
  name: null,
  slug: null,
  verticalKey: DEFAULT_VERTICAL_KEY,
  featureModules: null,
  planKey: null,
  billingStatus: null,
}

function applyTenantRef(
  state: TenantState,
  ref: {
    id: string
    name?: string
    slug?: string
    verticalKey?: string
    featureModules?: string[] | null
    planKey?: string
    billingStatus?: string
  } | null,
) {
  if (!ref) return
  state.tenantId = ref.id
  state.name = ref.name ?? null
  state.slug = ref.slug ?? null

  const cached = loadTenantContext(ref.id)
  const verticalKey = ref.verticalKey ?? cached?.verticalKey
  if (verticalKey) state.verticalKey = normalizeVerticalKey(verticalKey)

  if (ref.featureModules !== undefined) {
    state.featureModules = ref.featureModules
  } else if (cached?.featureModules !== undefined) {
    state.featureModules = cached.featureModules
  }

  const planKey = ref.planKey ?? cached?.planKey
  if (planKey) state.planKey = planKey

  const billingStatus = ref.billingStatus ?? cached?.billingStatus
  if (billingStatus) state.billingStatus = billingStatus

  saveTenantContext({
    tenantId: ref.id,
    verticalKey: state.verticalKey,
    featureModules: state.featureModules,
    planKey: state.planKey ?? undefined,
    billingStatus: state.billingStatus ?? undefined,
  })
}

const resetState = (): TenantState => ({
  ...initialState,
  saasMode: SAAS_MODE,
  tenantId: envDefault,
  name: null,
  slug: null,
  verticalKey: DEFAULT_VERTICAL_KEY,
  featureModules: null,
  planKey: null,
  billingStatus: null,
})

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (
      state,
      action: PayloadAction<{
        id: string
        name?: string
        slug?: string
        verticalKey?: string
        featureModules?: string[] | null
        planKey?: string
        billingStatus?: string
      }>,
    ) => {
      applyTenantRef(state, action.payload)
    },
    setVerticalKey: (state, action: PayloadAction<VerticalKey>) => {
      state.verticalKey = action.payload
    },
    setFeatureModules: (state, action: PayloadAction<string[] | null>) => {
      state.featureModules = action.payload
    },
    clearTenant: (state) => {
      state.tenantId = envDefault
      state.name = null
      state.slug = null
      state.verticalKey = DEFAULT_VERTICAL_KEY
      state.featureModules = null
      state.planKey = null
      state.billingStatus = null
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
      .addCase(logout, () => resetState())
      .addCase(logoutUser.fulfilled, () => resetState())
  },
})

export const { setTenant, clearTenant, setVerticalKey, setFeatureModules } = tenantSlice.actions
export default tenantSlice.reducer
