import React, { useState, useEffect, useRef } from 'react'
import { CloudUpload, X, Shield, Copy, BookmarkPlus, Trash2 } from 'lucide-react'
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
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { cn, getInitials } from '../../lib/utils'
import type { User } from '../../types'
import type { Permission, RbacPermissionMode, UserRole } from '../../types/rbac.types'
import { getRolePermissions } from '../../config/rbac.config'
import { DASHBOARD_ACCESS_MODULES } from '../../config/dashboard-access-modules'
import { PermissionChipPicker } from './PermissionChipPicker'
import {
  deleteRbacTemplate,
  loadRbacTemplates,
  upsertRbacTemplate,
  type RbacAccessTemplate,
} from '../../lib/rbacTemplatesStorage'

type AccessPreset = 'full' | 'manager' | 'staff' | 'explicit'

type FormUser = Partial<User> & { password?: string; clearDashboardRbac?: boolean }

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (user: FormUser) => Promise<void>
  user?: User | null
  mode: 'create' | 'edit'
  /** App directory vs team members invite flow. */
  accountVariant?: 'directory' | 'members'
  /** Dashboard users to copy RBAC from (e.g. same list page). */
  cloneFromUsers?: User[]
  /** Tenant scope for saved templates in localStorage. */
  tenantId?: string | null
}

function inferPreset(u: User | null | undefined): AccessPreset {
  if (!u || (u.userType !== 'admin' && u.userType !== 'super_admin')) return 'full'
  if (u.rbacPermissionMode === 'explicit') return 'explicit'
  if (u.rbacRole === 'manager') return 'manager'
  if (u.rbacRole === 'staff') return 'staff'
  return 'full'
}

function permissionsFromLegacyTemplateKeys(selected: Set<string>): Permission[] {
  const out: Permission[] = []
  for (const mod of DASHBOARD_ACCESS_MODULES) {
    if (selected.has(mod.id)) {
      out.push(...mod.viewPermissions)
    }
    for (const ex of mod.extras || []) {
      if (selected.has(`${mod.id}:${ex.key}`)) {
        out.push(...ex.permissions)
      }
    }
  }
  return Array.from(new Set(out))
}

function presetToRbac(
  preset: AccessPreset,
  chipPerms: Permission[],
  explicitRouteRole: UserRole,
): {
  rbacRole?: UserRole
  rbacPermissionMode?: RbacPermissionMode
  permissions?: Permission[]
} {
  switch (preset) {
    case 'full':
      return {}
    case 'manager':
      return {
        rbacRole: 'manager',
        rbacPermissionMode: 'explicit',
        permissions: chipPerms,
      }
    case 'staff':
      return {
        rbacRole: 'staff',
        rbacPermissionMode: 'explicit',
        permissions: chipPerms,
      }
    case 'explicit':
      return {
        rbacRole: explicitRouteRole,
        rbacPermissionMode: 'explicit',
        permissions: chipPerms,
      }
    default:
      return {}
  }
}

const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  user,
  mode,
  accountVariant = 'directory',
  cloneFromUsers = [],
  tenantId,
}) => {
  const [formData, setFormData] = useState<FormUser>({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    userType: 'customer',
    isVerified: false,
    isActive: true,
    profilePicture: '',
    password: '',
  })
  const [accessPreset, setAccessPreset] = useState<AccessPreset>('full')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(() => new Set())
  const [explicitRouteRole, setExplicitRouteRole] = useState<UserRole>('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedTemplates, setSavedTemplates] = useState<RbacAccessTemplate[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const isDashboardUser = formData.userType === 'admin' || formData.userType === 'super_admin'
  const useEmailInvite = accountVariant === 'members' && mode === 'create'

  useEffect(() => {
    if (open) {
      setSavedTemplates(loadRbacTemplates(tenantId))
    }
  }, [open, tenantId])

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username || '',
        phone: user.phone || '',
        userType: user.userType === 'super_admin' ? 'admin' : user.userType,
        isVerified: user.isVerified,
        isActive: user.isActive ?? true,
        profilePicture: user.profilePicture || '',
        rbacRole: user.rbacRole,
        rbacPermissionMode: user.rbacPermissionMode,
        permissions: user.permissions,
      })
      setAccessPreset(inferPreset(user))
      setSelectedPermissions(new Set((user.permissions || []) as Permission[]))
      setExplicitRouteRole(
        user.rbacPermissionMode === 'explicit' && user.rbacRole ? user.rbacRole : 'staff',
      )
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        username: '',
        phone: '',
        userType: accountVariant === 'members' ? 'admin' : 'customer',
        isVerified: false,
        isActive: true,
        profilePicture: '',
        password: '',
      })
      setAccessPreset('full')
      setSelectedPermissions(new Set())
      setExplicitRouteRole('staff')
    }
    setError(null)
    setErrors({})
  }, [user, mode, open, accountVariant])

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
    if (useEmailInvite) {
      const u = formData.username?.trim() || ''
      const simpleHandleOk = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,39}$/.test(u)
      const emailLoginIdOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u) && u.length <= 254
      if (!u) {
        newErrors.username = 'Username is required'
      } else if (!simpleHandleOk && !emailLoginIdOk) {
        newErrors.username =
          'Use 2–40 characters (start with a letter or number, then letters, numbers, . _ -), or a valid email (max 254 characters).'
      }
    }
    if (mode === 'create' && !useEmailInvite && !formData.password?.trim()) {
      newErrors.password = 'Password is required'
    }
    if (mode === 'create' && !useEmailInvite && formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      } else if (!STRONG_PASSWORD.test(formData.password)) {
        newErrors.password =
          'Use upper & lowercase, a number, and a special character (@$!%*?&)'
      }
    }
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format'
    }

    if (isDashboardUser && accessPreset !== 'full') {
      if (!selectedPermissions.has('view_dashboard')) {
        newErrors.dashboard = 'Scoped access must include Dashboard (overview)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAccessPresetChange = (v: AccessPreset) => {
    setAccessPreset(v)
    if (v === 'staff') {
      setSelectedPermissions(new Set(getRolePermissions('staff')))
    } else if (v === 'manager') {
      setSelectedPermissions(new Set(getRolePermissions('manager')))
    } else if (v === 'full') {
      setSelectedPermissions(new Set())
    }
  }

  const handleChange = (field: keyof FormUser, value: string | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }

  const applyAccessFromUser = (source: User) => {
    setAccessPreset(inferPreset(source))
    setSelectedPermissions(new Set((source.permissions || []) as Permission[]))
    if (source.rbacPermissionMode === 'explicit' && source.rbacRole) {
      setExplicitRouteRole(source.rbacRole)
    }
  }

  const handleCloneFromSelect = (userId: string) => {
    if (userId === '__none__') return
    const src = cloneFromUsers.find((u) => u.id === userId)
    if (src) applyAccessFromUser(src)
  }

  const handleApplyTemplate = (templateId: string) => {
    if (templateId === '__none__') return
    const t = savedTemplates.find((x) => x.id === templateId)
    if (!t) return
    setAccessPreset(t.preset as AccessPreset)
    if (t.permissions && t.permissions.length > 0) {
      setSelectedPermissions(new Set(t.permissions))
    } else if (t.explicitKeys?.length) {
      setSelectedPermissions(new Set(permissionsFromLegacyTemplateKeys(new Set(t.explicitKeys))))
    } else {
      setSelectedPermissions(new Set())
    }
    if (t.rbacRole) setExplicitRouteRole(t.rbacRole)
  }

  const handleSaveTemplate = () => {
    const name = newTemplateName.trim()
    if (!name) return
    const next = upsertRbacTemplate(tenantId, {
      name,
      preset: accessPreset,
      explicitKeys: [],
      permissions: Array.from(selectedPermissions),
      rbacRole: accessPreset === 'explicit' ? explicitRouteRole : undefined,
    })
    setSavedTemplates(next)
    setNewTemplateName('')
  }

  const handleDeleteTemplate = (id: string) => {
    setSavedTemplates(deleteRbacTemplate(tenantId, id))
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const chipList = Array.from(selectedPermissions)
      const rbac = isDashboardUser
        ? presetToRbac(accessPreset, chipList, explicitRouteRole)
        : {}
      const payload: FormUser = {
        ...formData,
        ...rbac,
        clearDashboardRbac: Boolean(isDashboardUser && accessPreset === 'full'),
      }
      if (payload.clearDashboardRbac) {
        delete payload.rbacRole
        delete payload.rbacPermissionMode
        delete payload.permissions
      }

      await onSubmit(payload)
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
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto sm:max-w-2xl',
          isDashboardUser && 'sm:max-w-3xl',
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-2">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create'
              ? accountVariant === 'members'
                ? 'Invite team member'
                : 'Add app user'
              : accountVariant === 'members'
                ? 'Edit team member'
                : 'Edit user'}
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
            <Button type="button" variant="ghost" size="sm" className="ml-2 h-6" onClick={() => setError(null)}>
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
            <input
              ref={photoInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => photoInputRef.current?.click()}
            >
              <CloudUpload className="mr-2 h-4 w-4" />
              Upload Photo
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
          {useEmailInvite && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="uf-username">Username *</Label>
              <Input
                id="uf-username"
                value={formData.username || ''}
                onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                placeholder="e.g. alex.kumar or name@company.com"
                autoComplete="off"
                className={cn(errors.username && 'border-destructive')}
              />
              {errors.username ? (
                <p className="text-xs text-destructive">{errors.username}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sign-in id: a short handle or a work-style email. Invites are sent to the <strong>Email</strong> field
                  above (it can be a different address).
                </p>
              )}
            </div>
          )}
          {accountVariant === 'members' && mode === 'edit' && formData.username ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Username</Label>
              <Input value={formData.username} readOnly className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Login id cannot be changed here yet.</p>
            </div>
          ) : null}
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

          {mode === 'create' && useEmailInvite && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground sm:col-span-2">
              <p className="font-medium text-foreground">Email invitation</p>
              <p className="mt-1">
                We’ll email this address a <strong>temporary password</strong>, their <strong>username</strong>, and a
                link to set a final password. They sign in with this <strong>username + password</strong> (not the invite
                inbox alone — they need the login id you set).
                Configure SMTP on the API (<code className="rounded bg-muted px-1 text-xs">SMTP_*</code>) for delivery.
              </p>
            </div>
          )}
          {mode === 'create' && !useEmailInvite && (
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
                <p className="text-xs text-muted-foreground">
                  8+ chars with upper, lower, number, and special (@$!%*?&)
                </p>
              )}
            </div>
          )}

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-primary">User Type &amp; Status</h3>
          </div>

          <div className="space-y-1.5">
            <Label>User Type</Label>
            {accountVariant === 'members' ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Dashboard team account <span className="font-medium text-foreground">(admin access)</span>
              </div>
            ) : (
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
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            )}
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

          {isDashboardUser && (
            <>
              <div className="sm:col-span-2">
                <Separator className="my-1" />
              </div>
              <div className="sm:col-span-2">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Shield className="h-4 w-4" />
                  Dashboard access control
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Pick a template, then toggle permission chips. Staff and Manager start from that role&apos;s default
                  modules; only checked chips grant access (stored as{' '}
                  <span className="font-mono">rbac_permission_mode: explicit</span>). Full admin clears scoped RBAC.
                </p>
                <div className="space-y-1.5">
                  <Label>Access template</Label>
                  <Select value={accessPreset} onValueChange={(v) => handleAccessPresetChange(v as AccessPreset)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full admin (default)</SelectItem>
                      <SelectItem value="manager">Manager (operations template)</SelectItem>
                      <SelectItem value="staff">Staff (read-heavy template)</SelectItem>
                      <SelectItem value="explicit">Custom modules (explicit only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      Clone access from user
                    </Label>
                    <Select
                      onValueChange={(id) => {
                        handleCloneFromSelect(id)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dashboard user…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Clear picker —</SelectItem>
                        {cloneFromUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} · {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cloneFromUsers.length === 0 && (
                      <p className="text-xs text-muted-foreground">No other dashboard users in the current list.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <BookmarkPlus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      Apply saved template
                    </Label>
                    <Select onValueChange={(id) => handleApplyTemplate(id)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {savedTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Templates are stored in this browser per tenant ({tenantId || 'global'}).
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="uf-tpl-name">Save current access as template</Label>
                    <Input
                      id="uf-tpl-name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. Support lead — bookings only"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    disabled={!newTemplateName.trim()}
                    onClick={handleSaveTemplate}
                  >
                    Save template
                  </Button>
                </div>

                {savedTemplates.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {savedTemplates.map((t) => (
                      <Badge key={t.id} variant="secondary" className="gap-1 pr-1 font-normal">
                        {t.name}
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-muted-foreground/20"
                          aria-label={`Delete template ${t.name}`}
                          onClick={() => handleDeleteTemplate(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {accessPreset !== 'full' && (
                <div className="sm:col-span-2 space-y-3 rounded-md border border-border bg-muted/30 p-3">
                  {accessPreset === 'explicit' && (
                    <div className="space-y-1.5">
                      <Label>Route baseline role (explicit)</Label>
                      <Select
                        value={explicitRouteRole}
                        onValueChange={(v) => setExplicitRouteRole(v as UserRole)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Stored as <span className="font-mono">rbac_role</span>; access is still driven by the chip list.
                      </p>
                    </div>
                  )}
                  {(accessPreset === 'staff' || accessPreset === 'manager') && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">rbac_role</span> is {accessPreset}; remove chips to narrow access —
                      unchecked modules stay blocked.
                    </p>
                  )}
                  <PermissionChipPicker
                    selected={selectedPermissions}
                    onChange={setSelectedPermissions}
                    disabled={loading}
                  />
                  {errors.dashboard && <p className="text-xs text-destructive">{errors.dashboard}</p>}
                </div>
              )}
            </>
          )}
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
