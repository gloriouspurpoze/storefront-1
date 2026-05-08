import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  notificationsService,
  PushNotification,
  NotificationPreferences,
} from '../services/api/notifications.service'
import { urlBase64ToUint8Array } from '../lib/webPush'
import { useAppDispatch } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'

export interface UseNotificationsReturn {
  notifications: PushNotification[]
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: string | null
  unreadCount: number
  registerDevice: () => Promise<void>
  unregisterDevice: () => Promise<void>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<UseNotificationsReturn | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverUnreadCount, setServerUnreadCount] = useState<number | null>(null)
  const dispatch = useAppDispatch()

  const unreadCount =
    serverUnreadCount !== null
      ? serverUnreadCount
      : notifications.filter((n) => !n.isRead).length

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [notificationsData, preferencesData, unreadResult] = await Promise.all([
        notificationsService.getNotifications(),
        notificationsService.getPreferences(),
        notificationsService.getUnreadCount().then(
          (n) => ({ ok: true as const, n }),
          () => ({ ok: false as const }),
        ),
      ])
      setNotifications(notificationsData)
      setPreferences(preferencesData)
      setServerUnreadCount(unreadResult.ok ? unreadResult.n : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const registerDevice = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const vapidB64 = await notificationsService.getVAPIDKey()
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // DOM typings can reject `Uint8Array<ArrayBufferLike>`; runtime key is valid BufferSource.
          applicationServerKey: urlBase64ToUint8Array(vapidB64) as BufferSource,
        })

        await notificationsService.registerDevice({
          token: JSON.stringify(subscription),
          platform: 'web',
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
          },
        })

        dispatch(
          addToast({
            message: 'Push notifications enabled',
            severity: 'success',
          }),
        )
      } else {
        throw new Error('Push notifications are not supported in this browser')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for push notifications'
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      )
      throw err
    }
  }, [dispatch])

  const unregisterDevice = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          await subscription.unsubscribe()
          await notificationsService.unregisterDevice(JSON.stringify(subscription))
        }

        dispatch(
          addToast({
            message: 'Push notifications disabled',
            severity: 'success',
          }),
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unregister from push notifications'
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      )
      throw err
    }
  }, [dispatch])

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        await notificationsService.updatePreferences(newPreferences)
        setPreferences((prev) => (prev ? { ...prev, ...newPreferences } : null))
        dispatch(
          addToast({
            message: 'Notification preferences updated',
            severity: 'success',
          }),
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences'
        dispatch(
          addToast({
            message: errorMessage,
            severity: 'error',
          }),
        )
        throw err
      }
    },
    [dispatch],
  )

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationsService.markAsRead(notificationId)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId || n._id === notificationId ? { ...n, isRead: true } : n)),
        )
        setServerUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : prev))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read'
        dispatch(
          addToast({
            message: errorMessage,
            severity: 'error',
          }),
        )
        throw err
      }
    },
    [dispatch],
  )

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setServerUnreadCount(0)
      dispatch(
        addToast({
          message: 'All notifications marked as read',
          severity: 'success',
        }),
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read'
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      )
      throw err
    }
  }, [dispatch])

  useEffect(() => {
    void refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
        void refreshNotifications()
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [refreshNotifications])

  const value = useMemo(
    () => ({
      notifications,
      preferences,
      isLoading,
      error,
      unreadCount,
      registerDevice,
      unregisterDevice,
      updatePreferences,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    }),
    [
      notifications,
      preferences,
      isLoading,
      error,
      unreadCount,
      registerDevice,
      unregisterDevice,
      updatePreferences,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    ],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): UseNotificationsReturn {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}
