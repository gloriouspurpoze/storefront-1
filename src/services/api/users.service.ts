import { apiClient } from '../apiClient'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'customer' | 'provider' | 'admin'
  isVerified: boolean
  profilePicture?: string
  createdAt: string
  updatedAt?: string
  isActive?: boolean
}

export interface GetUsersParams {
  page?: number
  limit?: number
  user_type?: 'customer' | 'provider' | 'admin'
  search?: string
  is_verified?: boolean
  is_active?: boolean
}

export interface GetUsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'customer' | 'provider' | 'admin'
  isVerified?: boolean
  isActive?: boolean
  profilePicture?: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phone?: string
  profilePicture?: string
  isVerified?: boolean
  isActive?: boolean
}

export interface UserStats {
  totalUsers: number
  customers: number
  providers: number
  admins: number
  verifiedUsers: number
  unverifiedUsers: number
}

export const usersService = {
  /**
   * Get all users with pagination and filtering
   */
  async getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = queryParams.toString() ? `/users/all?${queryParams.toString()}` : '/users/all'
    const response = await apiClient.get(url) as any
    // console.log('Users API Response:-----1234', response.data.users) // Debug log
    // Handle the response structure
    if (response?.data) {
      return response.data
    }
    
    // Fallback if structure is different
    throw new Error('Invalid response structure from users API')
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const response = await apiClient.get(`/users/${userId}`) as any
    return (response as any).data.data.user
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post('/auth/register', {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      user_type: data.userType,
      profile_picture: data.profilePicture,
    })
    return (response as any).data.data.user
  },

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put(`/users/update/${userId}`, {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      profile_picture: data.profilePicture,
      is_verified: data.isVerified,
      is_active: data.isActive,
    })
    return (response as any).data.data.user
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/delete/${userId}`)
  },

  /**
   * Verify user email
   */
  async verifyUser(userId: string): Promise<void> {
    await apiClient.post(`/users/verify/${userId}`)
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const response = await apiClient.put(`/users/update/${userId}`, {
      is_active: isActive,
    })
    return (response as any).data.data.user
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/users/stats')
    return (response as any).data.data
  },

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map(id => apiClient.delete(`/users/${id}`)))
  },

  /**
   * Bulk verify users
   */
  async bulkVerifyUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map(id => apiClient.post(`/users/${id}/verify`)))
  },

  /**
   * Bulk update user status
   */
  async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<void> {
    await Promise.all(userIds.map(id => 
      apiClient.put(`/users/${id}`, { is_active: isActive })
    ))
  },
}

