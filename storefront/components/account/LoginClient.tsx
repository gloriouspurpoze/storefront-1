'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { useAccountAuth } from './AccountAuthProvider'
import {
  isGoogleSignInConfigured,
  sendPhoneOtp,
  signInWithGoogle,
  verifyPhoneOtp,
} from '@/lib/storefront-auth'

function GoogleMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isReady, setSession } = useAccountAuth()

  const [googleLoading, setGoogleLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnUrl = searchParams.get('returnUrl') || '/account'
  const isSignup = searchParams.get('signup') === '1'
  const googleEnabled = isGoogleSignInConfigured()

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(returnUrl)
    }
  }, [isReady, isAuthenticated, router, returnUrl])

  const onGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      const result = await signInWithGoogle()
      setSession(result.user, result.tokens)
      router.replace(returnUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  const onSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setPhoneLoading(true)
    try {
      await sendPhoneOtp(phone)
      setOtpSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setPhoneLoading(false)
    }
  }

  const onVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setPhoneLoading(true)
    try {
      const result = await verifyPhoneOtp(phone, otp)
      setSession(result.user, result.tokens)
      router.replace(returnUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setPhoneLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/"
        className="mb-8 inline-flex text-sm text-neutral-500 transition hover:text-neutral-900"
      >
        ← Back to store
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {isSignup ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {isSignup
            ? googleEnabled
              ? 'Use Google or your phone number to create an account and track orders from this store.'
              : 'Use your phone number to create an account and track orders from this store.'
            : googleEnabled
              ? 'View your order history and track purchases from this store.'
              : 'Sign in with your phone number to view your order history and track purchases from this store.'}
        </p>
        <p className="mt-3 text-sm text-neutral-600">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link href="/account/login" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{' '}
              <Link
                href="/account/login?signup=1"
                className="font-medium text-neutral-900 underline-offset-2 hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {googleEnabled ? (
          <>
            <button
              type="button"
              onClick={onGoogle}
              disabled={googleLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <GoogleMark />
              {googleLoading ? 'Signing in…' : 'Continue with Google'}
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
          </>
        ) : null}

        {!otpSent ? (
          <form onSubmit={onSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                Phone number
              </label>
              <div className="mt-1.5 flex gap-2">
                <span className="inline-flex items-center rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none ring-neutral-900 focus:ring-2"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={phoneLoading || phone.length < 10}
              className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {phoneLoading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="space-y-4">
            <p className="text-sm text-neutral-600">
              Enter the 6-digit code sent to <strong>+91 {phone}</strong>
            </p>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-neutral-700">
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm tracking-[0.3em] outline-none ring-neutral-900 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={phoneLoading || otp.length !== 6}
              className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {phoneLoading ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false)
                setOtp('')
              }}
              className="w-full text-sm text-neutral-500 hover:text-neutral-800"
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
