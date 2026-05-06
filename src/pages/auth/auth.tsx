import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../../components/auth/LoginForm'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { loginUser } from '../../store/slices/authSlice'
import { addToast } from '../../store/slices/uiSlice'

export function Auth() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const [error, setError] = useState<string>('')
  const location = useLocation()

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  const handleLogin = async (credentials: { email: string; password: string; rememberMe: boolean }) => {
    try {
      setError('')

      const result = await dispatch(
        loginUser({
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
        }),
      )

      if (loginUser.fulfilled.match(result)) {
        if (credentials.rememberMe) {
          const rawUser = result.payload.user as Record<string, unknown>
          const transformedUser = {
            id: rawUser.id,
            email: rawUser.email,
            firstName: rawUser.first_name || rawUser.firstName,
            lastName: rawUser.last_name || rawUser.lastName,
            phone: rawUser.phone,
            userType: rawUser.user_type || rawUser.userType,
            isVerified: rawUser.is_verified || rawUser.isVerified,
            profilePicture: rawUser.profile_picture || rawUser.profilePicture,
            createdAt: rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
          }

          localStorage.setItem('user', JSON.stringify(transformedUser))
          localStorage.setItem('token', result.payload.tokens?.accessToken || result.payload.token)
          localStorage.setItem(
            'refreshToken',
            result.payload.tokens?.refreshToken || result.payload.refreshToken,
          )
        }

        dispatch(
          addToast({
            message: 'Welcome back! You have been successfully signed in.',
            severity: 'success',
          }),
        )
      } else {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Login failed'
        setError(errorMessage)
        dispatch(
          addToast({
            message: errorMessage,
            severity: 'error',
          }),
        )
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      )
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative w-full max-w-[400px]">
        <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}
