import { apiClient } from '../apiClient'

export interface ClientControlSettings {
  serviceRadius: number
  maxServicePrice: number
  responseTime: number
  serviceQuality: number
  availabilityHours: [number, number]
  notificationVolume: number
  autoAcceptThreshold: number
  priorityBoost: number
  signupEnabled?: boolean
  maintenanceMode?: boolean
  bookingEnabled?: boolean
  paymentGateway?: string
}

export interface GeneralSettings {
  businessName: string
  businessEmail: string
  businessPhone: string
  businessAddress: string
  timezone: string
  currency: string
  language: string
}

export interface SecuritySettings {
  twoFactorAuth: boolean
  sessionTimeout: number
  passwordExpiry: number
  loginAttempts: number
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  orderNotifications: boolean
  userNotifications: boolean
  systemNotifications: boolean
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  sidebarCollapsed: boolean
  compactMode: boolean
}

export interface Settings {
  id?: string
  userId?: string
  general: GeneralSettings
  security: SecuritySettings
  notifications: NotificationSettings
  appearance: AppearanceSettings
  clientControls: ClientControlSettings
  createdAt?: Date
  updatedAt?: Date
}

export interface SettingsUpdateRequest {
  general?: Partial<GeneralSettings>
  security?: Partial<SecuritySettings>
  notifications?: Partial<NotificationSettings>
  appearance?: Partial<AppearanceSettings>
  clientControls?: Partial<ClientControlSettings>
}

export interface SettingsResponse {
  success: boolean
  data?: Settings
  message?: string
  error?: string
}

export interface SettingsListResponse {
  success: boolean
  data?: Settings[]
  message?: string
  error?: string
}

class SettingsService {
  private baseUrl = '/api/settings'

  // Get settings (global or user-specific)
  async getSettings(userId?: string): Promise<SettingsResponse> {
    try {
      const params = userId ? { userId } : {}
      const response = await apiClient.get(this.baseUrl, { params })
      return response.data
    } catch (error: any) {
      console.error('Error getting settings:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get settings',
      }
    }
  }

  // Get global settings
  async getGlobalSettings(): Promise<SettingsResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/global`)
      return response.data
    } catch (error: any) {
      console.error('Error getting global settings:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get global settings',
      }
    }
  }

  // Update settings
  async updateSettings(
    settingsUpdate: SettingsUpdateRequest,
    userId?: string
  ): Promise<SettingsResponse> {
    try {
      const params = userId ? { userId } : {}
      const response = await apiClient.put(this.baseUrl, settingsUpdate, { params })
      return response.data
    } catch (error: any) {
      console.error('Error updating settings:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update settings',
      }
    }
  }

  // Reset settings to defaults
  async resetToDefaults(userId?: string): Promise<SettingsResponse> {
    try {
      const params = userId ? { userId } : {}
      const response = await apiClient.post(`${this.baseUrl}/reset`, {}, { params })
      return response.data
    } catch (error: any) {
      console.error('Error resetting settings:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reset settings',
      }
    }
  }

  // Get all settings (admin only)
  async getAllSettings(): Promise<SettingsListResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/all`)
      return response.data
    } catch (error: any) {
      console.error('Error getting all settings:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get all settings',
      }
    }
  }

  // Delete settings
  async deleteSettings(userId?: string): Promise<SettingsResponse> {
    try {
      const params = userId ? { userId } : {}
      const response = await apiClient.delete(this.baseUrl, { params })
      return response.data
    } catch (error: any) {
      console.error('Error deleting settings:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete settings',
      }
    }
  }

  // Get client control settings specifically
  async getClientControls(userId?: string): Promise<SettingsResponse> {
    try {
      const url = userId 
        ? `${this.baseUrl}/client-controls?userId=${userId}` 
        : `${this.baseUrl}/client-controls`
      const response: any = await apiClient.get(url)
      return response.data || response
    } catch (error: any) {
      console.error('Error getting client controls:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get client controls',
      }
    }
  }

  // Update client control settings specifically
  async updateClientControls(
    clientControls: Partial<ClientControlSettings>,
    userId?: string
  ): Promise<SettingsResponse> {
    try {
      const url = userId 
        ? `${this.baseUrl}/client-controls?userId=${userId}` 
        : `${this.baseUrl}/client-controls`
      const response: any = await apiClient.put(url, clientControls)
      return response.data || response
    } catch (error: any) {
      console.error('Error updating client controls:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update client controls',
      }
    }
  }
}

export const settingsService = new SettingsService()
export default settingsService
