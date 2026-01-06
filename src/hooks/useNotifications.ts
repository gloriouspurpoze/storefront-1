import { useState, useEffect, useCallback } from 'react';
import { notificationsService, PushNotification, NotificationPreferences } from '../services/api/notifications.service';
import { useAppDispatch } from '../store/hooks';
import { addToast } from '../store/slices/uiSlice';

export interface UseNotificationsReturn {
  notifications: PushNotification[];
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  registerDevice: () => Promise<void>;
  unregisterDevice: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [notificationsData, preferencesData] = await Promise.all([
        notificationsService.getNotifications(),
        notificationsService.getPreferences()
      ]);
      setNotifications(notificationsData);
      setPreferences(preferencesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(errorMessage);
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const registerDevice = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: await getVAPIDKey()
        });

        await notificationsService.registerDevice({
          token: JSON.stringify(subscription),
          platform: 'web',
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform
          }
        });

        dispatch(addToast({
          message: 'Push notifications enabled',
          severity: 'success'
        }));
      } else {
        throw new Error('Push notifications are not supported in this browser');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for push notifications';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
      throw err;
    }
  }, [dispatch]);

  const unregisterDevice = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          await notificationsService.unregisterDevice(JSON.stringify(subscription));
        }

        dispatch(addToast({
          message: 'Push notifications disabled',
          severity: 'success'
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unregister from push notifications';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
      throw err;
    }
  }, [dispatch]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      await notificationsService.updatePreferences(newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      dispatch(addToast({
        message: 'Notification preferences updated',
        severity: 'success'
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
      throw err;
    }
  }, [dispatch]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => (n.id === notificationId || n._id === notificationId) ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
      throw err;
    }
  }, [dispatch]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      dispatch(addToast({
        message: 'All notifications marked as read',
        severity: 'success'
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
      throw err;
    }
  }, [dispatch]);

  const getVAPIDKey = async (): Promise<string> => {
    try {
      return await notificationsService.getVAPIDKey();
    } catch (err) {
      console.error('Failed to get VAPID key:', err);
      throw new Error('Failed to get VAPID key');
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Set up push notification listener
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
          refreshNotifications();
        }
      });
    }
  }, [refreshNotifications]);

  return {
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
    refreshNotifications
  };
}
