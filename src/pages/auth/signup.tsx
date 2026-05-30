import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Star,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Headphones,
} from 'lucide-react'
import { SignupForm } from '../../components/auth/SignupForm'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { registerUser } from '../../store/slices/authSlice'
import { addToast } from '../../store/slices/uiSlice'

export function Signup() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const [error, setError] = useState<string>('')
  const location = useLocation()

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

      const result = await dispatch(registerUser(registrationData))

      if (registerUser.fulfilled.match(result)) {
        localStorage.setItem('user', JSON.stringify(result.payload.user))
        localStorage.setItem('token', result.payload.tokens?.accessToken || result.payload.token)
        localStorage.setItem('refreshToken', result.payload.tokens?.refreshToken || result.payload.refreshToken)

        dispatch(
          addToast({
            message: 'Account created successfully! Welcome to Fixer!',
            severity: 'success',
          }),
        )

        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        const errorMessage =
          typeof result.payload === 'string' ? result.payload : 'Registration failed. Please try again.'
        setError(errorMessage)
        dispatch(
          addToast({
            message: errorMessage,
            severity: 'error',
          }),
        )
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed. Please try again.'
      setError(errorMessage)
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      )
    }
  }

  const features = [
    { icon: TrendingUp, title: 'Grow Your Business', description: 'Access tools and insights to scale your service business efficiently' },
    { icon: Users, title: 'Connect with Customers', description: 'Build lasting relationships with clients through our platform' },
    { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security protecting your business data' },
    { icon: Zap, title: 'Fast & Efficient', description: 'Streamlined workflows to help you work smarter, not harder' },
    { icon: Headphones, title: '24/7 Support', description: 'Round-the-clock assistance when you need it most' },
    { icon: Star, title: 'Premium Features', description: 'Access to advanced tools and exclusive business features' },
  ]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#024ad8] to-[#0e3191] p-2 sm:p-4">
      <div
        className="pointer-events-none absolute left-[10%] top-[10%] h-24 w-24 animate-[float_6s_ease-in-out_infinite] rounded-full bg-white/10"
        style={{ animation: 'float 6s ease-in-out infinite' }}
      />
      <div className="pointer-events-none absolute right-[15%] top-[20%] h-14 w-14 animate-[float_4s_ease-in-out_infinite_reverse] rounded-full bg-white/[0.08]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[20%] h-20 w-20 animate-[float_8s_ease-in-out_infinite] rounded-full bg-white/[0.06]" />
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>

      <div className="relative w-full max-w-7xl px-1 sm:px-2">
        <div className="flex flex-col items-center justify-center gap-6 lg:flex-row lg:gap-10">
          <div className="order-2 w-full max-w-lg rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-xl backdrop-blur-md sm:p-6 lg:order-1">
            <div className="mb-4">
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl sm:leading-tight" style={{ WebkitTextFillColor: 'white' }}>
                Join Thousands of Successful Service Providers
              </h1>
              <p className="text-sm opacity-90 sm:text-base sm:leading-relaxed">
                Transform your service business with our comprehensive platform designed for growth and success.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {features.map((feature, index) => {
                const Ic = feature.icon
                return (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-2 transition-all hover:translate-x-1 hover:bg-white/10 sm:p-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:h-14 sm:w-14">
                      <Ic className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold sm:text-base">{feature.title}</h3>
                      <p className="text-xs opacity-80 sm:text-sm">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 rounded-lg border border-white/20 bg-white/10 p-3 sm:mt-6 sm:p-4">
              <h3 className="mb-2 text-center text-sm font-semibold sm:text-base">Trusted by Industry Leaders</h3>
              <div className="flex flex-wrap justify-around gap-2 sm:gap-3">
                {[
                  { number: '10K+', label: 'Active Users' },
                  { number: '50K+', label: 'Jobs Completed' },
                  { number: '4.9★', label: 'Rating' },
                  { number: '99.9%', label: 'Uptime' },
                ].map((stat, index) => (
                  <div key={index} className="min-w-0 text-center">
                    <p className="text-sm font-bold sm:text-lg">{stat.number}</p>
                    <p className="text-[10px] opacity-80 sm:text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 w-full max-w-md lg:order-2">
            <SignupForm onSignup={handleSignup} isLoading={isLoading} error={error} />
          </div>
        </div>
      </div>
    </div>
  )
}
