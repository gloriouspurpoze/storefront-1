import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from '../../hooks/useNotifications'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

export function NotificationBell() {
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const { unreadCount } = useNotifications()

  const handleClick = () => {
    setNotificationCenterOpen(true)
  }

  const handleClose = () => {
    setNotificationCenterOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative text-inherit"
        onClick={handleClick}
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="relative inline-flex">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute -right-2 -top-2 h-[18px] min-w-[18px] justify-center px-1.5 text-[0.75rem] font-semibold',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </span>
      </Button>

      <NotificationCenter
        open={notificationCenterOpen}
        onClose={handleClose}
      />
    </>
  )
}
