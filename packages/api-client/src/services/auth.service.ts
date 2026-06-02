import type { ApiClient } from '../types'

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: 'admin' | 'user'
    avatar?: string
  }
  token: string
  refreshToken: string
  tokens?: {
    accessToken: string
    refreshToken: string
  }
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  businessName?: string
  location?: string
  userType?: 'customer' | 'provider' | 'admin'
  agreeToMarketing?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export function createAuthService(api: ApiClient) {
  return {
    login: (credentials: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', credentials),
    register: (userData: RegisterRequest) =>
      api.post<LoginResponse>('/auth/register', userData),
    logout: () => api.post('/auth/logout', {}),
    getProfile: () => api.get<LoginResponse['user']>('/auth/profile'),
    updateProfile: (userData: Partial<LoginResponse['user']>) =>
      api.put<LoginResponse['user']>('/auth/profile', userData),
    changePassword: (passwords: ChangePasswordRequest) =>
      api.post('/auth/change-password', passwords),
    forgotPassword: (data: ForgotPasswordRequest) =>
      api.post('/auth/forgot-password', data),
    resetPassword: (data: ResetPasswordRequest) =>
      api.post('/auth/reset-password', data),
  }
}

export type AuthService = ReturnType<typeof createAuthService>
