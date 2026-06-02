import type { ApiClient } from '../types'
import type { AppUser, PaginationResponse } from '@profixer/types'
import { unwrapApiData } from '../unwrap'

export interface UsersQuery {
  page?: number
  limit?: number
  user_type?: 'customer' | 'provider' | 'professional' | 'admin' | 'super_admin'
  search?: string
  scope?: 'directory' | 'members'
  is_verified?: boolean
  is_active?: boolean
}

export interface UsersListResponse {
  users: AppUser[]
  pagination: PaginationResponse
}

export interface UserStats {
  totalUsers: number
  customers: number
  providers: number
  admins: number
  verifiedUsers: number
  unverifiedUsers: number
}

function mapUser(raw: Record<string, unknown>): AppUser {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    firstName: String(raw.firstName ?? raw.first_name ?? ''),
    lastName: String(raw.lastName ?? raw.last_name ?? ''),
    phone: raw.phone as string | undefined,
    userType: (raw.userType ?? raw.user_type ?? 'customer') as AppUser['userType'],
    isVerified: Boolean(raw.isVerified ?? raw.is_verified ?? false),
    isActive:
      raw.isActive != null
        ? Boolean(raw.isActive)
        : raw.is_active != null
          ? Boolean(raw.is_active)
          : true,
    profilePicture: (raw.profilePicture ?? raw.profile_picture) as string | undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: (raw.updatedAt ?? raw.updated_at) as string | undefined,
  }
}

function defaultPagination(): PaginationResponse {
  return { page: 1, limit: 25, total: 0, totalPages: 0 }
}

function normalizeList(raw: unknown): UsersListResponse {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) {
    const users = data.map((u) => mapUser(u as Record<string, unknown>))
    return {
      users,
      pagination: { page: 1, limit: users.length, total: users.length, totalPages: 1 },
    }
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    const rows = Array.isArray(d.users) ? (d.users as Record<string, unknown>[]) : []
    const users = rows.map(mapUser)
    const pagination = (d.pagination as PaginationResponse | undefined) ?? {
      page: 1,
      limit: users.length,
      total: users.length,
      totalPages: 1,
    }
    return { users, pagination }
  }
  return { users: [], pagination: defaultPagination() }
}

export function createUsersService(api: ApiClient) {
  return {
    async getUsers(query: UsersQuery = {}): Promise<UsersListResponse> {
      const res = await api.get<unknown>('/users/all', {
        params: query as Record<string, unknown>,
      })
      return normalizeList(res.data ?? res)
    },
    async getUser(id: string): Promise<AppUser> {
      const res = await api.get<unknown>(`/users/${id}`)
      const data = unwrapApiData<unknown>(res.data ?? res)
      if (data && typeof data === 'object' && 'user' in (data as Record<string, unknown>)) {
        return mapUser((data as { user: Record<string, unknown> }).user)
      }
      return mapUser(data as Record<string, unknown>)
    },
    async setUserActive(id: string, isActive: boolean): Promise<AppUser> {
      const res = await api.put<unknown>(`/users/update/${id}`, { is_active: isActive })
      const data = unwrapApiData<unknown>(res.data ?? res)
      if (data && typeof data === 'object' && 'user' in (data as Record<string, unknown>)) {
        return mapUser((data as { user: Record<string, unknown> }).user)
      }
      return mapUser(data as Record<string, unknown>)
    },
    async verifyUser(id: string): Promise<void> {
      await api.post(`/users/verify/${id}`, {})
    },
    async getUserStats(): Promise<UserStats> {
      const res = await api.get<unknown>('/users/stats')
      return unwrapApiData<UserStats>(res.data ?? res)
    },
    async searchCustomers(search: string, limit = 15): Promise<AppUser[]> {
      const result = await this.getUsers({
        scope: 'directory',
        user_type: 'customer',
        search,
        limit,
        page: 1,
      })
      return result.users
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
