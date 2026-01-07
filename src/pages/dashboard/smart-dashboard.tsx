import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { Dashboard } from './dashboard'
import { ProviderDashboard } from '../providers/provider-dashboard'
import { CircularProgress, Box } from '@mui/material'

/**
 * Smart Dashboard Component
 * Redirects users to appropriate dashboard based on role
 */
export function SmartDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  
  // Check if user is a provider
  const isProvider = user?.userType === 'provider'
  
  // Check if user is a professional
  const isProfessional = user?.userType === 'professional'
  
  // All hooks must be called before any early returns
  useEffect(() => {
    // Only navigate when user data is loaded
    if (!user || isLoading) return
    
    if (isProfessional) {
      console.log('🔍 SmartDashboard - Redirecting to professional dashboard')
      navigate('/professional/dashboard', { replace: true })
    } else if (isProvider) {
      console.log('🔍 SmartDashboard - Redirecting to provider dashboard')
      navigate('/provider/dashboard', { replace: true })
    } else {
      console.log('🔍 SmartDashboard - Staying on admin dashboard')
    }
  }, [isProvider, isProfessional, navigate, user, isLoading])
  
  // Show loading while auth state is being determined
  if (isLoading || !user) {
    console.log('🔍 SmartDashboard - Loading auth state...')
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }
  
  console.log('🔍 SmartDashboard - User:', user)
  console.log('🔍 SmartDashboard - User Type:', user?.userType)
  console.log('🔍 SmartDashboard - Is Provider?', isProvider)
  console.log('🔍 SmartDashboard - Is Professional?', isProfessional)
  
  // Show appropriate dashboard based on user type
  if (isProfessional) {
    // Show loading while redirecting to professional dashboard
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }
  
  if (isProvider) {
    return <ProviderDashboard />
  }
  
  return <Dashboard />
}

