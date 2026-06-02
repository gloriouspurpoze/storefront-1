import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { setTenantId } from '@/services/auth/keychain'

export interface TenantState {
  tenantId: string | null
}

const initialState: TenantState = {
  tenantId: null,
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenant: (state, action: PayloadAction<string | null>) => {
      state.tenantId = action.payload
      void setTenantId(action.payload)
    },
  },
})

export const { setTenant } = tenantSlice.actions
export default tenantSlice.reducer
