import { Platform } from 'react-native'
import { OneSignal } from 'react-native-onesignal'
import { AppConfig } from '@/config/env'
import { services } from '@/services/createMobileClient'
import { handleNotificationOpen } from '@/services/push/handleNotificationOpen'

let initialized = false

type ClickEvent = {
  notification: {
    launchURL?: string
    additionalData?: { url?: string }
  }
}

export async function initOneSignal(userId?: string | null) {
  const appId = AppConfig.ONESIGNAL_APP_ID
  if (!appId) return

  try {
    if (!initialized) {
      OneSignal.initialize(appId)
      OneSignal.Notifications.addEventListener('click', (event: ClickEvent) => {
        const url = event.notification.additionalData?.url ?? event.notification.launchURL
        if (url) handleNotificationOpen(url)
      })
      // Prompt the OS-native permission dialog (no-op if already answered).
      OneSignal.Notifications.requestPermission(false)
      initialized = true
    }

    if (userId) {
      OneSignal.login(userId)
      OneSignal.User.addTags({ surface: 'admin', app: 'profixer-admin-mobile' })

      const sub = OneSignal.User.pushSubscription
      let pushToken: string | null = null
      try {
        pushToken = sub.getPushSubscriptionId?.() ?? null
      } catch {
        pushToken = null
      }

      if (pushToken) {
        await services.notifications.registerDevice({
          token: pushToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          deviceInfo: { app: 'profixer-admin-mobile' },
        })
      }
    } else {
      OneSignal.logout()
    }
  } catch (e) {
    console.warn('[OneSignal] init failed:', e)
  }
}
