import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserRound,
  UserX,
  Wand2,
} from 'lucide-react'
import { usePermissions } from '../../../hooks/usePermissions'
import { useToast } from '../../../components/ui'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Separator } from '../../../components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { PermissionChipPicker } from '../../../components/users/PermissionChipPicker'
import { usersService } from '../../../services/api/users.service'
import type { UpdateUserRequest } from '../../../services/api/users.service'
import type { User } from '../../../types'
import type { Permission, UserRole } from '../../../types/rbac.types'
import { getRolePermissions } from '../../../config/rbac.config'
import { sanitizePermissions } from '../../../lib/sanitizePermissions'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { updateUser as mergeAuthUser } from '../../../store/slices/authSlice'

type AccessStrategy = 'union' | 'explicit_only' | 'clear_scoped'

const SELECTABLE_ROLES: UserRole[] = ['super_admin', 'admin', 'manager', 'staff']

function isDashboardAccessAccount(u: User): boolean {
  return (
    u.userType === 'admin' || u.userType === 'super_admin' || u.isDashboardMember === true
  )
}

function hasScopedRbac(u: User): boolean {
  return (
    u.rbacRole != null ||
    u.rbacPermissionMode != null ||
    (sanitizePermissions(u.permissions).length ?? 0) > 0
  )
}

function inferStrategy(u: User): AccessStrategy {
  if (!isDashboardAccessAccount(u)) return 'clear_scoped'
  if (!hasScopedRbac(u)) return 'clear_scoped'
  if (u.rbacPermissionMode === 'explicit') return 'explicit_only'
  if (u.rbacPermissionMode === 'role_plus') return 'union'
  return 'union'
}

function buildRbacUpdate(
  strategy: AccessStrategy,
  baseRole: UserRole,
  chips: Permission[],
): Pick<UpdateUserRequest, 'rbacRole' | 'rbacPermissionMode' | 'permissions'> {
  if (strategy === 'clear_scoped') {
    return { rbacRole: null, rbacPermissionMode: null, permissions: null }
  }
  const clean = sanitizePermissions(chips)
  if (strategy === 'explicit_only') {
    return {
      rbacRole: baseRole,
      rbacPermissionMode: 'explicit',
      permissions: clean,
    }
  }
  return {
    rbacRole: baseRole,
    rbacPermissionMode: 'role_plus',
    permissions: clean,
  }
}

export function AssignTeamAccessPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((s) => s.auth.user)
  const { checkPermission } = usePermissions()

  const canEditRbac = checkPermission('manage_user_roles') || checkPermission('edit_users')
  const canDeleteUser = checkPermission('delete_users')
  const canDeactivate = checkPermission('edit_users') || checkPermission('manage_user_roles')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [members, setMembers] = useState<User[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [strategy, setStrategy] = useState<AccessStrategy>('clear_scoped')
  const [baseRole, setBaseRole] = useState<UserRole>('staff')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(() => new Set())

  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 320)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadMembers = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await usersService.getUsers({
        scope: 'members',
        page: 1,
        limit: 80,
        ...(debouncedSearch.length >= 2 ? { search: debouncedSearch } : {}),
      })
      setMembers(res.users)
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not load team',
        description: e instanceof Error ? e.message : 'Request failed',
      })
      setMembers([])
    } finally {
      setListLoading(false)
    }
  }, [debouncedSearch, toast])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const applyUserToForm = useCallback((u: User) => {
    setStrategy(inferStrategy(u))
    setBaseRole(
      u.rbacRole && SELECTABLE_ROLES.includes(u.rbacRole) ? u.rbacRole : 'staff',
    )
    setSelectedPermissions(new Set(sanitizePermissions(u.permissions)))
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDetailUser(null)
      return
    }
    let cancelled = false
    void (async () => {
      setDetailLoading(true)
      try {
        const u = await usersService.getUserById(selectedId)
        if (cancelled) return
        setDetailUser(u)
        applyUserToForm(u)
      } catch (e) {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Could not load user',
            description: e instanceof Error ? e.message : 'Request failed',
          })
          setDetailUser(null)
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, applyUserToForm, toast])

  const dirty = useMemo(() => {
    if (!detailUser) return false
    const origStrategy = inferStrategy(detailUser)
    const origRole =
      detailUser.rbacRole && SELECTABLE_ROLES.includes(detailUser.rbacRole)
        ? detailUser.rbacRole
        : 'staff'
    const origPerms = new Set(sanitizePermissions(detailUser.permissions))
    if (strategy !== origStrategy || baseRole !== origRole) return true
    if (origPerms.size !== selectedPermissions.size) return true
    for (const p of Array.from(selectedPermissions)) {
      if (!origPerms.has(p)) return true
    }
    return false
  }, [detailUser, strategy, baseRole, selectedPermissions])

  const handleSave = async () => {
    if (!detailUser || !canEditRbac) return
    if (!isDashboardAccessAccount(detailUser)) {
      toast({
        variant: 'destructive',
        title: 'Not a dashboard account',
        description: 'Scoped access applies to admin and dashboard team accounts.',
      })
      return
    }
    if (strategy === 'explicit_only' && selectedPermissions.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Explicit mode needs permissions',
        description: 'Pick at least one permission, or switch to union / clear scoped.',
      })
      return
    }

    const rbac = buildRbacUpdate(strategy, baseRole, Array.from(selectedPermissions))

    setSaving(true)
    try {
      const updated = await usersService.updateUser(detailUser.id, {
        ...(isDashboardAccessAccount(detailUser) ? rbac : {}),
      })
      setDetailUser(updated)
      applyUserToForm(updated)
      void loadMembers()
      if (currentUser?.id === updated.id) {
        dispatch(
          mergeAuthUser({
            rbacRole: updated.rbacRole,
            rbacPermissionMode: updated.rbacPermissionMode,
            permissions: updated.permissions,
          }),
        )
      }
      toast({ title: 'Access updated', description: updated.email })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Request failed',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReloadDetail = async () => {
    if (!selectedId) return
    setDetailLoading(true)
    try {
      const u = await usersService.getUserById(selectedId)
      setDetailUser(u)
      applyUserToForm(u)
      toast({ title: 'Reloaded', description: u.email })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Reload failed',
        description: e instanceof Error ? e.message : 'Request failed',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const mergeRoleTemplateIntoChips = (role: UserRole) => {
    const next = new Set(selectedPermissions)
    getRolePermissions(role).forEach((p) => next.add(p))
    setSelectedPermissions(next)
    toast({ title: 'Merged template', description: `Added defaults for ${role.replace(/_/g, ' ')}.` })
  }

  const handleDeactivate = async () => {
    if (!detailUser || !canDeactivate) return
    const nextActive = detailUser.isActive === false
    try {
      await usersService.toggleUserStatus(detailUser.id, nextActive)
      const u = await usersService.getUserById(detailUser.id)
      setDetailUser(u)
      applyUserToForm(u)
      void loadMembers()
      toast({
        title: nextActive ? 'Account activated' : 'Account deactivated',
        description: u.email,
      })
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Status update failed',
        description: e instanceof Error ? e.message : 'Request failed',
      })
    }
  }

  const confirmDeleteUser = async () => {
    if (!detailUser || !canDeleteUser) return
    setDeleteLoading(true)
    try {
      await usersService.deleteUser(detailUser.id)
      toast({ title: 'User deleted', description: detailUser.email })
      setDeleteOpen(false)
      setSelectedId(null)
      setDetailUser(null)
      void loadMembers()
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Request failed',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Search dashboard team members, then narrow or expand what they can do. Changes persist through{' '}
          <code className="rounded bg-muted px-1 text-xs">PUT /users/update/:id</code>.{' '}
          <Link to="/users/members" className="font-medium text-primary underline-offset-4 hover:underline">
            Open full team table
          </Link>{' '}
          for profile and invites.
        </p>
        {!canEditRbac ? (
          <Badge variant="outline" className="shrink-0">
            View only — need manage_user_roles or edit_users
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <Card className="min-h-[420px] lg:min-h-[560px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team members</CardTitle>
            <CardDescription>Type at least two letters to search.</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search team members"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[min(480px,55vh)] overflow-y-auto p-2 pt-0">
            {listLoading ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
              </div>
            ) : members.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No members match.</p>
            ) : (
              <ul className="space-y-1">
                {members.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      className={`flex w-full flex-col rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        selectedId === u.id
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent hover:bg-accent/80'
                      }`}
                    >
                      <span className="font-medium">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] font-normal capitalize">
                          {u.userType?.replace(/_/g, ' ') || '—'}
                        </Badge>
                        {u.isActive === false ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Inactive
                          </Badge>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[420px] lg:min-h-[560px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Access editor</CardTitle>
            <CardDescription>
              Union merges chips with the role template. Explicit uses only the chips (recommended for tight
              least-privilege).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedId ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Select someone from the list.
              </p>
            ) : detailLoading ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
              </div>
            ) : !detailUser ? (
              <p className="py-16 text-center text-sm text-destructive">Could not load this user.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <UserRound className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {detailUser.firstName} {detailUser.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {detailUser.userType?.replace(/_/g, ' ')}
                        </Badge>
                        {detailUser.rbacRole ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            rbac: {detailUser.rbacRole}
                          </Badge>
                        ) : null}
                        {detailUser.rbacPermissionMode ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            mode: {detailUser.rbacPermissionMode}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void handleReloadDetail()}>
                      <RotateCcw className="mr-1 h-4 w-4" aria-hidden />
                      Reload
                    </Button>
                  </div>
                </div>

                {!isDashboardAccessAccount(detailUser) ? (
                  <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                    Scoped RBAC applies to admin / super-admin and flagged dashboard members only. Use the team
                    table to change account type if needed.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Access strategy</Label>
                        <Select
                          value={strategy}
                          onValueChange={(v) => setStrategy(v as AccessStrategy)}
                          disabled={!canEditRbac}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clear_scoped">Full template (clear scoped fields)</SelectItem>
                            <SelectItem value="union">Union — role + optional chips</SelectItem>
                            <SelectItem value="explicit_only">Explicit — chips only</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Clearing removes custom RBAC so the account behaves like a full admin profile (same as
                          Team dialog “full admin”).
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Route role</Label>
                        <Select
                          value={baseRole}
                          onValueChange={(v) => setBaseRole(v as UserRole)}
                          disabled={!canEditRbac || strategy === 'clear_scoped'}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SELECTABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="font-mono capitalize">
                                {r.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Used for route allow-lists and template merging (union mode).
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!canEditRbac || strategy === 'clear_scoped'}
                        onClick={() => mergeRoleTemplateIntoChips(baseRole)}
                      >
                        <Wand2 className="mr-1 h-4 w-4" aria-hidden />
                        Merge {baseRole.replace(/_/g, ' ')} template into chips
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEditRbac || strategy === 'clear_scoped'}
                        onClick={() => setSelectedPermissions(new Set())}
                      >
                        Clear chips
                      </Button>
                    </div>

                    <PermissionChipPicker
                      selected={selectedPermissions}
                      onChange={setSelectedPermissions}
                      disabled={!canEditRbac || strategy === 'clear_scoped'}
                    />

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={!canEditRbac || !dirty || saving}
                        onClick={() => void handleSave()}
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Save className="mr-2 h-4 w-4" aria-hidden />
                        )}
                        Save access
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!canEditRbac || saving}
                        onClick={() => detailUser && applyUserToForm(detailUser)}
                      >
                        Discard edits
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-destructive">Danger zone</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canDeactivate || saving}
                          onClick={() => void handleDeactivate()}
                        >
                          <UserX className="mr-1 h-4 w-4" aria-hidden />
                          {detailUser.isActive === false ? 'Activate account' : 'Deactivate account'}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={!canDeleteUser || saving}
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                          Delete user
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Delete is permanent. Deactivate keeps the record but blocks sign-in.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete user?"
        message={
          detailUser
            ? `This removes ${detailUser.email} from the directory. Consider deactivating instead if you only need to block access.`
            : ''
        }
        confirmText="Delete"
        severity="error"
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteOpen(false)}
        onConfirm={() => void confirmDeleteUser()}
      />
    </div>
  )
}
