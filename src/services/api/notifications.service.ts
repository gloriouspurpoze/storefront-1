import { store } from '../../store'
import { api } from './base'

export interface PushNotification {
  id: string
  _id?: string
  userId: string
  title: string
  body?: string
  message?: string
  type: string
  iconUrl?: string
  actionUrl?: string
  relatedId?: string
  relatedType?: 'booking' | 'order' | 'payment' | 'review'
  data?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: string
  titleTemplate: string
  bodyTemplate: string
  iconUrl?: string
  actionUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationPreferences {
  userId: string
  pushNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  orderNotifications: boolean
  userNotifications: boolean
  systemNotifications: boolean
  marketingNotifications: boolean
}

export interface CreateNotificationRequest {
  title: string
  body: string
  type: string
  iconUrl?: string
  actionUrl?: string
  data?: Record<string, unknown>
  userIds?: string[]
}

export interface CreateTemplateRequest {
  name: string
  type: string
  titleTemplate: string
  bodyTemplate: string
  iconUrl?: string
  actionUrl?: string
  isActive?: boolean
}

export interface UpdatePreferencesRequest {
  pushNotifications?: boolean
  emailNotifications?: boolean
  smsNotifications?: boolean
  orderNotifications?: boolean
  userNotifications?: boolean
  systemNotifications?: boolean
  marketingNotifications?: boolean
}

export interface DeviceRegistrationRequest {
  token: string
  platform: 'web' | 'ios' | 'android'
  deviceInfo?: Record<string, unknown>
}

export interface NotificationStats {
  totalSent: number
  totalRead: number
  totalUnread: number
  readRate: number
  byType: Record<string, number>
}

function apiBase(): string {
  return (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
}

/** Raw fetch for endpoints that return arrays or non-{success,data} shapes. */
async function authFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = store.getState().auth?.token
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const headers: HeadersInit = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  }
  const res = await fetch(url, { ...init, headers })
  const text = await res.text()
  let j: unknown = {}
  try {
    j = text ? JSON.parse(text) : {}
  } catch {
    j = { raw: text }
  }
  if (!res.ok) {
    const o = j as Record<string, unknown>
    const err =
      (typeof o.error === 'string' ? o.error : null) ||
      (o.error && typeof o.error === 'object' && (o.error as { message?: string }).message) ||
      (typeof o.message === 'string' ? o.message : null) ||
      res.statusText
    throw new Error(String(err))
  }
  return j as T
}

function mapNotification(n: Record<string, unknown>): PushNotification {
  const id = String(n._id ?? n.id ?? '')
  return {
    id,
    _id: id,
    userId: String(n.userId ?? ''),
    title: String(n.title ?? ''),
    body: String(n.message ?? n.body ?? ''),
    message: String(n.message ?? n.body ?? ''),
    type: String(n.type ?? 'general'),
    iconUrl: n.iconUrl as string | undefined,
    actionUrl: n.actionUrl as string | undefined,
    relatedId: n.relatedId as string | undefined,
    relatedType: n.relatedType as PushNotification['relatedType'],
    data: (n.data as Record<string, unknown>) || {},
    isRead: n.isRead !== undefined ? Boolean(n.isRead) : Boolean(n.read),
    readAt: n.readAt as string | undefined,
    createdAt: String(n.createdAt ?? n.created_at ?? new Date().toISOString()),
    updatedAt: String(n.updatedAt ?? n.updated_at ?? new Date().toISOString()),
  }
}

function isValidHttpUrl(s: string | undefined): boolean {
  if (!s || !s.trim()) return false
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

class NotificationsService {
  async getNotifications(limit: number = 50, page: number = 1): Promise<PushNotification[]> {
    try {
      const res = await api.get<{ notifications: Record<string, unknown>[]; total: number; unreadCount?: number }>(
        `/notifications?page=${page}&limit=${limit}`,
        { showLoading: false, showErrorToast: false, showSuccessToast: false }
      )
      const inner = res.data as Record<string, unknown> | undefined
      const raw =
        (inner?.notifications as Record<string, unknown>[]) ||
        ((res as unknown as { notifications?: unknown }).notifications as Record<string, unknown>[]) ||
        []
      return Array.isArray(raw) ? raw.map(mapNotification) : []
    } catch {
      return []
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const res = await api.get<{ count: number }>(`/notifications/unread-count`, {
        showLoading: false,
        showErrorToast: false,
        showSuccessToast: false,
      })
      const inner = res.data as { count?: number } | undefined
      return inner?.count ?? 0
    } catch {
      return 0
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${encodeURIComponent(notificationId)}/read`, {}, {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: true,
    })
  }

  async markAllAsRead(): Promise<void> {
    await api.patch(`/notifications/mark-all-read`, {}, {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: true,
    })
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${encodeURIComponent(notificationId)}`, {
      showLoading: false,
      showSuccessToast: false,
      showErrorToast: true,
    })
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const j = await authFetch<NotificationPreferences & { user_id?: string }>('/notifications/preferences', {
        method: 'GET',
      })
      return {
        userId: String((j as NotificationPreferences).userId || (j as { user_id?: string }).user_id || ''),
        pushNotifications: Boolean(j.pushNotifications),
        emailNotifications: Boolean(j.emailNotifications),
        smsNotifications: Boolean(j.smsNotifications),
        orderNotifications: Boolean(j.orderNotifications),
        userNotifications: Boolean(j.userNotifications),
        systemNotifications: Boolean(j.systemNotifications),
        marketingNotifications: Boolean(j.marketingNotifications),
      }
    } catch {
      return {
        userId: '',
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        orderNotifications: true,
        userNotifications: true,
        systemNotifications: true,
        marketingNotifications: false,
      }
    }
  }

  async updatePreferences(preferences: UpdatePreferencesRequest): Promise<void> {
    await authFetch('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    })
  }

  async getVAPIDKey(): Promise<string> {
    const j = await fetch(`${apiBase()}/notifications/vapid-key`)
    const data = await j.json()
    if (!j.ok) throw new Error(data.error || 'Failed to load VAPID key')
    return String(data.publicKey || '')
  }

  async registerDevice(data: DeviceRegistrationRequest): Promise<void> {
    await authFetch('/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async unregisterDevice(token: string): Promise<void> {
    await authFetch('/notifications/unregister-device', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    })
  }

  async sendNotification(data: CreateNotificationRequest): Promise<{ success: number; failed: number }> {
    const body: Record<string, unknown> = {
      title: data.title,
      body: data.body,
      type: data.type,
      userIds: data.userIds && data.userIds.length > 0 ? data.userIds : [],
      data: data.data || {},
    }
    if (isValidHttpUrl(data.iconUrl)) body.iconUrl = data.iconUrl
    if (isValidHttpUrl(data.actionUrl)) body.actionUrl = data.actionUrl

    const j = await authFetch<{ success?: number; failed?: number; message?: string }>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return {
      success: Number(j.success ?? 0),
      failed: Number(j.failed ?? 0),
    }
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    try {
      const j = await authFetch<unknown>('/notifications/templates', { method: 'GET' })
      if (Array.isArray(j)) {
        return j.map((t: Record<string, unknown>) => ({
          id: String(t.id ?? t._id ?? ''),
          name: String(t.name ?? ''),
          type: String(t.type ?? 'system_alert'),
          titleTemplate: String(t.titleTemplate ?? t.title_template ?? ''),
          bodyTemplate: String(t.bodyTemplate ?? t.body_template ?? ''),
          iconUrl: (t.iconUrl ?? t.icon_url) as string | undefined,
          actionUrl: (t.actionUrl ?? t.action_url) as string | undefined,
          isActive: Boolean(t.isActive ?? t.is_active ?? true),
          createdAt: String(t.createdAt ?? t.created_at ?? ''),
          updatedAt: String(t.updatedAt ?? t.updated_at ?? ''),
        }))
      }
      return []
    } catch {
      return []
    }
  }

  async createTemplate(data: CreateTemplateRequest): Promise<{ templateId: string }> {
    const body: Record<string, unknown> = {
      name: data.name,
      type: data.type,
      titleTemplate: data.titleTemplate,
      bodyTemplate: data.bodyTemplate,
      isActive: data.isActive ?? true,
    }
    if (isValidHttpUrl(data.iconUrl)) body.iconUrl = data.iconUrl
    if (isValidHttpUrl(data.actionUrl)) body.actionUrl = data.actionUrl

    const j = await authFetch<{ templateId?: string; template_id?: string }>('/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return { templateId: String(j.templateId ?? j.template_id ?? '') }
  }

  async sendTemplateNotification(
    templateId: string,
    userId: string,
    variables: Record<string, unknown> = {}
  ): Promise<void> {
    await authFetch('/notifications/send-template', {
      method: 'POST',
      body: JSON.stringify({ templateId, userId, variables }),
    })
  }

  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const j = await authFetch<Partial<NotificationStats>>('/notifications/stats', { method: 'GET' })
      return {
        totalSent: Number(j.totalSent ?? 0),
        totalRead: Number(j.totalRead ?? 0),
        totalUnread: Number(j.totalUnread ?? 0),
        readRate: Number(j.readRate ?? 0),
        byType: (j.byType as Record<string, number>) || {},
      }
    } catch {
      return {
        totalSent: 0,
        totalRead: 0,
        totalUnread: 0,
        readRate: 0,
        byType: {},
      }
    }
  }
}

export const notificationsService = new NotificationsService()
