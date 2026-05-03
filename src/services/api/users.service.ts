import { apiClient } from '../apiClient'
import type { User } from '../../types'
import type { Permission, RbacPermissionMode, UserRole } from '../../types/rbac.types'
import { mapBackendUserToAppUser } from '../../lib/mapBackendUser'

export type { User }

export interface GetUsersParams {
  page?: number
  limit?: number
  user_type?: 'customer' | 'provider' | 'professional' | 'admin' | 'super_admin'
  search?: string
  is_verified?: boolean
  is_active?: boolean
  /** directory = app users; members = admin-provisioned dashboard accounts */
  scope?: 'directory' | 'members'
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
  userType: 'customer' | 'provider' | 'professional' | 'admin'
  isVerified?: boolean
  isActive?: boolean
  profilePicture?: string
  rbacRole?: UserRole
  rbacPermissionMode?: RbacPermissionMode
  permissions?: Permission[]
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phone?: string
  profilePicture?: string
  isVerified?: boolean
  isActive?: boolean
  rbacRole?: UserRole | null
  rbacPermissionMode?: RbacPermissionMode | null
  permissions?: Permission[] | null
}

export interface UserStats {
  totalUsers: number
  customers: number
  providers: number
  admins: number
  verifiedUsers: number
  unverifiedUsers: number
}

function mapListUser(raw: unknown): User {
  return mapBackendUserToAppUser(raw as Record<string, unknown>, null)
}

export const usersService = {
  async getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = queryParams.toString() ? `/users/all?${queryParams.toString()}` : '/users/all'
    const response = (await apiClient.get(url)) as { data?: { users?: unknown[]; pagination?: GetUsersResponse['pagination'] } }
    if (response?.data) {
      const rawUsers = response.data.users || []
      return {
        users: rawUsers.map(mapListUser),
        pagination: response.data.pagination || {
          page: 1,
          limit: 100,
          total: rawUsers.length,
          totalPages: 1,
        },
      }
    }
    throw new Error('Invalid response structure from users API')
  },

  async getUserById(userId: string): Promise<User> {
    const response = (await apiClient.get(`/users/${userId}`)) as { data?: { data?: { user?: unknown } } }
    const raw = (response as { data?: { data?: { user?: unknown } } })?.data?.data?.user
    if (!raw) throw new Error('User not found')
    return mapListUser(raw)
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const body: Record<string, unknown> = {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      user_type: data.userType,
      profile_picture: data.profilePicture,
    }
    if (data.userType === 'admin') {
      if (data.rbacRole) body.rbac_role = data.rbacRole
      if (data.rbacPermissionMode) body.rbac_permission_mode = data.rbacPermissionMode
      if (data.permissions !== undefined) body.permissions = data.permissions
      const response = await apiClient.post('/auth/register/admin', body)
      const userRaw = (response as { data?: { data?: { user?: unknown } } })?.data?.data?.user
      if (!userRaw) throw new Error('Invalid create user response')
      return mapListUser(userRaw)
    }
    const response = await apiClient.post('/auth/register', body)
    const userRaw = (response as { data?: { data?: { user?: unknown } } })?.data?.data?.user
    if (!userRaw) throw new Error('Invalid create user response')
    return mapListUser(userRaw)
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const payload: Record<string, unknown> = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      profile_picture: data.profilePicture,
      is_verified: data.isVerified,
      is_active: data.isActive,
    }
    if (data.rbacRole !== undefined) payload.rbac_role = data.rbacRole
    if (data.rbacPermissionMode !== undefined) payload.rbac_permission_mode = data.rbacPermissionMode
    if (data.permissions !== undefined) payload.permissions = data.permissions

    const response = await apiClient.put(`/users/update/${userId}`, payload)
    const userRaw = (response as { data?: { data?: { user?: unknown } } })?.data?.data?.user
    if (!userRaw) throw new Error('Invalid update user response')
    return mapListUser(userRaw)
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/delete/${userId}`)
  },

  async verifyUser(userId: string): Promise<void> {
    await apiClient.post(`/users/verify/${userId}`)
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const response = await apiClient.put(`/users/update/${userId}`, {
      is_active: isActive,
    })
    const userRaw = (response as { data?: { data?: { user?: unknown } } })?.data?.data?.user
    if (!userRaw) throw new Error('Invalid response')
    return mapListUser(userRaw)
  },

  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/users/stats')
    return (response as { data?: { data?: UserStats } }).data?.data as UserStats
  },

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map((id) => apiClient.delete(`/users/${id}`)))
  },

  async bulkVerifyUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map((id) => apiClient.post(`/users/${id}/verify`)))
  },

  async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<void> {
    await Promise.all(
      userIds.map((id) => apiClient.put(`/users/${id}`, { is_active: isActive })),
    )
  },
}
