import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  People as PeopleIcon,
  Security as AdminIcon,
  Build as ProviderIcon,
  ShoppingCart as CustomerIcon,
  CheckCircle as VerifiedIcon,
  Cancel as UnverifiedIcon,
} from '@mui/icons-material'
import { UserTable } from '../../components/users/UserTable'
import { UserFilters } from '../../components/users/UserFilters'
import { UserFormDialog } from '../../components/users/UserFormDialog'
import { UserDetailsDialog } from '../../components/users/UserDetailsDialog'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { usersService } from '../../services/api/users.service'
import type { User } from '../../services/api/users.service'

interface UserStats {
  total: number
  admins: number
  providers: number
  customers: number
  verified: number
  unverified: number
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedVerification, setSelectedVerification] = useState('all')
  
  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Notifications
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

  // Fetch users
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
      admins: userList.filter(u => u.userType === 'admin').length,
      providers: userList.filter(u => u.userType === 'provider').length,
      customers: userList.filter(u => u.userType === 'customer').length,
      verified: userList.filter(u => u.isVerified).length,
      unverified: userList.filter(u => !u.isVerified).length,
    })
  }

  const filteredUsers = users.filter(user => {
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

  // User Actions
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

  const handleFormSubmit = async (userData: Partial<User>) => {
    try {
      if (formMode === 'create') {
        await usersService.createUser(userData as any)
        showSnackbar('User created successfully', 'success')
      } else if (selectedUser) {
        await usersService.updateUser(selectedUser.id, userData)
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

  const StatCard = ({ title, value, icon: Icon, color = 'primary' }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon sx={{ color: `${color}.main`, fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user accounts, permissions, and status
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
          sx={{ minWidth: 140 }}
        >
          Add User
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Total Users" value={stats.total} icon={PeopleIcon} color="primary" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Admins" value={stats.admins} icon={AdminIcon} color="error" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Providers" value={stats.providers} icon={ProviderIcon} color="info" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Customers" value={stats.customers} icon={CustomerIcon} color="success" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Verified" value={stats.verified} icon={VerifiedIcon} color="success" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Unverified" value={stats.unverified} icon={UnverifiedIcon} color="warning" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
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

      {/* Results Summary */}
      {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedVerification !== 'all') && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredUsers.length} of {users.length} users
          </Typography>
        </Box>
      )}

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        loading={loading}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleActive={handleToggleActive}
        onVerify={handleVerifyUser}
      />

      {/* User Form Dialog */}
      <UserFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        mode={formMode}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onEdit={handleEditFromDetails}
      />

      {/* Delete Confirmation Dialog */}
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

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

