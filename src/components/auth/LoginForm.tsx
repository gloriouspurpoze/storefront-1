import React, { useState } from 'react'
import {
  Building2,
  Mail,
  Lock,
  LogIn,
  Shield,
  UserCog,
  Wrench,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { AuthService } from '../../services/api/auth.service'
import { cn } from '../../lib/utils'

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => void
  isLoading?: boolean
  error?: string
}

const TEST_ACCOUNTS: {
  id: string
  label: string
  email: string
  password: string
  role: string
  color: string
  icon: React.ReactNode
}[] = [
  {
    id: 'superadmin',
    label: 'Super Admin',
    email: 'superadmin@profixer.in',
    password: 'SuperAdmin@123',
    role: 'Super Admin',
    color: '#d32f2f',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: 'admin',
    label: 'Admin',
    email: 'admin@fixer.com',
    password: 'Admin@123',
    role: 'Admin',
    color: '#1976d2',
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    id: 'Professional',
    label: 'Professional',
    email: 'zillur.rahman@professional.com',
    password: 'SecurePass123!',
    role: 'Professional',
    color: '#6b21a8',
    icon: <Wrench className="h-5 w-5" />,
  },
]

export function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    email: 'admin@fixer.com',
    password: 'Admin@123',
    rememberMe: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [quickLoginValue, setQuickLoginValue] = useState('admin')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

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
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleForgotPassword = () => {
    setForgotEmail(formData.email || '')
    setForgotOpen(true)
  }

  const handleForgotSubmit = async () => {
    const email = forgotEmail.trim()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      dispatch(
        addToast({
          message: 'Please enter a valid email address.',
          severity: 'warning',
        }),
      )
      return
    }
    setForgotSubmitting(true)
    try {
      const res = (await AuthService.forgotPassword({ email })) as { success?: boolean }
      if (res?.success !== false) {
        dispatch(
          addToast({
            message:
              'If an account exists for this email, you will receive reset instructions shortly.',
            severity: 'success',
          }),
        )
        setForgotOpen(false)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not send reset email. Try again later.'
      dispatch(addToast({ message: msg, severity: 'error' }))
    } finally {
      setForgotSubmitting(false)
    }
  }

  const handleQuickLogin = (accountId: string) => {
    const account = TEST_ACCOUNTS.find((acc) => acc.id === accountId)
    if (account) {
      setQuickLoginValue(accountId)
      setFormData({
        email: account.email,
        password: account.password,
        rememberMe: true,
      })
      dispatch(
        addToast({
          message: `Credentials loaded for ${account.role}. Click Sign In to proceed.`,
          severity: 'success',
        }),
      )
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-[480px] shadow-md">
          <CardContent className="p-4 sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary sm:h-16 sm:w-16"
              >
                <Building2 className="h-6 w-6 text-primary-foreground sm:h-8 sm:w-8" />
              </div>
              <h1 className="text-xl font-bold sm:text-3xl">Welcome Back</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Sign in to your Fixer Admin account
              </p>
            </div>

            {error && (
              <div
                className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div
                className="rounded-lg p-4 text-white"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-white" />
                  <span className="text-sm font-semibold sm:text-base">Quick Login (Dev Mode)</span>
                </div>
                <Select
                  value={quickLoginValue}
                  onValueChange={(v) => handleQuickLogin(v)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-white/30 bg-white/15 text-white [&_svg]:text-white">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_ACCOUNTS.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex w-full items-center gap-2 py-0.5">
                          <span style={{ color: account.color }}>{account.icon}</span>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="font-semibold">{account.label}</div>
                            <div className="text-xs text-muted-foreground">{account.email}</div>
                          </div>
                          <Badge
                            className="shrink-0 text-[0.7rem] text-white"
                            style={{ backgroundColor: account.color }}
                          >
                            {account.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[0.7rem] text-white/80 sm:text-xs">
                  Select a test account to auto-fill credentials
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                  <span className="bg-card px-2">Or enter manually</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    className={cn('pl-9', errors.email && 'border-destructive')}
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={cn('pl-9 pr-10', errors.password && 'border-destructive')}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(c) =>
                      setFormData((prev) => ({ ...prev, rememberMe: c === true }))
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-left text-sm text-primary underline-offset-4 hover:underline sm:text-right"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full py-5 text-sm sm:py-6 sm:text-base" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-card px-2">Or</span>
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3 sm:p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold sm:text-sm">Secure Login</span>
                </div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Your data is protected with enterprise-grade security and encryption.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={forgotOpen} onOpenChange={(o) => !forgotSubmitting && !o && setForgotOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter your account email. We will send a link to reset your password if the account exists.
          </p>
          <Input
            autoFocus
            type="email"
            placeholder="Email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            disabled={forgotSubmitting}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleForgotSubmit()} disabled={forgotSubmitting}>
              {forgotSubmitting ? 'Sending…' : 'Send link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
