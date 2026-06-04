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

export interface CreateCustomerInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  /** Optional — a strong one is generated when omitted. */
  password?: string
}

export interface CreateCustomerResult {
  user: AppUser
  /** The password the counter staff should hand to the customer. */
  password: string
}

/** `/auth/register` wants E.164-ish phone (leading +, country digit 1–9). */
export function normalizeCustomerPhone(raw: string): string {
  const s = (raw ?? '').replace(/\s/g, '')
  if (!s) return s
  if (s.startsWith('+')) return s
  const digits = s.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return s
}

/** Strong, human-typable password for a counter-created customer. */
export function generateCustomerPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '@$!%*?&'
  const all = upper + lower + digits + special
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)] as string
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)]
  for (let i = 0; i < 8; i++) chars.push(pick(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j] as string, chars[i] as string]
  }
  return chars.join('')
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
    /** Counter quick-create: registers a customer (mirrors web POS `createUser`). */
    async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
      const password = input.password?.trim() || generateCustomerPassword()
      const body = {
        email: input.email.trim().toLowerCase(),
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: normalizeCustomerPhone(input.phone),
        user_type: 'customer',
        password,
      }
      const res = await api.post<unknown>('/auth/register', body)
      const data = unwrapApiData<unknown>(res.data ?? res)
      const userRaw =
        data && typeof data === 'object' && 'user' in (data as Record<string, unknown>)
          ? (data as { user: Record<string, unknown> }).user
          : (data as Record<string, unknown>)
      if (!userRaw || typeof userRaw !== 'object') {
        throw new Error('Customer was not returned by the server')
      }
      return { user: mapUser(userRaw as Record<string, unknown>), password }
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
