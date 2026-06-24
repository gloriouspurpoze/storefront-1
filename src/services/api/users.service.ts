import { apiClient } from '../apiClient'
import type { User } from '../../types'
import type { Permission, RbacPermissionMode, UserRole } from '../../types/rbac.types'
import { mapBackendUserToAppUser } from '../../lib/mapBackendUser'
import {
  generatePosCustomerPassword,
  normalizePhoneForRegister,
  phonesMatch,
  walkInPlaceholderEmail,
} from '../../lib/posCustomer'

export type { User }

export interface GetUsersParams {
  page?: number
  limit?: number
  user_type?: 'customer' | 'provider' | 'professional' | 'admin' | 'super_admin'
  search?: string
  is_verified?: boolean
  is_active?: boolean
  /** directory = consumer accounts (customers); members = dashboard / team accounts */
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
  /** Omit when inviteTeamMember — backend generates and emails */
  password?: string
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
  /** Team invite: login username (stored lowercase); may be a work email distinct from invite `email` */
  username?: string
  /** Dashboard team invite: email temp password + set-password link */
  inviteTeamMember?: boolean
  /** SaaS: attach new dashboard admin to this organization (also sent as `X-Tenant-Id` when Redux has context). */
  tenantId?: string
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
    const response = (await apiClient.get(url, {
      showSuccessToast: false,
      showLoading: false,
    })) as { data?: { users?: unknown[]; pagination?: GetUsersResponse['pagination'] } }
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
    const response = (await apiClient.get(`/users/${userId}`, {
      showSuccessToast: false,
      showLoading: false,
    })) as { data?: { user?: unknown; data?: { user?: unknown } } }
    const raw = response?.data?.user ?? response?.data?.data?.user
    if (!raw) throw new Error('User not found')
    return mapListUser(raw)
  },

  async findOrCreateDirectoryCustomer(input: {
    firstName: string
    lastName: string
    phone: string
    email?: string
    mode: 'walk_in' | 'full_account'
    password?: string
  }): Promise<{
    user: User
    created: boolean
    matchedExisting: boolean
    mode: 'walk_in' | 'full_account' | 'existing'
    password?: string
    serverMessage?: string
  }> {
    const phone = normalizePhoneForRegister(input.phone.trim())
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new Error('Enter a valid phone (10 digits for India or full +country…).')
    }

    const searchDigits = phone.replace(/\D/g, '').slice(-10)
    const list = await this.getUsers({
      scope: 'directory',
      user_type: 'customer',
      search: searchDigits,
      limit: 25,
      page: 1,
    })
    const existing = list.users.find((u) => phonesMatch(u.phone, phone))
    if (existing) {
      return { user: existing, created: false, matchedExisting: true, mode: 'existing' }
    }

    if (input.mode === 'walk_in') {
      try {
        const response = (await apiClient.post(
          '/users/directory/find-or-create',
          {
            first_name: input.firstName.trim(),
            last_name: input.lastName.trim(),
            phone,
            email: input.email?.trim() || undefined,
            source: 'pos_walk_in',
          },
          { showSuccessToast: false, showErrorToast: false, showLoading: false },
        )) as { data?: { user?: unknown; created?: boolean; message?: string }; message?: string }
        const userRaw = response?.data?.user
        if (userRaw) {
          return {
            user: mapListUser(userRaw),
            created: Boolean(response?.data?.created ?? true),
            matchedExisting: false,
            mode: 'walk_in',
            serverMessage:
              typeof response?.data?.message === 'string'
                ? response.data.message
                : response?.message,
          }
        }
      } catch {
        /* fall through to register fallback */
      }
    }

    const fn = input.firstName.trim()
    const ln = input.lastName.trim()
    const email =
      input.mode === 'full_account'
        ? input.email?.trim().toLowerCase() || ''
        : input.email?.trim().toLowerCase() || walkInPlaceholderEmail(phone)

    if (input.mode === 'full_account' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid email for a full account.')
    }

    const password =
      input.mode === 'full_account'
        ? input.password?.trim() || generatePosCustomerPassword()
        : generatePosCustomerPassword()

    const { user, serverMessage } = await this.createUser({
      email,
      firstName: fn,
      lastName: ln,
      phone,
      userType: 'customer',
      password,
    })

    return {
      user,
      created: true,
      matchedExisting: false,
      mode: input.mode,
      password: input.mode === 'full_account' ? password : undefined,
      serverMessage,
    }
  },

  async createUser(
    data: CreateUserRequest,
  ): Promise<{ user: User; inviteEmailSent?: boolean; serverMessage?: string }> {
    const isAdmin = data.userType === 'admin'
    const resolvedUsername =
      data.username?.trim() ||
      (isAdmin ? data.email?.trim().toLowerCase() : '')

    const body: Record<string, unknown> = {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      user_type: data.userType,
      profile_picture: data.profilePicture,
      ...(isAdmin && resolvedUsername ? { username: resolvedUsername } : {}),
    }
    const skipPassword =
      data.userType === 'admin' && data.inviteTeamMember && !data.password?.trim()
    if (!skipPassword && data.password !== undefined) {
      body.password = data.password
    }
    if (data.userType === 'admin') {
      if (data.rbacRole) body.rbac_role = data.rbacRole
      if (data.rbacPermissionMode) body.rbac_permission_mode = data.rbacPermissionMode
      if (data.permissions !== undefined) body.permissions = data.permissions
      if (data.inviteTeamMember) {
        body.invite_team_member = true
      }
      if (data.tenantId?.trim()) {
        body.tenant_id = data.tenantId.trim()
      }
      const response = (await apiClient.post('/auth/register/admin', body, {
        showSuccessToast: false,
        showErrorToast: false,
        showLoading: false,
      })) as {
        data?: { user?: unknown; invite_email_sent?: boolean; message?: string }
        message?: string
      }
      const inner = response?.data
      const userRaw = inner?.user
      if (!userRaw) throw new Error('Invalid create user response')
      return {
        user: mapListUser(userRaw),
        inviteEmailSent: inner?.invite_email_sent,
        serverMessage: typeof inner?.message === 'string' ? inner.message : response?.message,
      }
    }
    const response = (await apiClient.post('/auth/register', body, {
      showSuccessToast: false,
      showErrorToast: false,
      showLoading: false,
    })) as { data?: { user?: unknown }; message?: string }
    const userRaw = response?.data?.user
    if (!userRaw) throw new Error('Invalid create user response')
    return { user: mapListUser(userRaw), serverMessage: response?.message }
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
    const payloadData = (response as { data?: { user?: unknown; message?: string; data?: { user?: unknown } } })?.data
    const userRaw = payloadData?.user ?? payloadData?.data?.user
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
    const payloadData = (response as { data?: { user?: unknown; data?: { user?: unknown } } })?.data
    const userRaw = payloadData?.user ?? payloadData?.data?.user
    if (!userRaw) throw new Error('Invalid response')
    return mapListUser(userRaw)
  },

  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get('/users/stats', {
      showSuccessToast: false,
      showLoading: false,
    })
    const stats =
      (response as { data?: UserStats }).data ??
      (response as { data?: { data?: UserStats } }).data?.data
    if (!stats || typeof stats.totalUsers !== 'number') {
      throw new Error('Invalid stats response')
    }
    return stats
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
