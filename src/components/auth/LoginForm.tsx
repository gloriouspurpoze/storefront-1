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
  useMediaQuery,
  Stack,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material'
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Google as GoogleIcon,
  Apple as AppleIcon,
  Facebook as FacebookIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  SupervisorAccount as SuperAdminIcon,
  AdminPanelSettings as AdminIcon,
  Build as ProviderIcon,
  FlashOn as QuickLoginIcon,
} from '@mui/icons-material'

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => void
  isLoading?: boolean
  error?: string
}

// Quick Login Test Accounts (Dev Mode)
const TEST_ACCOUNTS = [
  {
    id: 'superadmin',
    label: '🔐 Super Admin',
    email: 'superadmin@fixer.com',
    password: 'SuperAdmin@123',
    role: 'Super Admin',
    icon: <SuperAdminIcon />,
    color: '#d32f2f',
  },
  {
    id: 'admin',
    label: '👨‍💼 Admin',
    email: 'admin@fixer.com',
    password: 'Admin@123',
    role: 'Admin',
    icon: <AdminIcon />,
    color: '#1976d2',
  },
  {
    id: 'Professional',
    label: '🔧 Professional',
    email: 'zillur.rahman@professional.com',
    password: 'SecurePass123!',
    role: 'Professional',
  },
]

export function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: 'admin@fixer.com',
    password: 'Admin@123',
    rememberMe: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'success' | 'error' | 'warning' | 'info' })
  const [quickLoginValue, setQuickLoginValue] = useState('admin')

  const theme = useTheme()

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    
    if (validateForm()) {
      onLogin(formData)
    }
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleSocialLogin = (provider: string) => {
    setSnackbar({ open: true, message: `${provider} login coming soon`, severity: 'info' })
  }

  const handleForgotPassword = () => {
    setSnackbar({ open: true, message: 'Password reset feature coming soon', severity: 'info' })
  }

  const handleQuickLogin = (accountId: string) => {
    const account = TEST_ACCOUNTS.find(acc => acc.id === accountId)
    if (account) {
      setQuickLoginValue(accountId)
      setFormData({
        email: account.email,
        password: account.password,
        rememberMe: true,
      })
      setSnackbar({ 
        open: true, 
        message: `Credentials loaded for ${account.role}. Click Sign In to proceed.`, 
        severity: 'success' 
      })
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
          maxWidth: 480, 
          boxShadow: 3,
          borderRadius: { xs: 2, sm: 3 }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  width: { xs: 48, sm: 64 },
                  height: { xs: 48, sm: 64 },
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <BusinessIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 32 } }} />
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                Sign in to your Fixer Admin account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {/* Quick Login Dropdown - Dev Mode */}
                <Paper
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <QuickLoginIcon sx={{ color: 'white', fontSize: 20 }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      🚀 Quick Login (Dev Mode)
                    </Typography>
                  </Box>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        '&.Mui-focused': { color: 'white' }
                      }}
                    >
                      Select Account Type
                    </InputLabel>
                    <Select
                      value={quickLoginValue}
                      onChange={(e) => handleQuickLogin(e.target.value)}
                      disabled={isLoading}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'white',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'white',
                        },
                      }}
                      label="Select Account Type"
                    >
                      {TEST_ACCOUNTS.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                            <Box sx={{ color: account.color }}>
                              {account.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {account.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {account.email}
                              </Typography>
                            </Box>
                            <Chip
                              label={account.role}
                              size="small"
                              sx={{
                                backgroundColor: account.color,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      display: 'block',
                      mt: 1,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    💡 Select a test account to auto-fill credentials
                  </Typography>
                </Paper>

                <Divider>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    OR ENTER MANUALLY
                  </Typography>
                </Divider>

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

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.rememberMe}
                        onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                        disabled={isLoading}
                      />
                    }
                    label="Remember me"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  />
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleForgotPassword}
                    sx={{ 
                      textDecoration: 'none',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{ 
                    py: { xs: 1.25, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Divider sx={{ my: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    OR
                  </Typography>
                </Divider>

                {/* Social Login Buttons */}
                {/* <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<GoogleIcon />}
                    onClick={() => handleSocialLogin('Google')}
                    disabled={isLoading}
                    sx={{ 
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Continue with Google
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AppleIcon />}
                    onClick={() => handleSocialLogin('Apple')}
                    disabled={isLoading}
                    sx={{ 
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Continue with Apple
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FacebookIcon />}
                    onClick={() => handleSocialLogin('Facebook')}
                    disabled={isLoading}
                    sx={{ 
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Continue with Facebook
                  </Button>
                </Stack> */}

                {/* Security Notice */}
                <Paper
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SecurityIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Secure Login
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Your data is protected with enterprise-grade security and encryption.
                  </Typography>
                </Paper>
              </Stack>
            </Box>
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
