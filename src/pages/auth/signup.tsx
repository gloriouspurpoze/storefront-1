import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Paper, Stack, Fade, Zoom, Slide } from '@mui/material'
import { SignupForm } from '../../components/auth/SignupForm'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { registerUser } from '../../store/slices/authSlice'
import { addToast } from '../../store/slices/uiSlice'
import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'

export function Signup() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const [error, setError] = useState<string>('')
  const location = useLocation()

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  const handleSignup = async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    phone: string
    businessName: string
    location: string
    userType: 'customer' | 'provider' | 'admin'
    agreeToTerms: boolean
    agreeToMarketing: boolean
  }) => {
    try {
      setError('')
      
      // Prepare registration data
      const registrationData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        businessName: userData.businessName,
        location: userData.location,
        userType: userData.userType,
        agreeToMarketing: userData.agreeToMarketing,
      }

      // Use the new async thunk for registration
      const result = await dispatch(registerUser(registrationData))
      
      // Check if registration was successful
      if (registerUser.fulfilled.match(result)) {
        // Store tokens in localStorage
        localStorage.setItem('user', JSON.stringify(result.payload.user))
        localStorage.setItem('token', result.payload.tokens?.accessToken || result.payload.token)
        localStorage.setItem('refreshToken', result.payload.tokens?.refreshToken || result.payload.refreshToken)
        
        // Show success message
        dispatch(addToast({
          message: 'Account created successfully! Welcome to Fixer!',
          severity: 'success'
        }))
        
        // Small delay for better UX
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        // Handle registration failure
        const errorMessage = typeof result.payload === 'string' ? result.payload : 'Registration failed. Please try again.'
        setError(errorMessage)
        dispatch(addToast({
          message: errorMessage,
          severity: 'error'
        }))
      }
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed. Please try again.'
      setError(errorMessage)
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }))
    }
  }

  const features = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      title: 'Grow Your Business',
      description: 'Access tools and insights to scale your service business efficiently'
    },
    {
      icon: <GroupIcon sx={{ fontSize: 32 }} />,
      title: 'Connect with Customers',
      description: 'Build lasting relationships with clients through our platform'
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 32 }} />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security protecting your business data'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 32 }} />,
      title: 'Fast & Efficient',
      description: 'Streamlined workflows to help you work smarter, not harder'
    },
    {
      icon: <SupportIcon sx={{ fontSize: 32 }} />,
      title: '24/7 Support',
      description: 'Round-the-clock assistance when you need it most'
    },
    {
      icon: <StarIcon sx={{ fontSize: 32 }} />,
      title: 'Premium Features',
      description: 'Access to advanced tools and exclusive business features'
    }
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1, sm: 2 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 4s ease-in-out infinite reverse',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
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
          <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                maxWidth: { xs: '100%', lg: 500 },
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                order: { xs: 2, lg: 1 },
                borderRadius: 3,
              }}
            >
              <Zoom in timeout={1000} style={{ transitionDelay: '400ms' }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h3" sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '1.75rem', sm: '2.5rem' },
                    background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Join Thousands of Successful Service Providers
                  </Typography>
                  <Typography variant="h6" sx={{
                    opacity: 0.9,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    lineHeight: 1.6,
                  }}>
                    Transform your service business with our comprehensive platform designed for growth and success.
                  </Typography>
                </Box>
              </Zoom>

              <Stack spacing={{ xs: 2, sm: 3 }}>
                {features.map((feature, index) => (
                  <Slide
                    key={index}
                    direction="right"
                    in
                    timeout={600}
                    style={{ transitionDelay: `${600 + index * 100}ms` }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(8px)',
                      },
                    }}>
                      <Box
                        sx={{
                          width: { xs: 48, sm: 56 },
                          height: { xs: 48, sm: 56 },
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1rem', sm: '1.125rem' },
                          mb: 0.5,
                        }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" sx={{
                          opacity: 0.8,
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          lineHeight: 1.5,
                        }}>
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Slide>
                ))}
              </Stack>

              {/* Stats Section */}
              <Fade in timeout={1000} style={{ transitionDelay: '1200ms' }}>
                <Box sx={{ 
                  mt: 4, 
                  p: 3, 
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    textAlign: 'center',
                  }}>
                    Trusted by Industry Leaders
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}>
                    {[
                      { number: '10K+', label: 'Active Users' },
                      { number: '50K+', label: 'Jobs Completed' },
                      { number: '4.9★', label: 'Rating' },
                      { number: '99.9%', label: 'Uptime' },
                    ].map((stat, index) => (
                      <Box key={index} sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        }}>
                          {stat.number}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          opacity: 0.8,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Fade>
            </Paper>
          </Fade>

          {/* Signup Form */}
          <Fade in timeout={800} style={{ transitionDelay: '400ms' }}>
            <Box sx={{ order: { xs: 1, lg: 2 } }}>
              <SignupForm onSignup={handleSignup} isLoading={isLoading} error={error} />
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  )
}
