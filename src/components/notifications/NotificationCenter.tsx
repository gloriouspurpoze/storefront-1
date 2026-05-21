import React, { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import type { NotificationPreferences } from '../../services/api/notifications.service'
import { NotificationInbox } from './NotificationInbox'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { preferences, unreadCount, updatePreferences } = useNotifications()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (preferences) {
      await updatePreferences({ [key]: value })
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent
          hideClose
          side="right"
          className="flex w-full max-w-[420px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 ? (
                <Badge variant="default" className="h-6 min-w-6 px-1.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preferences</TooltipContent>
              </Tooltip>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Close" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <NotificationInbox variant="sheet" onNavigateAway={onClose} />
        </SheetContent>
      </Sheet>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification preferences</DialogTitle>
            <DialogDescription>Control channels and categories for this admin account.</DialogDescription>
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
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              {(
                [
                  ['pref-order', 'orderNotifications', 'Orders & bookings'],
                  ['pref-user', 'userNotifications', 'Account & messages'],
                  ['pref-sys', 'systemNotifications', 'System & security'],
                  ['pref-mkt', 'marketingNotifications', 'Marketing (opt-in)'],
                ] as const
              ).map(([id, key, label]) => (
                <div key={id} className="flex items-center justify-between gap-4">
                  <Label htmlFor={id} className="flex-1">
                    {label}
                  </Label>
                  <Switch
                    id={id}
                    checked={preferences[key]}
                    onCheckedChange={(v) => void handlePreferenceChange(key, v)}
                  />
                </div>
              ))}
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
