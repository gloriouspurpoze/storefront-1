import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Users as UsersIcon,
  Shield,
  Wrench,
  ShoppingCart,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { UserTable } from '../../components/users/UserTable'
import { UserFilters } from '../../components/users/UserFilters'
import { UserFormDialog } from '../../components/users/UserFormDialog'
import { UserDetailsDialog } from '../../components/users/UserDetailsDialog'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { usersService } from '../../services/api/users.service'
import type { UpdateUserRequest } from '../../services/api/users.service'
import type { User } from '../../types'
import { cn } from '../../lib/utils'
import { useAppSelector } from '../../store/hooks'

interface UserStats {
  total: number
  admins: number
  providers: number
  customers: number
  verified: number
  unverified: number
}

const iconColor: Record<string, string> = {
  primary: 'text-primary',
  error: 'text-destructive',
  info: 'text-sky-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
}

export function Users() {
  const tenantId = useAppSelector((s) => s.auth.user?.tenant?.id ?? null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedVerification, setSelectedVerification] = useState('all')

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    providers: 0,
    customers: 0,
    verified: 0,
    unverified: 0,
  })

  useEffect(() => {
    let isMounted = true

    const loadUsers = async () => {
      if (isMounted) {
        await fetchUsers()
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 6000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersService.getUsers({ page: 1, limit: 100 })
      setUsers(response.users)
      calculateStats(response.users)
    } catch (error) {
      showSnackbar('Failed to load users', 'error')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (userList: User[]) => {
    setStats({
      total: userList.length,
      admins: userList.filter((u) => u.userType === 'admin').length,
      providers: userList.filter((u) => u.userType === 'provider').length,
      customers: userList.filter((u) => u.userType === 'customer').length,
      verified: userList.filter((u) => u.isVerified).length,
      unverified: userList.filter((u) => !u.isVerified).length,
    })
  }

  const dashboardUsersForClone = useMemo(
    () =>
      users.filter(
        (u) =>
          (u.userType === 'admin' || u.userType === 'super_admin') && u.id !== selectedUser?.id,
      ),
    [users, selectedUser?.id],
  )

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm))

    const matchesType = selectedType === 'all' || user.userType === selectedType

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && user.isActive !== false) ||
      (selectedStatus === 'inactive' && user.isActive === false)

    const matchesVerification =
      selectedVerification === 'all' ||
      (selectedVerification === 'verified' && user.isVerified) ||
      (selectedVerification === 'unverified' && !user.isVerified)

    return matchesSearch && matchesType && matchesStatus && matchesVerification
  })

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    setSelectedStatus('all')
    setSelectedVerification('all')
  }

  const handleCreateUser = () => {
    setFormMode('create')
    setSelectedUser(null)
    setFormDialogOpen(true)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setDetailsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormMode('edit')
    setFormDialogOpen(true)
  }

  const handleEditFromDetails = () => {
    setDetailsDialogOpen(false)
    setFormDialogOpen(true)
    setFormMode('edit')
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleToggleActive = async (user: User) => {
    try {
      const newStatus = user.isActive === false
      await usersService.toggleUserStatus(user.id, newStatus)
      showSnackbar(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success')
      fetchUsers()
    } catch (error) {
      showSnackbar('Failed to update user status', 'error')
    }
  }

  const handleVerifyUser = async (user: User) => {
    try {
      await usersService.verifyUser(user.id)
      showSnackbar('User verified successfully', 'success')
      fetchUsers()
    } catch (error) {
      showSnackbar('Failed to verify user', 'error')
    }
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await usersService.deleteUser(selectedUser.id)
      showSnackbar('User deleted successfully', 'success')
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      showSnackbar('Failed to delete user', 'error')
    }
  }

  const handleFormSubmit = async (
    userData: Partial<User> & { password?: string; clearDashboardRbac?: boolean },
  ) => {
    try {
      if (formMode === 'create') {
        await usersService.createUser({
          email: userData.email!,
          password: userData.password!,
          firstName: userData.firstName!,
          lastName: userData.lastName!,
          phone: userData.phone,
          userType: (userData.userType || 'customer') as 'customer' | 'provider' | 'admin',
          isVerified: userData.isVerified,
          isActive: userData.isActive,
          profilePicture: userData.profilePicture,
          ...(userData.userType === 'admin' && !userData.clearDashboardRbac
            ? {
                rbacRole: userData.rbacRole,
                rbacPermissionMode: userData.rbacPermissionMode,
                permissions: userData.permissions,
              }
            : {}),
        })
        showSnackbar('User created successfully', 'success')
      } else if (selectedUser) {
        const isDashboardAccount =
          selectedUser.userType === 'admin' || selectedUser.userType === 'super_admin'
        const rbacUpdate: Pick<
          UpdateUserRequest,
          'rbacRole' | 'rbacPermissionMode' | 'permissions'
        > = {}
        if (isDashboardAccount) {
          if (userData.clearDashboardRbac) {
            rbacUpdate.rbacRole = null
            rbacUpdate.rbacPermissionMode = null
            rbacUpdate.permissions = null
          } else {
            if (userData.rbacRole !== undefined) rbacUpdate.rbacRole = userData.rbacRole
            if (userData.rbacPermissionMode !== undefined) {
              rbacUpdate.rbacPermissionMode = userData.rbacPermissionMode
            }
            if (userData.permissions !== undefined) rbacUpdate.permissions = userData.permissions
          }
        }
        await usersService.updateUser(selectedUser.id, {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          profilePicture: userData.profilePicture,
          isVerified: userData.isVerified,
          isActive: userData.isActive,
          ...rbacUpdate,
        })
        showSnackbar('User updated successfully', 'success')
      }
      setFormDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Operation failed'
      throw new Error(message)
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'primary',
  }: {
    title: string
    value: number
    icon: LucideIcon
    color?: 'primary' | 'error' | 'info' | 'success' | 'warning'
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={cn('h-8 w-8 shrink-0', iconColor[color])} />
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-0 flex-1">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Accounts, verification, and dashboard RBAC (role, explicit module grants, and navigation visibility).
          </p>
        </div>
        <Button className="min-w-[140px]" onClick={handleCreateUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        <StatCard title="Total Users" value={stats.total} icon={UsersIcon} color="primary" />
        <StatCard title="Admins" value={stats.admins} icon={Shield} color="error" />
        <StatCard title="Providers" value={stats.providers} icon={Wrench} color="info" />
        <StatCard title="Customers" value={stats.customers} icon={ShoppingCart} color="success" />
        <StatCard title="Verified" value={stats.verified} icon={CheckCircle} color="success" />
        <StatCard title="Unverified" value={stats.unverified} icon={XCircle} color="warning" />
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedVerification={selectedVerification}
            onVerificationChange={setSelectedVerification}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedVerification !== 'all') && (
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      )}

      <UserTable
        users={filteredUsers}
        loading={loading}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleActive={handleToggleActive}
        onVerify={handleVerifyUser}
      />

      <UserFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        mode={formMode}
        cloneFromUsers={dashboardUsersForClone}
        tenantId={tenantId}
      />

      <UserDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onEdit={handleEditFromDetails}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setSelectedUser(null)
        }}
      />

      {snackbar.open && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-md border bg-background p-4 shadow-lg">
          <div
            className={cn(
              'flex items-start justify-between gap-2 text-sm',
              snackbar.severity === 'error' && 'text-destructive',
              snackbar.severity === 'success' && 'text-emerald-700 dark:text-emerald-400',
              (snackbar.severity === 'info' || snackbar.severity === 'warning') && 'text-foreground'
            )}
          >
            <p>{snackbar.message}</p>
            <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={handleCloseSnackbar}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
