/**
 * Shared notification inbox — used on /notifications (primary tab) and in the header sheet.
 */

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
  RefreshCw,
  ShoppingCart,
  Star,
  Timer,
  TriangleAlert,
  Wrench,
  XCircle,
  CreditCard,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../../hooks/useNotifications'
import type { PushNotification } from '../../services/api/notifications.service'
import {
  INBOX_QUICK_FILTERS,
  matchesInboxFilter,
  type InboxFilter,
} from '../../lib/notificationUi'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

const iconCellClass: Record<string, string> = {
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

function NotificationTypeIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4 shrink-0'
  switch (type) {
    case 'quote_received':
    case 'review_received':
    case 'review_requested':
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
    case 'message_received':
      return <MessageSquare className={cls} />
    case 'order_placed':
    case 'order_updated':
      return <ShoppingCart className={cls} />
    case 'payment_received':
      return <CreditCard className={cls} />
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

export type NotificationInboxProps = {
  /** Called after navigating from a notification (e.g. close sheet). */
  onNavigateAway?: () => void
  /** `page` = full-width admin inbox; `sheet` = compact drawer. */
  variant?: 'page' | 'sheet'
  className?: string
}

export function NotificationInbox({
  onNavigateAway,
  variant = 'page',
  className,
}: NotificationInboxProps) {
  const navigate = useNavigate()
  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications()

  const [filter, setFilter] = useState<InboxFilter>('all')

  const filtered = notifications.filter((n) => matchesInboxFilter(n, filter))

  const handleClick = async (notification: PushNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      const raw = notification.actionUrl.trim()
      if (raw.startsWith('/') && !raw.startsWith('//')) {
        try {
          const u = new URL(raw, window.location.origin)
          navigate(`${u.pathname}${u.search}${u.hash}`)
          onNavigateAway?.()
        } catch {
          /* ignore */
        }
      } else if (isAbsoluteHttpUrl(raw)) {
        window.open(raw, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <div className={cn('flex flex-col', variant === 'page' ? 'min-h-[420px]' : 'min-h-0 flex-1', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {INBOX_QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === f.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {f.label}
              {f.id === 'unread' && unreadCount > 0 ? (
                <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[10px]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void markAllAsRead()}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => void refreshNotifications()}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <div className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/40"
              onClick={() => void refreshNotifications()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {/* List */}
      <div className={cn('flex-1 overflow-y-auto', variant === 'sheet' && 'min-h-0')}>
        {isLoading && filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {filter === 'unread'
                ? 'No unread items in this feed. New alerts from bookings, orders, and system events will appear here.'
                : 'Activity from your platform will show up in this inbox.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  'transition-colors',
                  !notification.isRead && 'bg-primary/[0.04]',
                )}
              >
                <button
                  type="button"
                  className="flex w-full gap-3 px-4 py-3.5 text-left hover:bg-muted/50"
                  onClick={() => void handleClick(notification)}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      iconCellClass[notification.type] || iconCellClass.general,
                    )}
                  >
                    <NotificationTypeIcon type={notification.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          'flex-1 text-sm leading-snug',
                          notification.isRead ? 'font-medium text-foreground' : 'font-semibold text-foreground',
                        )}
                      >
                        {notification.title}
                      </span>
                      {!notification.isRead ? (
                        <Circle className="mt-1.5 h-2 w-2 shrink-0 fill-primary text-primary" />
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] capitalize">
                        {notification.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
