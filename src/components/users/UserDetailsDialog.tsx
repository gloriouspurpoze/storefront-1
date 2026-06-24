import React from 'react'
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  User as UserIcon,
  Ban,
  CheckCircle2,
  UserSearch,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { formatDate, getInitials, cn } from '../../lib/utils'
import type { User } from '../../types'
import { UserAccessChips } from './UserAccessChips'

interface UserDetailsDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onEdit?: () => void
  /** Deep link to CRM lead/contact when platform sync has matched this user. */
  crmHref?: string | null
}

const userTypeBadge = (type: string) => {
  switch (type) {
    case 'super_admin':
    case 'admin':
      return { variant: 'destructive' as const, icon: Shield }
    case 'provider':
      return { variant: 'default' as const, icon: UserIcon }
    case 'customer':
    default:
      return { variant: 'success' as const, icon: UserIcon }
  }
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ open, onClose, user, onEdit, crmHref }) => {
  if (!user) return null

  const t = userTypeBadge(user.userType)
  const TypeIcon = t.icon

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">User Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center border-b border-border pb-4">
          <Avatar className="mb-2 h-24 w-24">
            {user.profilePicture ? <AvatarImage src={user.profilePicture} alt="" /> : null}
            <AvatarFallback className="text-lg">{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">
            {user.firstName} {user.lastName}
          </h2>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            <Badge variant={t.variant} className="inline-flex items-center gap-1 capitalize">
              <TypeIcon className="h-3.5 w-3.5" />
              {user.userType}
            </Badge>
            {user.isVerified && (
              <Badge variant="success" className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
            {user.isActive === false ? (
              <Badge variant="destructive" className="inline-flex items-center gap-1">
                <Ban className="h-3.5 w-3.5" />
                Inactive
              </Badge>
            ) : (
              <Badge variant="outline" className="inline-flex items-center gap-1 border-storm-deep/50 text-storm-deep">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-6 py-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Contact Information</h3>
            <div className="grid gap-2 sm:grid-cols-1">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </CardContent>
              </Card>
              {user.phone && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Account Information</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="break-all font-mono text-sm">{user.id}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Type</p>
                    <p className="text-sm font-medium capitalize">{user.userType}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
              {user.updatedAt && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">{formatDate(user.updatedAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />

          {(user.userType === 'admin' || user.userType === 'super_admin') && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Dashboard authorization</h3>
              <p className="mb-2 text-xs text-muted-foreground">
                Role defines the baseline template; explicit mode uses only the permission list for navigation and
                routes.
              </p>
              <UserAccessChips user={user} maxPermissionChips={80} />
            </div>
          )}

          {crmHref && user.userType === 'customer' ? (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">CRM</h3>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link to={crmHref} onClick={onClose}>
                    <UserSearch className="h-4 w-4" />
                    View CRM lead / contact
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Linked automatically from this customer account. Opens Leads or Contacts based on job stage.
                </p>
              </div>
            </>
          ) : null}

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Status Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={cn(
                  'rounded-lg p-3 text-center',
                  user.isVerified ? 'bg-storm-deep/10' : 'bg-bloom-coral/10',
                )}
              >
                <p className={cn('text-2xl font-bold', user.isVerified ? 'text-storm-deep' : 'text-bloom-coral')}>
                  {user.isVerified ? '✓' : '!'}
                </p>
                <p className="text-xs text-muted-foreground">Email {user.isVerified ? 'Verified' : 'Not Verified'}</p>
              </div>
              <div
                className={cn(
                  'rounded-lg p-3 text-center',
                  user.isActive !== false ? 'bg-storm-deep/10' : 'bg-destructive/10',
                )}
              >
                <p
                  className={cn(
                    'text-2xl font-bold',
                    user.isActive !== false ? 'text-storm-deep' : 'text-destructive',
                  )}
                >
                  {user.isActive !== false ? '✓' : '✗'}
                </p>
                <p className="text-xs text-muted-foreground">Account {user.isActive !== false ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button type="button" onClick={onEdit}>
              Edit User
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
