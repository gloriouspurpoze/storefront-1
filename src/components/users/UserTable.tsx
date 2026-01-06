import React, { useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Typography,
  Checkbox,
  Tooltip,
  TableSortLabel,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as VerifyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'
import { formatDate, getInitials } from '../../lib/utils'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'customer' | 'provider' | 'admin'
  isVerified: boolean
  profilePicture?: string
  createdAt: string
  isActive?: boolean
}

interface UserTableProps {
  users: User[]
  loading?: boolean
  onView?: (user: User) => void
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  onToggleActive?: (user: User) => void
  onVerify?: (user: User) => void
  onBulkAction?: (action: string, userIds: string[]) => void
}

type OrderDirection = 'asc' | 'desc'

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onVerify,
  onBulkAction,
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt')
  const [order, setOrder] = useState<OrderDirection>('desc')

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((user) => user.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }

  const handleSelectClick = (id: string) => {
    const selectedIndex = selected.indexOf(id)
    let newSelected: string[] = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      )
    }

    setSelected(newSelected)
  }

  const handleRequestSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const aValue = a[orderBy]
      const bValue = b[orderBy]
      
      if (aValue === undefined || bValue === undefined) return 0
      
      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [users, order, orderBy])

  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const isSelected = (id: string) => selected.indexOf(id) !== -1

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin':
        return 'error'
      case 'provider':
        return 'info'
      case 'customer':
        return 'success'
      default:
        return 'default'
    }
  }

  const handleMenuAction = (action: string) => {
    if (!selectedUser) return

    switch (action) {
      case 'view':
        onView?.(selectedUser)
        break
      case 'edit':
        onEdit?.(selectedUser)
        break
      case 'delete':
        onDelete?.(selectedUser)
        break
      case 'toggle-active':
        onToggleActive?.(selectedUser)
        break
      case 'verify':
        onVerify?.(selectedUser)
        break
    }
    handleMenuClose()
  }

  if (isMobile) {
    // Mobile Card View
    return (
      <Box>
        {paginatedUsers.map((user) => (
          <Paper key={user.id} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar src={user.profilePicture} sx={{ width: 56, height: 56 }}>
                {getInitials(`${user.firstName} ${user.lastName}`)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={user.userType}
                    size="small"
                    color={getUserTypeColor(user.userType) as any}
                  />
                  {user.isVerified && (
                    <Chip label="Verified" size="small" color="success" variant="outlined" />
                  )}
                  {user.isActive === false && (
                    <Chip label="Inactive" size="small" color="error" variant="outlined" />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 14 }} />
                  {user.email}
                </Typography>
                {user.phone && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 14 }} />
                    {user.phone}
                  </Typography>
                )}
              </Box>
              <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>
    )
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < users.length}
                  checked={users.length > 0 && selected.length === users.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>User</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'userType'}
                  direction={orderBy === 'userType' ? order : 'asc'}
                  onClick={() => handleRequestSort('userType')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'isVerified'}
                  direction={orderBy === 'isVerified' ? order : 'asc'}
                  onClick={() => handleRequestSort('isVerified')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'asc'}
                  onClick={() => handleRequestSort('createdAt')}
                >
                  Joined
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => {
              const isItemSelected = isSelected(user.id)
              return (
                <TableRow
                  key={user.id}
                  hover
                  selected={isItemSelected}
                  sx={{ opacity: user.isActive === false ? 0.6 : 1 }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      onChange={() => handleSelectClick(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={user.profilePicture} sx={{ width: 40, height: 40 }}>
                        {getInitials(`${user.firstName} ${user.lastName}`)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user.id.substring(0, 8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.userType}
                      size="small"
                      color={getUserTypeColor(user.userType) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                    {user.phone && (
                      <Typography variant="caption" color="text.secondary">
                        {user.phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={user.isVerified ? 'Verified' : 'Unverified'}
                        size="small"
                        color={user.isVerified ? 'success' : 'default'}
                        variant={user.isVerified ? 'filled' : 'outlined'}
                      />
                      {user.isActive === false && (
                        <Chip label="Inactive" size="small" color="error" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => onView?.(user)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEdit?.(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={users.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit User
        </MenuItem>
        {selectedUser && !selectedUser.isVerified && (
          <MenuItem onClick={() => handleMenuAction('verify')}>
            <VerifyIcon sx={{ mr: 1, fontSize: 20 }} />
            Verify User
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('toggle-active')}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          {selectedUser?.isActive === false ? 'Activate' : 'Deactivate'}
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete User
        </MenuItem>
      </Menu>
    </Paper>
  )
}

