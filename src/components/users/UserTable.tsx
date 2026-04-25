import React, { useState } from 'react'
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Ban,
  BadgeCheck,
  Mail,
  Phone,
  ChevronsUpDown,
} from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { formatDate, getInitials } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Pagination } from '../common/Pagination'
import { cn } from '../../lib/utils'

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

const userTypeBadgeVariant = (
  type: string,
): React.ComponentProps<typeof Badge>['variant'] => {
  switch (type) {
    case 'admin':
      return 'destructive'
    case 'provider':
      return 'default'
    case 'customer':
      return 'success'
    default:
      return 'secondary'
  }
}

function UserActionsMenu({ user, ...handlers }: { user: User } & Pick<UserTableProps, 'onView' | 'onEdit' | 'onDelete' | 'onToggleActive' | 'onVerify'>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onSelect={() => {
            handlers.onView?.(user)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            handlers.onEdit?.(user)
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
        {!user.isVerified && (
          <DropdownMenuItem
            onSelect={() => {
              handlers.onVerify?.(user)
            }}
          >
            <BadgeCheck className="mr-2 h-4 w-4" />
            Verify User
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            handlers.onToggleActive?.(user)
          }}
        >
          <Ban className="mr-2 h-4 w-4" />
          {user.isActive === false ? 'Activate' : 'Deactivate'}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => {
            handlers.onDelete?.(user)
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SortableHead({
  label,
  active,
  direction,
  onSort,
  className,
}: {
  label: string
  active: boolean
  direction: OrderDirection
  onSort: () => void
  className?: string
}) {
  return (
    <TableHead className={className}>
      <Button
        type="button"
        variant="ghost"
        className="-ml-2 h-8 gap-0.5 font-semibold hover:bg-transparent"
        onClick={onSort}
      >
        {label}
        <ChevronsUpDown
          className={cn('h-3.5 w-3.5 text-muted-foreground', active && 'text-foreground')}
        />
        {active && <span className="sr-only">{direction === 'asc' ? 'ascending' : 'descending'}</span>}
      </Button>
    </TableHead>
  )
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading: _loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onVerify,
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [orderBy, setOrderBy] = useState<keyof User>('createdAt')
  const [order, setOrder] = useState<OrderDirection>('desc')

  const isMobile = useMediaQuery('(max-width: 639px)')

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

  const totalPages = users.length === 0 ? 1 : Math.max(1, Math.ceil(users.length / rowsPerPage))
  const pageClamped = Math.min(page, totalPages - 1)

  const paginatedUsers = sortedUsers.slice(
    pageClamped * rowsPerPage,
    pageClamped * rowsPerPage + rowsPerPage,
  )

  const isSelected = (id: string) => selected.indexOf(id) !== -1

  const allSelected = users.length > 0 && selected.length === users.length
  const someSelected = selected.length > 0 && !allSelected

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(users.map((u) => u.id))
    } else {
      setSelected([])
    }
  }

  const handleSelectRow = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const pagination = (
    <Pagination
      currentPage={pageClamped + 1}
      totalPages={totalPages}
      totalItems={users.length}
      itemsPerPage={rowsPerPage}
      onPageChange={(p) => setPage(p - 1)}
      onItemsPerPageChange={(n) => {
        setRowsPerPage(n)
        setPage(0)
      }}
      itemsPerPageOptions={[5, 10, 25, 50, 100]}
    />
  )

  if (isMobile) {
    return (
      <div>
        {paginatedUsers.map((user) => (
          <Card key={user.id} className="mb-2">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Avatar className="h-14 w-14">
                  {user.profilePicture ? <AvatarImage src={user.profilePicture} alt="" /> : null}
                  <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="mb-1 flex flex-wrap gap-1">
                    <Badge variant={userTypeBadgeVariant(user.userType)} className="capitalize">
                      {user.userType}
                    </Badge>
                    {user.isVerified && (
                      <Badge variant="success" className="border border-green-600/30 bg-transparent">
                        Verified
                      </Badge>
                    )}
                    {user.isActive === false && (
                      <Badge variant="destructive" className="border">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="mb-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {user.phone}
                    </p>
                  )}
                </div>
                <UserActionsMenu
                  user={user}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                  onVerify={onVerify}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length > 0 && pagination}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(c) => handleSelectAll(c === true)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <SortableHead
                label="Type"
                active={orderBy === 'userType'}
                direction={orderBy === 'userType' ? order : 'asc'}
                onSort={() => handleRequestSort('userType')}
              />
              <TableHead>Contact</TableHead>
              <SortableHead
                label="Status"
                active={orderBy === 'isVerified'}
                direction={orderBy === 'isVerified' ? order : 'asc'}
                onSort={() => handleRequestSort('isVerified')}
              />
              <SortableHead
                label="Joined"
                active={orderBy === 'createdAt'}
                direction={orderBy === 'createdAt' ? order : 'asc'}
                onSort={() => handleRequestSort('createdAt')}
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => {
              const isItemSelected = isSelected(user.id)
              return (
                <TableRow
                  key={user.id}
                  className={cn(user.isActive === false && 'opacity-60')}
                  data-state={isItemSelected ? 'selected' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={isItemSelected}
                      onCheckedChange={() => handleSelectRow(user.id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        {user.profilePicture ? <AvatarImage src={user.profilePicture} alt="" /> : null}
                        <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={userTypeBadgeVariant(user.userType)} className="capitalize">
                      {user.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{user.email}</p>
                    {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-0.5">
                      <Badge variant={user.isVerified ? 'success' : 'outline'}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                      {user.isActive === false && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View"
                        onClick={() => onView?.(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() => onEdit?.(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <UserActionsMenu
                        user={user}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleActive={onToggleActive}
                        onVerify={onVerify}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {users.length > 0 && pagination}
    </Card>
  )
}
