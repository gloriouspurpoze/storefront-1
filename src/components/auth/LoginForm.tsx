import React, { useState } from 'react'
import { Building2, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { AuthService } from '../../services/api/auth.service'
import { cn } from '../../lib/utils'

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => void
  isLoading?: boolean
  error?: string
}

export function LoginForm({ onLogin, isLoading = false, error }: LoginFormProps) {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const id = formData.email.trim()
    if (!id) {
      newErrors.email = 'Email or username is required'
    } else if (id.includes('@')) {
      if (!/\S+@\S+\.\S+/.test(id)) {
        newErrors.email = 'Please enter a valid email address'
      }
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,39}$/.test(id)) {
      newErrors.email = 'Username: 2–40 characters, letters/numbers, may include . _ -'
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
      const id = formData.email.trim()
      const normalized = id.includes('@') ? id : id.toLowerCase()
      onLogin({ ...formData, email: normalized })
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

  return (
    <div className="w-full">
      <Card className="border-border/80 shadow-lg shadow-black/5">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">ProFixer admin console</p>
          </div>

          {error && (
            <div
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email or username</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="text"
                  className={cn('pl-9', errors.email && 'border-destructive')}
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={isLoading}
                  autoComplete="username"
                  placeholder="you@company.com or your.username"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              <p className="text-xs text-muted-foreground">
                Team members invited by email sign in with the username from their invite, not the email address.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
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

            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(c) =>
                    setFormData((prev) => ({ ...prev, rememberMe: c === true }))
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Keep me signed in
                </Label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline sm:text-right"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                    aria-hidden
                  />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" aria-hidden />
                  Sign in
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Authorized personnel only. Contact your administrator if you need access.
          </p>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={(o) => !forgotSubmitting && !o && setForgotOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter your account email. If an account exists, we will send reset instructions.
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setForgotOpen(false)}
              disabled={forgotSubmitting}
            >
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
