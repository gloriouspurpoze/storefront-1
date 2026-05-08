import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Circle,
  Info,
  Kanban,
  Loader2,
  Megaphone,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  Settings,
  ShoppingCart,
  Star,
  Timer,
  TriangleAlert,
  Wrench,
  X,
  XCircle,
  CreditCard,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../../hooks/useNotifications'
import type { PushNotification, NotificationPreferences } from '../../services/api/notifications.service'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Sheet, SheetContent } from '../ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { cn } from '../../lib/utils'

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

const iconCellClass: Record<PushNotification['type'], string> = {
  quote_received: 'bg-primary/15 text-primary',
  quote_accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  booking_confirmed: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  booking_created: 'bg-primary/15 text-primary',
  booking_cancelled: 'bg-destructive/15 text-destructive',
  booking_completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  booking_assigned: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  status_changed: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  message_received: 'bg-primary/15 text-primary',
  order_placed: 'bg-primary/15 text-primary',
  order_updated: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
  payment_received: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  review_received: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  service_completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  review_requested: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
  system_alert: 'bg-destructive/15 text-destructive',
  system: 'bg-destructive/15 text-destructive',
  general: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  marketing: 'bg-secondary text-secondary-foreground',
  reminder: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  team_work_assigned: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
}

function NotificationTypeIcon({ type }: { type: PushNotification['type'] }) {
  const cls = 'h-4 w-4 shrink-0'
  switch (type) {
    case 'quote_received':
      return <Star className={cls} />
    case 'quote_accepted':
    case 'booking_completed':
      return <CheckCircle2 className={cls} />
    case 'booking_confirmed':
    case 'booking_created':
    case 'booking_assigned':
      return <Calendar className={cls} />
    case 'booking_cancelled':
      return <XCircle className={cls} />
    case 'status_changed':
    case 'general':
      return <Info className={cls} />
    case 'message_received':
      return <MessageSquare className={cls} />
    case 'order_placed':
    case 'order_updated':
      return <ShoppingCart className={cls} />
    case 'payment_received':
      return <CreditCard className={cls} />
    case 'review_received':
    case 'review_requested':
      return <Star className={cls} />
    case 'service_completed':
      return <Wrench className={cls} />
    case 'system_alert':
    case 'system':
      return <TriangleAlert className={cls} />
    case 'marketing':
      return <Megaphone className={cls} />
    case 'reminder':
      return <Timer className={cls} />
    case 'team_work_assigned':
      return <Kanban className={cls} />
    default:
      return <Info className={cls} />
  }
}

function isAbsoluteHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const navigate = useNavigate()
  const {
    notifications,
    preferences,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    updatePreferences,
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread' | PushNotification['type']>('all')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.isRead
    return notification.type === filter
  })

  const handleNotificationClick = async (notification: PushNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      const raw = notification.actionUrl.trim()
      if (raw.startsWith('/') && !raw.startsWith('//')) {
        try {
          const u = new URL(raw, window.location.origin)
          navigate(`${u.pathname}${u.search}${u.hash}`)
          onClose()
        } catch {
          /* ignore */
        }
      } else if (isAbsoluteHttpUrl(raw)) {
        window.open(raw, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (preferences) {
      await updatePreferences({ [key]: value })
    }
  }

  const formatNotificationTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const sheetOnOpenChange = (next: boolean) => {
    if (!next) onClose()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={sheetOnOpenChange}>
        <SheetContent hideClose side="right" className="flex w-full max-w-[400px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]">
          <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 ? (
                <Badge variant="default" className="h-6 min-w-6 px-1.5">
                  {unreadCount}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={() => void refreshNotifications()} disabled={isLoading}>
                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            {error ? (
              <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <div className="flex items-center justify-between gap-2">
                  <span>{error}</span>
                  <Button type="button" variant="outline" size="sm" className="shrink-0 border-destructive/40" onClick={() => void refreshNotifications()}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mb-3 flex flex-wrap items-center gap-1">
              <Badge
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                All
              </Badge>
              <Badge
                variant={filter === 'unread' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('unread')}
              >
                Unread
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void markAllAsRead()}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator className="mb-3" />

            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </div>
            ) : (
              <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto pr-1">
                {filteredNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      'border-b border-border/60 last:border-0',
                      !notification.isRead && 'border-l-[3px] border-l-primary bg-muted/30',
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full gap-3 px-1 py-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => void handleNotificationClick(notification)}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          iconCellClass[notification.type] || iconCellClass.general,
                        )}
                      >
                        <NotificationTypeIcon type={notification.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('line-clamp-2 flex-1 text-sm font-medium', !notification.isRead && 'font-semibold')}>
                            {notification.title}
                          </span>
                          {!notification.isRead ? <Circle className="h-2 w-2 shrink-0 fill-primary text-primary" /> : null}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{notification.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatNotificationTime(notification.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification settings</DialogTitle>
            <DialogDescription>Choose how you receive notifications in the admin app.</DialogDescription>
          </DialogHeader>
          {preferences ? (
            <div className="grid gap-4 py-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-push" className="flex-1">
                  Push notifications
                </Label>
                <Switch
                  id="pref-push"
                  checked={preferences.pushNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('pushNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-email" className="flex-1">
                  Email notifications
                </Label>
                <Switch
                  id="pref-email"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('emailNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-sms" className="flex-1">
                  SMS notifications
                </Label>
                <Switch
                  id="pref-sms"
                  checked={preferences.smsNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('smsNotifications', v)}
                />
              </div>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Notification types</p>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-order" className="flex-1">
                  Order notifications
                </Label>
                <Switch
                  id="pref-order"
                  checked={preferences.orderNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('orderNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-user" className="flex-1">
                  User management
                </Label>
                <Switch
                  id="pref-user"
                  checked={preferences.userNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('userNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-sys" className="flex-1">
                  System notifications
                </Label>
                <Switch
                  id="pref-sys"
                  checked={preferences.systemNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('systemNotifications', v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pref-mkt" className="flex-1">
                  Marketing notifications
                </Label>
                <Switch
                  id="pref-mkt"
                  checked={preferences.marketingNotifications}
                  onCheckedChange={(v) => void handlePreferenceChange('marketingNotifications', v)}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
