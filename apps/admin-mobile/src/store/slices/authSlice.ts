import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/types/auth'
import { mapLoginPayload } from '@/lib/mapLoginPayload'
import { AuthApi } from '@/services/createMobileClient'
import { setTenant } from '@/store/slices/tenantSlice'
import {
  clearAuthStorage,
  setRefreshToken,
  setSecureToken,
  setTenantId,
} from '@/services/auth/keychain'

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

function loginErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message)
    if (msg.trim()) return msg
  }
  if (err instanceof Error && err.message.trim()) {
    if (/JSON Parse|Unexpected end of input/i.test(err.message)) {
      return 'Could not reach the server. Check API_URL in apps/admin-mobile/.env and that the backend is running.'
    }
    return err.message
  }
  return 'Login failed. Check your credentials and try again.'
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await AuthApi.login(credentials)
      const mapped = mapLoginPayload(response.data as never)
      if (mapped?.tenantId) {
        dispatch(setTenant(mapped.tenantId))
      }
      return response.data
    } catch (err) {
      return rejectWithValue(loginErrorMessage(err))
    }
  },
)

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await AuthApi.logout()
  } catch {
    /* offline logout */
  }
  await clearAuthStorage()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string; tenantId?: string }>,
    ) => {
      state.user = action.payload.user
      state.isAuthenticated = true
      state.error = null
      void setSecureToken(action.payload.token)
      if (action.payload.refreshToken) void setRefreshToken(action.payload.refreshToken)
      if (action.payload.tenantId) void setTenantId(action.payload.tenantId)
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      void clearAuthStorage()
    },
    clearAuthError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        const mapped = mapLoginPayload(action.payload as never)
        if (!mapped) {
          state.error = 'Invalid login response'
          return
        }
        state.user = mapped.user
        state.isAuthenticated = true
        void setSecureToken(mapped.token)
        if (mapped.refreshToken) void setRefreshToken(mapped.refreshToken)
        if (mapped.tenantId) {
          void setTenantId(mapped.tenantId)
          // tenant slice updated via extra reducer below when rehydrated from login
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error =
          (typeof action.payload === 'string' ? action.payload : null) ??
          action.error.message ??
          'Login failed'
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { setCredentials, logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
