import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'provider' | 'customer'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const auth = useAppSelector((state) => state.auth)
  const { isAuthenticated = false, isLoading = false, user = null } = auth || {}
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (requiredRole && user?.userType !== requiredRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-2xl font-semibold text-destructive">Access Denied</h1>
        <p className="max-w-md text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
