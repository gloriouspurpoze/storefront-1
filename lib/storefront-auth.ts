'use client'

import { env } from './env'

export interface StorefrontAuthUser {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName?: string
  profilePicture?: string
  userType: string
}

export interface StorefrontAuthTokens {
  accessToken: string
  refreshToken: string
}

const STORAGE_KEY = 'sf-customer-auth'

interface StoredAuth {
  user: StorefrontAuthUser
  tokens: StorefrontAuthTokens
}

function apiUrl(path: string): string {
  return `${env.API_BASE_URL.replace(/\/+$/, '')}${path}`
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (!parsed?.tokens?.accessToken || !parsed?.user?.id) return null
    return parsed
  } catch {
    return null
  }
}

export function saveAuth(user: StorefrontAuthUser, tokens: StorefrontAuthTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }))
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function displayName(user: StorefrontAuthUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (full) return full
  if (user.email && !user.email.includes('@phone.profixer.local') && !user.email.includes('@temp.com')) {
    return user.email
  }
  if (user.phone) return user.phone
  return 'Account'
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          prompt: (callback?: (notification: unknown) => void) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string
              size?: string
              type?: string
              text?: string
              shape?: string
              logo_alignment?: string
            },
          ) => void
        }
      }
    }
  }
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID)
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(timer)
        if (!window.google?.accounts?.id) reject(new Error('Google sign-in failed to load'))
      }, 5000)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(script)
  })
}

export async function signInWithGoogle(): Promise<{ user: StorefrontAuthUser; tokens: StorefrontAuthTokens; isNewUser: boolean }> {
  const clientId = env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Google sign-in is not configured for this store.')
  }

  await loadGoogleScript()

  return new Promise((resolve, reject) => {
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden'
    document.body.appendChild(container)

    let settled = false

    const cleanup = () => {
      container.remove()
    }

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (settled) return
        settled = true
        cleanup()
        try {
          const res = await fetch(apiUrl('/auth/oauth/google'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              token: response.credential,
              idToken: response.credential,
              credential: response.credential,
            }),
          })
          const json = (await res.json().catch(() => null)) as {
            success?: boolean
            message?: string
            data?: {
              user: StorefrontAuthUser
              tokens: StorefrontAuthTokens
              isNewUser: boolean
            }
          } | null
          if (!res.ok || !json?.success || !json.data?.tokens?.accessToken) {
            throw new Error(json?.message || 'Google sign-in failed')
          }
          resolve({
            user: json.data.user,
            tokens: json.data.tokens,
            isNewUser: json.data.isNewUser,
          })
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Google sign-in failed'))
        }
      },
    })

    window.google!.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'signin_with',
    })

    setTimeout(() => {
      const btn =
        container.querySelector('button') ||
        (container.querySelector('div[role="button"]') as HTMLElement | null)
      if (btn) {
        btn.click()
      } else {
        window.google!.accounts.id.prompt()
        setTimeout(() => {
          if (!settled) {
            settled = true
            cleanup()
            reject(new Error('Could not open Google sign-in. Check popup blockers.'))
          }
        }, 3000)
      }
    }, 200)
  })
}

export async function sendPhoneOtp(phone: string, countryCode = '+91'): Promise<{ expiresIn: number }> {
  const res = await fetch(apiUrl('/auth/otp/send'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone, countryCode }),
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { expiresIn: number }
  } | null
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.message || 'Failed to send OTP')
  }
  return json.data
}

export async function verifyPhoneOtp(
  phone: string,
  otp: string,
  countryCode = '+91',
): Promise<{ user: StorefrontAuthUser; tokens: StorefrontAuthTokens; isNewUser: boolean }> {
  const res = await fetch(apiUrl('/auth/otp/verify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone, otp, countryCode }),
  })
  const json = (await res.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: {
      user: StorefrontAuthUser
      tokens: StorefrontAuthTokens
      isNewUser: boolean
    }
  } | null
  if (!res.ok || !json?.success || !json.data?.tokens?.accessToken) {
    throw new Error(json?.message || 'OTP verification failed')
  }
  return {
    user: json.data.user,
    tokens: json.data.tokens,
    isNewUser: json.data.isNewUser,
  }
}
