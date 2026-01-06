import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Divider,
  Link,
  Alert,
  useTheme,
  Stack,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Fade,
  Slide,
  Zoom,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Google as GoogleIcon,
  Apple as AppleIcon,
} from '@mui/icons-material'

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'success' | 'error' | 'warning' | 'info' })
  const [currentStep, setCurrentStep] = useState(1)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [], color: 'error' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const theme = useTheme()

  const steps = [
    { title: 'Personal Info', description: 'Basic information' },
    { title: 'Account Details', description: 'Login credentials' },
    { title: 'Business Info', description: 'Professional details' },
    { title: 'Preferences', description: 'Terms & settings' }
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

    const colors: Array<'error' | 'warning' | 'info' | 'success'> = ['error', 'warning', 'info', 'success']
    const color = colors[Math.min(score, 4)]

    return { score, feedback, color }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Step 1 validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Step 2 validation
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

    // Step 3 validation (for providers)
    if (formData.userType === 'provider') {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required'
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required'
      }
    }

    // Step 4 validation
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

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }

    // Update password strength
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value as string))
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSocialSignup = (provider: string) => {
    setSnackbar({ open: true, message: `${provider} signup coming soon`, severity: 'info' })
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Fade in timeout={500}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                Let's start with your personal information
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  disabled={isLoading}
                />
                
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  disabled={isLoading}
                />
              </Box>

              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="+1 (555) 123-4567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!formData.firstName || !formData.lastName || !formData.phone}
                  sx={{ minWidth: 120 }}
                >
                  Next Step
                </Button>
              </Box>
            </Stack>
          </Fade>
        )

      case 2:
        return (
          <Fade in timeout={500}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                Create your secure account
              </Typography>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Password Strength:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(passwordStrength.score / 5) * 100}
                      color={passwordStrength.color}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" color={`${passwordStrength.color}.main`}>
                      {passwordStrength.score}/5
                    </Typography>
                  </Box>
                  {passwordStrength.feedback.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Missing: {passwordStrength.feedback.join(', ')}
                    </Typography>
                  )}
                </Box>
              )}

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={handleBack} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!formData.email || !formData.password || !formData.confirmPassword || passwordStrength.score < 3}
                >
                  Next Step
                </Button>
              </Box>
            </Stack>
          </Fade>
        )

      case 3:
        return (
          <Fade in timeout={500}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                Tell us about your business
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  How will you be using our platform?
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  {[
                    { value: 'customer', label: 'Customer', icon: '👤' },
                    { value: 'provider', label: 'Service Provider', icon: '🔧' },
                    { value: 'admin', label: 'Admin', icon: '⚙️' }
                  ].map((type) => (
                    <Chip
                      key={type.value}
                      label={`${type.icon} ${type.label}`}
                      onClick={() => setFormData(prev => ({ ...prev, userType: type.value as any }))}
                      color={formData.userType === type.value ? 'primary' : 'default'}
                      variant={formData.userType === type.value ? 'filled' : 'outlined'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>

              {formData.userType === 'provider' && (
                <Slide direction="up" in timeout={300}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={formData.businessName}
                      onChange={handleInputChange('businessName')}
                      error={!!errors.businessName}
                      helperText={errors.businessName}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      disabled={isLoading}
                    />

                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={handleInputChange('location')}
                      error={!!errors.location}
                      helperText={errors.location}
                      placeholder="City, State"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      disabled={isLoading}
                    />
                  </Stack>
                </Slide>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={handleBack} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={formData.userType === 'provider' && (!formData.businessName || !formData.location)}
                >
                  Next Step
                </Button>
              </Box>
            </Stack>
          </Fade>
        )

      case 4:
        return (
          <Fade in timeout={500}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                Almost done! Review and agree to terms
              </Typography>

              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Account Summary
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {formData.firstName} {formData.lastName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {formData.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {formData.phone}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Account Type:</strong> {formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)}
                  </Typography>
                  {formData.userType === 'provider' && (
                    <>
                      <Typography variant="body2">
                        <strong>Business:</strong> {formData.businessName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {formData.location}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Paper>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange('agreeToTerms')}
                      disabled={isLoading}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link href="#" target="_blank" rel="noopener">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="#" target="_blank" rel="noopener">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />
                {errors.agreeToTerms && (
                  <Typography variant="caption" color="error">
                    {errors.agreeToTerms}
                  </Typography>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeToMarketing}
                      onChange={handleInputChange('agreeToMarketing')}
                      disabled={isLoading}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      I'd like to receive updates and promotional offers (optional)
                    </Typography>
                  }
                />
              </Stack>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={handleBack} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || isSubmitting || !formData.agreeToTerms}
                  startIcon={isLoading || isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                  sx={{ minWidth: 140 }}
                >
                  {isLoading || isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Box>
            </Stack>
          </Fade>
        )

      default:
        return null
    }
  }

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 2, sm: 4 },
        }}
      >
        <Card sx={{ 
          width: '100%', 
          maxWidth: 600, 
          boxShadow: 3,
          borderRadius: { xs: 2, sm: 3 }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
              <Zoom in timeout={600}>
                <Box
                  sx={{
                    width: { xs: 48, sm: 64 },
                    height: { xs: 48, sm: 64 },
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <BusinessIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 32 } }} />
                </Box>
              </Zoom>
              
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}>
                Join Fixer
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                Create your account and start your journey
              </Typography>
            </Box>

            {/* Progress Stepper */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                {steps.map((step, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: currentStep > index + 1 ? 'primary.main' : 
                                        currentStep === index + 1 ? 'primary.main' : 'grey.300',
                        color: currentStep > index + 1 ? 'white' : 
                               currentStep === index + 1 ? 'white' : 'grey.600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        mb: 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {currentStep > index + 1 ? <CheckCircleIcon fontSize="small" /> : index + 1}
                    </Box>
                    <Typography variant="caption" sx={{ 
                      textAlign: 'center',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: currentStep === index + 1 ? 600 : 400,
                    }}>
                      {step.title}
                    </Typography>
                    {index < steps.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 16,
                          left: '50%',
                          width: '100%',
                          height: 2,
                          backgroundColor: currentStep > index + 1 ? 'primary.main' : 'grey.300',
                          zIndex: -1,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              {renderStepContent()}
            </Box>

            {/* Social Signup */}
            {currentStep === 1 && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<GoogleIcon />}
                    onClick={() => handleSocialSignup('Google')}
                    disabled={isLoading}
                    sx={{ py: 1.5 }}
                  >
                    Continue with Google
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AppleIcon />}
                    onClick={() => handleSocialSignup('Apple')}
                    disabled={isLoading}
                    sx={{ py: 1.5 }}
                  >
                    Continue with Apple
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link href="/auth" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>

            {/* Security Notice */}
            <Paper
              sx={{
                p: 2,
                mt: 3,
                backgroundColor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Secure Registration
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your information is protected with enterprise-grade security and encryption.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
