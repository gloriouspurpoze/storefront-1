import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { AuthService } from '../../services/api'
import type { User } from '../../types'
import { extractTenantFromAuthPayload } from '../../lib/extractTenantFromAuth'
import { mapBackendUserToAppUser } from '../../lib/mapBackendUser'

/**
 * Minimum client session length (persisted Redux `tokenExpiry`). Matches the
 * backend access-token TTL (`JWT_ACCESS_TOKEN_EXPIRATION = 30d`) so the admin
 * stays logged in until they explicitly log out (or a real 401), and never gets
 * dropped mid-shift — otherwise admins miss new bookings/orders.
 */
const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Resolves when the client treats the session as expired (`tokenExpiry`).
 * - If JWT `exp` is **shorter than 30d** from now, we still use **30d** so the admin UI does not drop the session early.
 * - If JWT `exp` is **already past**, we keep that time (session is expired).
 * - If JWT `exp` is **longer** than 30d (e.g. long-lived token), we use JWT `exp`.
 * API requests still fail with 401 when the real JWT expires unless the backend also issues 30d access tokens.
 */
function resolveTokenExpiryMs(accessToken: string | null | undefined): number {
  const sessionEnd = Date.now() + ACCESS_TOKEN_TTL_MS
  if (!accessToken) return sessionEnd
  try {
    const seg = accessToken.split('.')[1]
    if (!seg) return sessionEnd
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    const payload = JSON.parse(json) as { exp?: number }
    if (typeof payload.exp !== 'number') return sessionEnd
    const jwtMs = payload.exp * 1000
    if (jwtMs <= Date.now()) return jwtMs
    if (jwtMs < sessionEnd) return sessionEnd
    return jwtMs
  } catch {
    return sessionEnd
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  refreshToken: string | null
  tokenExpiry: number | null
  error: string | null
  lastLogin: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,
  refreshToken: null,
  tokenExpiry: null,
  error: null,
  lastLogin: null,
}

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    const response = await AuthService.login(credentials)
    return response.data
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: any) => {
    const response = await AuthService.register(userData)
    return response.data
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await AuthService.logout()
  }
)

// DISABLED: Auto refresh token functionality (commented out for now)
/*
export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string) => {
    const response = await AuthService.refreshToken(refreshToken)
    console.log('Refresh Token Response:', response)
    return response.data
  }
)
*/

export const getUserProfile = createAsyncThunk(
  'auth/getProfile',
  async () => {
    const response = await AuthService.getProfile()
    return response.data
  }
)

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: any) => {
    const response = await AuthService.updateProfile(userData)
    return response.data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken || null
      state.isAuthenticated = true
      state.error = null
      state.lastLogin = new Date().toISOString()
      
      if (action.payload.token) {
        state.tokenExpiry = resolveTokenExpiryMs(action.payload.token)
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.tokenExpiry = null
      state.error = null
      state.lastLogin = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action: PayloadAction<any>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.tokenExpiry = resolveTokenExpiryMs(action.payload.token)
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        
        // Transform backend response (snake_case) to frontend format (camelCase)
        const backendUser = action.payload.user as any
        const tenantRef = extractTenantFromAuthPayload(action.payload)
        state.user = mapBackendUserToAppUser(backendUser, tenantRef)
        
        // Handle tokens from nested tokens object
        const accessToken = action.payload.tokens?.accessToken || action.payload.token
        state.token = accessToken
        state.refreshToken = action.payload.tokens?.refreshToken || action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
        state.lastLogin = new Date().toISOString()
        state.tokenExpiry = resolveTokenExpiryMs(accessToken)

        if (state.user) {
          console.log('✅ Auth State Updated:', {
            userType: state.user.userType,
            email: state.user.email,
            isAuthenticated: state.isAuthenticated
          })
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        
        // Transform backend response (snake_case) to frontend format (camelCase)
        const backendUser = action.payload.user as any
        const tenantRef = extractTenantFromAuthPayload(action.payload)
        state.user = mapBackendUserToAppUser(backendUser, tenantRef)
        
        // Handle tokens from nested tokens object
        const accessToken = action.payload.tokens?.accessToken || action.payload.token
        state.token = accessToken
        state.refreshToken = action.payload.tokens?.refreshToken || action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
        state.lastLogin = new Date().toISOString()
        state.tokenExpiry = resolveTokenExpiryMs(accessToken)
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Registration failed'
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.tokenExpiry = null
        state.error = null
        state.lastLogin = null
      })
      
      // DISABLED: Auto refresh token functionality (commented out for now)
      /*
      // Refresh token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        const accessToken = action.payload.tokens?.accessToken || action.payload.token
        state.token = accessToken
        state.tokenExpiry = resolveTokenExpiryMs(accessToken)
      })
      */
      
      // Get profile
      .addCase(getUserProfile.fulfilled, (state, action) => {
        const backendUser = action.payload as any
        const tenantRef =
          extractTenantFromAuthPayload({ user: action.payload }) ||
          extractTenantFromAuthPayload(action.payload)
        state.user = mapBackendUserToAppUser(backendUser, tenantRef)
      })
      
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        const backendUser = action.payload as any
        const tenantRef =
          extractTenantFromAuthPayload({ user: action.payload }) ||
          extractTenantFromAuthPayload(action.payload)
        state.user = mapBackendUserToAppUser(backendUser, tenantRef)
      })
  },
})

export const { 
  setCredentials, 
  logout, 
  clearError, 
  updateUser, 
  setTokens 
} = authSlice.actions
export default authSlice.reducer
