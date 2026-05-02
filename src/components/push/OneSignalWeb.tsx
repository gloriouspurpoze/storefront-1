import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'

const ONESIGNAL_SDK = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'

type OneSignalSdk = {
  init: (opts: Record<string, unknown>) => Promise<void>
  login: (externalId: string) => Promise<void>
  logout?: () => Promise<void>
  User?: { addTags?: (tags: Record<string, string>) => Promise<void> }
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void>
  }
}

const APP_ID = process.env.REACT_APP_ONESIGNAL_APP_ID ?? ''
const SAFARI_WEB_ID = process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID ?? ''

/** Avoid double init (React Strict Mode / remounts) and duplicate script tags */
let onesignalAdminBootstrapDone = false

function loadSdkOnce(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`script[src="${ONESIGNAL_SDK}"]`)) return
  const s = document.createElement('script')
  s.src = ONESIGNAL_SDK
  s.async = true
  document.head.appendChild(s)
}

/**
 * fixer-admin: Web Push via OneSignal (same REST key + App ID as backend when using one app;
 * or create a separate OneSignal "Safari Web" / admin app for admin.profixer.in).
 */
export function OneSignalWeb(): null {
  const user = useSelector((s: RootState) => s.auth.user)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)

  useEffect(() => {
    if (!APP_ID || typeof window === 'undefined') return
    if (onesignalAdminBootstrapDone) return
    onesignalAdminBootstrapDone = true

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal: OneSignalSdk) => {
      await OneSignal.init({
        appId: APP_ID,
        ...(SAFARI_WEB_ID ? { safari_web_id: SAFARI_WEB_ID } : {}),
        notifyButton: {
          enable: process.env.REACT_APP_ONESIGNAL_SHOW_BELL === 'true',
        },
        allowLocalhostAsSecure: process.env.NODE_ENV === 'development',
        serviceWorkerParam: { scope: '/' },
      })
    })

    loadSdkOnce()
  }, [])

  useEffect(() => {
    if (!APP_ID || typeof window === 'undefined') return

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal: OneSignalSdk) => {
      try {
        if (isAuthenticated && user?.id) {
          await OneSignal.login(String(user.id))
          await OneSignal.User?.addTags?.({
            surface: 'admin',
            app: 'profixer-admin',
          })
        } else {
          await OneSignal.logout?.()
        }
      } catch (e) {
        console.warn('[OneSignal] admin identity', e)
      }
    })
  }, [isAuthenticated, user?.id])

  return null
}
