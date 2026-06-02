import type { ApiClient } from '../types'

export interface PushNotification {
  id: string
  title: string
  body?: string
  message?: string
  type: string
  actionUrl?: string
  relatedId?: string
  relatedType?: string
  isRead: boolean
  createdAt: string
}

function mapNotification(n: Record<string, unknown>): PushNotification {
  const id = String(n._id ?? n.id ?? '')
  return {
    id,
    title: String(n.title ?? ''),
    body: String(n.message ?? n.body ?? ''),
    message: String(n.message ?? n.body ?? ''),
    type: String(n.type ?? 'general'),
    actionUrl: n.actionUrl as string | undefined,
    relatedId: n.relatedId as string | undefined,
    relatedType: n.relatedType as string | undefined,
    isRead: n.isRead !== undefined ? Boolean(n.isRead) : Boolean(n.read),
    createdAt: String(n.createdAt ?? n.created_at ?? new Date().toISOString()),
  }
}

export function createNotificationsService(api: ApiClient) {
  return {
    async getNotifications(page = 1, limit = 50): Promise<PushNotification[]> {
      try {
        const res = await api.get<{ notifications?: Record<string, unknown>[] }>('/notifications', {
          params: { page, limit },
        })
        const inner = res.data
        const raw = inner?.notifications ?? (Array.isArray(inner) ? inner : [])
        return Array.isArray(raw) ? raw.map((n) => mapNotification(n as Record<string, unknown>)) : []
      } catch {
        return []
      }
    },
    async getUnreadCount(): Promise<number> {
      try {
        const res = await api.get<{ count?: number }>('/notifications/unread-count')
        return res.data?.count ?? 0
      } catch {
        return 0
      }
    },
    markAsRead: (notificationId: string) =>
      api.patch(`/notifications/${encodeURIComponent(notificationId)}/read`, {}),
    markAllAsRead: () => api.patch('/notifications/mark-all-read', {}),
    registerDevice: (data: { token: string; platform: 'web' | 'ios' | 'android'; deviceInfo?: Record<string, unknown> }) =>
      api.post('/notifications/register-device', data),
    unregisterDevice: (token: string) =>
      api.post('/notifications/unregister-device', { token }),
  }
}

export type NotificationsService = ReturnType<typeof createNotificationsService>
