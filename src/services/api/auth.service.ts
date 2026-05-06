import { api } from './base'

// Types
export interface LoginRequest {
  /** Email address or dashboard username */
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
  // Backend may also return tokens in nested format
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

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginRequest) {
    return api.post<LoginResponse>('/auth/login', credentials, {
      loadingMessage: 'Signing you in...',
      successMessage: 'Welcome back! You have been successfully signed in.',
      errorMessage: 'Login failed. Please check your credentials.',
    })
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterRequest) {
    return api.post<LoginResponse>('/auth/register', userData, {
      loadingMessage: 'Creating your account...',
      successMessage: 'Account created successfully!',
      errorMessage: 'Registration failed. Please try again.',
    })
  }

  /**
   * Logout user
   */
  static async logout() {
    return api.post('/auth/logout', {}, {
      loadingMessage: 'Signing you out...',
      successMessage: 'You have been successfully signed out.',
      showLoading: false, // Don't show loading for logout
    })
  }

  /**
   * Refresh authentication token
   * DISABLED: Auto refresh token functionality (commented out for now)
   */
  /*
  static async refreshToken(refreshToken: string) {
    console.log('Refreshing token with refreshToken:', refreshToken)
    return api.post<LoginResponse>('/auth/refresh-token', { refreshToken }, {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: false,
    })
  }
  */

  /**
   * Get user profile
   */
  static async getProfile() {
    return api.get<LoginResponse['user']>('/auth/profile', {
      loadingMessage: 'Loading profile...',
      showSuccessToast: false,
    })
  }

  /**
   * Update user profile
   */
  static async updateProfile(userData: Partial<LoginResponse['user']>) {
    return api.put<LoginResponse['user']>('/auth/profile', userData, {
      loadingMessage: 'Updating profile...',
      successMessage: 'Profile updated successfully!',
      errorMessage: 'Failed to update profile.',
    })
  }

  /**
   * Change password
   */
  static async changePassword(passwords: ChangePasswordRequest) {
    return api.post('/auth/change-password', passwords, {
      loadingMessage: 'Changing password...',
      successMessage: 'Password changed successfully!',
      errorMessage: 'Failed to change password.',
    })
  }

  /**
   * Forgot password
   */
  static async forgotPassword(data: ForgotPasswordRequest) {
    return api.post('/auth/forgot-password', data, {
      loadingMessage: 'Sending reset email...',
      successMessage: 'Password reset email sent!',
      errorMessage: 'Failed to send reset email.',
    })
  }

  /**
   * Reset password
   */
  static async resetPassword(data: ResetPasswordRequest) {
    return api.post('/auth/reset-password', data, {
      showLoading: true,
      loadingMessage: 'Saving password…',
      successMessage: 'Password updated. You can sign in.',
      errorMessage: 'Could not update password.',
    })
  }
}
