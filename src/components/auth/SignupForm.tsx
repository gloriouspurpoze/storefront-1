import React, { useState } from 'react'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  Shield,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { cn } from '../../lib/utils'

interface SignupFormProps {
  onSignup: (userData: {
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
  }) => void
  isLoading?: boolean
  error?: string
}

interface PasswordStrength {
  score: number
  feedback: string[]
  color: 'error' | 'warning' | 'info' | 'success'
}

export function SignupForm({ onSignup, isLoading = false, error }: SignupFormProps) {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    location: '',
    userType: 'customer' as 'customer' | 'provider' | 'admin',
    agreeToTerms: false,
    agreeToMarketing: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(1)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'error',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { title: 'Personal Info', description: 'Basic information' },
    { title: 'Account Details', description: 'Login credentials' },
    { title: 'Business Info', description: 'Professional details' },
    { title: 'Preferences', description: 'Terms & settings' },
  ]

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Lowercase letter')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Uppercase letter')

    if (/[0-9]/.test(password)) score += 1
    else feedback.push('Number')

    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('Special character')

    const colors: PasswordStrength['color'][] = ['error', 'warning', 'info', 'success', 'success']
    const color = colors[Math.min(score, 4)]

    return { score, feedback, color }
  }

  const strengthBarClass = (c: PasswordStrength['color']) => {
    if (c === 'error') return 'bg-destructive'
    if (c === 'warning') return 'bg-amber-500'
    if (c === 'info') return 'bg-sky-500'
    return 'bg-emerald-500'
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.userType === 'provider') {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required'
      if (!formData.location.trim()) newErrors.location = 'Location is required'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      try {
        await onSignup(formData)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }))
      }

      if (field === 'password') {
        setPasswordStrength(calculatePasswordStrength(value as string))
      }
    }

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSocialSignup = (provider: string) => {
    dispatch(
      addToast({
        message: `${provider} sign-up is not enabled on this deployment. Continue with email and password below.`,
        severity: 'info',
      }),
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-center text-lg font-semibold">Let&apos;s start with your personal information</h2>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="su-fn">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="su-fn"
                    className={cn('pl-9', errors.firstName && 'border-destructive')}
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    disabled={isLoading}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="su-ln">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="su-ln"
                    className={cn('pl-9', errors.lastName && 'border-destructive')}
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    disabled={isLoading}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="su-phone"
                  placeholder="+1 (555) 123-4567"
                  className={cn('pl-9', errors.phone && 'border-destructive')}
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={isLoading}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="pt-2 text-center">
              <Button
                type="button"
                onClick={handleNext}
                disabled={!formData.firstName || !formData.lastName || !formData.phone}
              >
                Next Step
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-center text-lg font-semibold">Create your secure account</h2>
            <div className="space-y-1.5">
              <Label htmlFor="su-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="su-email"
                  type="email"
                  className={cn('pl-9', errors.email && 'border-destructive')}
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-pw">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="su-pw"
                  type={showPassword ? 'text' : 'password'}
                  className={cn('pl-9 pr-10', errors.password && 'border-destructive')}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            {formData.password ? (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Password Strength:</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full transition-all', strengthBarClass(passwordStrength.color))}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums">{passwordStrength.score}/5</span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Missing: {passwordStrength.feedback.join(', ')}
                  </p>
                )}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="su-pw2">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="su-pw2"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={cn('pl-9 pr-10', errors.confirmPassword && 'border-destructive')}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  !formData.email ||
                  !formData.password ||
                  !formData.confirmPassword ||
                  passwordStrength.score < 3
                }
              >
                Next Step
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-center text-lg font-semibold">Tell us about your business</h2>
            <p className="text-center text-sm text-muted-foreground">How will you be using our platform?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { value: 'customer' as const, label: 'Customer', icon: '👤' },
                { value: 'provider' as const, label: 'Service Provider', icon: '🔧' },
                { value: 'admin' as const, label: 'Admin', icon: '⚙️' },
              ].map((type) => (
                <Badge
                  key={type.value}
                  variant={formData.userType === type.value ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 text-sm"
                  onClick={() => setFormData((prev) => ({ ...prev, userType: type.value }))}
                >
                  {type.icon} {type.label}
                </Badge>
              ))}
            </div>
            {formData.userType === 'provider' && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-biz">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-biz"
                      className={cn('pl-9', errors.businessName && 'border-destructive')}
                      value={formData.businessName}
                      onChange={handleInputChange('businessName')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-loc">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="su-loc"
                      placeholder="City, State"
                      className={cn('pl-9', errors.location && 'border-destructive')}
                      value={formData.location}
                      onChange={handleInputChange('location')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                </div>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  formData.userType === 'provider' && (!formData.businessName || !formData.location)
                }
              >
                Next Step
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-center text-lg font-semibold">Almost done! Review and agree to terms</h2>
            <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
              <p className="mb-2 font-semibold">Account Summary</p>
              <p>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
              </p>
              <p>
                <strong>Email:</strong> {formData.email}
              </p>
              <p>
                <strong>Phone:</strong> {formData.phone}
              </p>
              <p>
                <strong>Account Type:</strong>{' '}
                {formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)}
              </p>
              {formData.userType === 'provider' && (
                <>
                  <p>
                    <strong>Business:</strong> {formData.businessName}
                  </p>
                  <p>
                    <strong>Location:</strong> {formData.location}
                  </p>
                </>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(c) =>
                    setFormData((prev) => ({ ...prev, agreeToTerms: c === true }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                  I agree to the{' '}
                  <a href="#" className="text-primary underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              {errors.agreeToTerms && <p className="text-xs text-destructive">{errors.agreeToTerms}</p>}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  checked={formData.agreeToMarketing}
                  onCheckedChange={(c) =>
                    setFormData((prev) => ({ ...prev, agreeToMarketing: c === true }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="marketing" className="text-sm font-normal text-muted-foreground">
                  I&apos;d like to receive updates and promotional offers (optional)
                </Label>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isSubmitting || !formData.agreeToTerms}
                className="min-w-[140px]"
              >
                {isLoading || isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Create Account
                  </span>
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-[600px] shadow-md">
          <CardContent className="p-4 sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg sm:h-16 sm:w-16"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <Building2 className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
              <h1 className="text-xl font-bold sm:text-3xl">Join Fixer</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Create your account and start your journey
              </p>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex justify-between gap-1">
                {steps.map((step, index) => (
                  <div key={step.title} className="relative flex min-w-0 flex-1 flex-col items-center">
                    <div
                      className={cn(
                        'mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                        currentStep > index + 1 && 'bg-primary text-primary-foreground',
                        currentStep === index + 1 && 'bg-primary text-primary-foreground',
                        currentStep < index + 1 && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {currentStep > index + 1 ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span
                      className={cn(
                        'text-center text-[0.65rem] sm:text-xs',
                        currentStep === index + 1 ? 'font-semibold' : '',
                      )}
                    >
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-[calc(50%+1rem)] top-4 z-0 hidden h-0.5 w-[calc(100%-2rem)] sm:block',
                          currentStep > index + 1 ? 'bg-primary' : 'bg-muted',
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div
                className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>{renderStepContent()}</form>

            {currentStep === 1 && (
              <div className="mt-6">
                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    OR
                  </span>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignup('Google')}
                    disabled={isLoading}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignup('Apple')}
                    disabled={isLoading}
                  >
                    Continue with Apple
                  </Button>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/auth" className="font-semibold text-primary hover:underline">
                Sign in
              </a>
            </p>

            <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold">Secure Registration</span>
              </div>
              <p className="text-muted-foreground">
                Your information is protected with enterprise-grade security and encryption.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
