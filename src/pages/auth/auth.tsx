import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { Box, Container, Typography, Paper, Stack, Button } from '@mui/material'
import { LoginForm } from '../../components/auth/LoginForm'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { loginUser } from '../../store/slices/authSlice'
import { addToast } from '../../store/slices/uiSlice'

export function Auth() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const [error, setError] = useState<string>('')
  const location = useLocation()

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  const handleLogin = async (credentials: { email: string; password: string; rememberMe: boolean }) => {
    try {
      setError('')
      
      // Use the new async thunk for login
      const result = await dispatch(loginUser({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe
      }))
      
      // Check if login was successful
      if (loginUser.fulfilled.match(result)) {
        // Store transformed user data in localStorage if remember me is checked
        if (credentials.rememberMe) {
          // Store the TRANSFORMED user data (camelCase), not raw backend response
          const transformedUser = {
            id: result.payload.user.id,
            email: result.payload.user.email,
            firstName: result.payload.user.first_name || result.payload.user.firstName,
            lastName: result.payload.user.last_name || result.payload.user.lastName,
            phone: result.payload.user.phone,
            userType: result.payload.user.user_type || result.payload.user.userType,
            isVerified: result.payload.user.is_verified || result.payload.user.isVerified,
            profilePicture: result.payload.user.profile_picture || result.payload.user.profilePicture,
            createdAt: result.payload.user.created_at || result.payload.user.createdAt || new Date().toISOString(),
          }
          
          localStorage.setItem('user', JSON.stringify(transformedUser))
          localStorage.setItem('token', result.payload.tokens?.accessToken || result.payload.token)
          localStorage.setItem('refreshToken', result.payload.tokens?.refreshToken || result.payload.refreshToken)
        }
        
        // Show success message
        dispatch(addToast({
          message: 'Welcome back! You have been successfully signed in.',
          severity: 'success'
        }))
      } else {
        // Handle login failure
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Login failed'
        setError(errorMessage)
        dispatch(addToast({
          message: errorMessage,
          severity: 'error'
        }))
      }
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed'
      setError(errorMessage)
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }))
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 3, sm: 6 },
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          {/* Features Section */}
          {/* <Paper
            sx={{
              p: { xs: 3, sm: 4 },
              maxWidth: { xs: '100%', lg: 400 },
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              order: { xs: 2, lg: 1 },
            }}
          >
            <Typography variant="h4" sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
              Manage Your Business with Ease
            </Typography>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>📊</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    Complete Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{
                    opacity: 0.8,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Track revenue, orders, and customer satisfaction
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>👥</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    User Management
                  </Typography>
                  <Typography variant="body2" sx={{
                    opacity: 0.8,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Manage customers, providers, and admin accounts
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>🔒</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    Secure & Reliable
                  </Typography>
                  <Typography variant="body2" sx={{
                    opacity: 0.8,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Enterprise-grade security for your business data
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Paper> */}

          {/* Login Form */}
          <Box sx={{ order: { xs: 1, lg: 2 } }}>
            <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
            
            {/* Signup Link */}
            {/* <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="white" sx={{ opacity: 0.9, mb: 2 }}>
                Don't have an account yet?
              </Typography>
              <Button
                component={Link}
                to="/signup"
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  px: 4,
                  py: 1.5,
                }}
              >
                Create Account
              </Button>
            </Box> */}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}