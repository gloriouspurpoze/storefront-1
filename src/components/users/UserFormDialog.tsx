import React, { useState, useEffect } from 'react'
import { CloudUpload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn, getInitials } from '../../lib/utils'

interface User {
  id?: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'customer' | 'provider' | 'admin'
  isVerified: boolean
  profilePicture?: string
  isActive?: boolean
  password?: string
}

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (user: Partial<User>) => Promise<void>
  user?: User | null
  mode: 'create' | 'edit'
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  user,
  mode,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'customer',
    isVerified: false,
    isActive: true,
    profilePicture: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        userType: user.userType,
        isVerified: user.isVerified,
        isActive: user.isActive ?? true,
        profilePicture: user.profilePicture || '',
      })
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        userType: 'customer',
        isVerified: false,
        isActive: true,
        profilePicture: '',
        password: '',
      })
    }
    setError(null)
    setErrors({})
  }, [user, mode, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (mode === 'create' && !formData.password?.trim()) {
      newErrors.password = 'Password is required'
    }
    if (mode === 'create' && formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof User, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        handleChange('profilePicture', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-2">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-2 h-6"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-2 sm:col-span-2">
            <Avatar className="h-24 w-24">
              {formData.profilePicture ? <AvatarImage src={formData.profilePicture} alt="" /> : null}
              <AvatarFallback className="text-lg">
                {getInitials(`${formData.firstName || ''} ${formData.lastName || ''}`)}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <CloudUpload className="mr-2 h-4 w-4" />
                Upload Photo
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </Button>
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary">Basic Information</h3>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-first">First Name *</Label>
            <Input
              id="uf-first"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className={cn(errors.firstName && 'border-destructive')}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-last">Last Name *</Label>
            <Input
              id="uf-last"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className={cn(errors.lastName && 'border-destructive')}
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-email">Email *</Label>
            <Input
              id="uf-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={mode === 'edit'}
              className={cn(errors.email && 'border-destructive')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-phone">Phone</Label>
            <Input
              id="uf-phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1-555-0000"
              className={cn(errors.phone && 'border-destructive')}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {mode === 'create' && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="uf-pass">Password *</Label>
              <Input
                id="uf-pass"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={cn(errors.password && 'border-destructive')}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              )}
            </div>
          )}

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary">User Type &amp; Status</h3>
          </div>

          <div className="space-y-1.5">
            <Label>User Type</Label>
            <Select
              value={formData.userType}
              onValueChange={(v) => handleChange('userType', v as User['userType'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-6 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Switch
                id="uf-verified"
                checked={formData.isVerified}
                onCheckedChange={(c) => handleChange('isVerified', c === true)}
              />
              <Label htmlFor="uf-verified">Verified</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="uf-active"
                checked={formData.isActive}
                onCheckedChange={(c) => handleChange('isActive', c === true)}
              />
              <Label htmlFor="uf-active">Active</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
