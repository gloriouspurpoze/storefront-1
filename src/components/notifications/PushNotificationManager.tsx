import React, { useEffect, useState } from 'react'
import { Bell, CheckCircle2 } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

interface PushNotificationManagerProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

function AlertBox({
  variant,
  children,
}: {
  variant: 'warning' | 'info' | 'success' | 'error'
  children: React.ReactNode
}) {
  const cls =
    variant === 'warning'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
      : variant === 'info'
        ? 'border-border bg-muted/50 text-foreground'
        : variant === 'success'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
          : 'border-destructive/40 bg-destructive/10 text-destructive'

  return (
    <div className={['rounded-md border px-3 py-2 text-sm', cls].join(' ')} role="alert">
      {children}
    </div>
  )
}

export function PushNotificationManager({
  onPermissionGranted,
  onPermissionDenied,
}: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const { registerDevice, unregisterDevice } = useNotifications()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      void checkRegistrationStatus()
    }
  }, [])

  const checkRegistrationStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsRegistered(!!subscription)
      }
    } catch (error) {
      console.error('Error checking registration status:', error)
    }
  }

  const requestPermission = async () => {
    try {
      const next = await Notification.requestPermission()
      setPermission(next)

      if (next === 'granted') {
        await enablePushNotifications()
        onPermissionGranted?.()
      } else {
        onPermissionDenied?.()
        dispatch(
          addToast({
            message: 'Push notifications permission denied',
            severity: 'warning',
          }),
        )
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      dispatch(
        addToast({
          message: 'Failed to request notification permission',
          severity: 'error',
        }),
      )
    }
  }

  const enablePushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      try {
        await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
      } catch (swError) {
        console.error('Service worker registration failed:', swError)
        dispatch(
          addToast({
            message: 'Could not register the app worker for push. Check that /sw.js is served.',
            severity: 'error',
          }),
        )
        return
      }

      await registerDevice()
      setIsRegistered(true)
    } catch (error) {
      console.error('Error enabling push notifications:', error)
    }
  }

  const disablePushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          await subscription.unsubscribe()
          await unregisterDevice()
        }

        setIsRegistered(false)
        dispatch(
          addToast({
            message: 'Push notifications disabled',
            severity: 'info',
          }),
        )
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error)
      dispatch(
        addToast({
          message: 'Failed to disable push notifications',
          severity: 'error',
        }),
      )
    }
  }

  if (!isSupported) {
    return (
      <AlertBox variant="warning">Push notifications are not supported in this browser.</AlertBox>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Push Notifications</h3>
          {isRegistered && <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />}
        </div>

        <p className="text-sm text-muted-foreground">
          Receive real-time notifications about orders, messages, and important updates.
        </p>

        {permission === 'default' && (
          <AlertBox variant="info">
            <p className="mb-2 text-sm">
              Click the button below to enable push notifications for this application.
            </p>
            <Button type="button" onClick={() => void requestPermission()}>
              Enable Push Notifications
            </Button>
          </AlertBox>
        )}

        {permission === 'denied' && (
          <AlertBox variant="warning">
            <p className="mb-2 text-sm">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
            <p className="text-xs text-muted-foreground">
              Go to your browser settings → Privacy and security → Site settings → Notifications
            </p>
          </AlertBox>
        )}

        {permission === 'granted' && (
          <div>
            {isRegistered ? (
              <AlertBox variant="success">
                <p className="mb-2 text-sm">Push notifications are enabled and working.</p>
                <Button type="button" variant="outline" onClick={() => void disablePushNotifications()}>
                  Disable Push Notifications
                </Button>
              </AlertBox>
            ) : (
              <AlertBox variant="info">
                <p className="mb-2 text-sm">Permission granted. Setting up push notifications...</p>
                <Button type="button" onClick={() => void enablePushNotifications()}>
                  Complete Setup
                </Button>
              </AlertBox>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">What you&apos;ll receive:</p>
          <ul className="m-0 list-disc pl-5 text-sm text-muted-foreground">
            <li>New order notifications</li>
            <li>Message alerts</li>
            <li>Service updates</li>
            <li>System announcements</li>
            <li>Payment confirmations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
