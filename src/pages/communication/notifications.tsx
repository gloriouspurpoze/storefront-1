import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, RefreshCw, Send, Wifi, WifiOff } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { NotificationManager } from '../../components/notifications/NotificationManager'
import { useNotifications } from '../../hooks/useNotifications'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'
import { api } from '../../services/api/base'

type HubTab = 'inbox' | 'compose' | 'templates' | 'settings'

export function Notifications() {
  const { unreadCount, refreshNotifications, isLoading } = useNotifications()
  const [activeTab, setActiveTab] = useState<HubTab>('inbox')
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const checkApi = useCallback(async () => {
    setApiStatus('checking')
    const paths = ['/notifications/unread-count', '/notifications?page=1&limit=1']
    for (const path of paths) {
      try {
        await api.get<unknown>(path, {
          showLoading: false,
          showErrorToast: false,
          showSuccessToast: false,
        })
        setApiStatus('online')
        return
      } catch {
        /* try next */
      }
    }
    setApiStatus('offline')
  }, [])

  useEffect(() => {
    void checkApi()
  }, [checkApi])

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6 md:py-6">
      <PageHeader
        title="Notifications"
        subtitle="Inbox for your admin account, compose broadcasts to users, reusable templates, and channel preferences — one hub for notification operations."
        icon={<Bell className="h-8 w-8 shrink-0" aria-hidden />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'gap-1 font-normal',
                apiStatus === 'online' && 'border-storm-deep/40 text-storm-deep dark:text-storm-sea',
                apiStatus === 'offline' && 'border-destructive/40 text-destructive',
              )}
            >
              {apiStatus === 'online' ? (
                <Wifi className="h-3 w-3" aria-hidden />
              ) : apiStatus === 'offline' ? (
                <WifiOff className="h-3 w-3" aria-hidden />
              ) : (
                <RefreshCw className="h-3 w-3 animate-spin" aria-hidden />
              )}
              {apiStatus === 'checking' ? 'Checking API…' : apiStatus === 'online' ? 'API online' : 'API offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshNotifications()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
              Refresh inbox
            </Button>
            <Button size="sm" onClick={() => setActiveTab('compose')}>
              <Send className="mr-2 h-4 w-4" />
              Compose
              {unreadCount > 0 && activeTab !== 'inbox' ? (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {unreadCount} unread
                </Badge>
              ) : null}
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <NotificationManager activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Platform email &amp; global push configuration:{' '}
        <Link to="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
          Settings
        </Link>
        {' · '}
        <Link to="/system-status" className="font-medium text-primary underline-offset-4 hover:underline">
          Integration health
        </Link>
      </p>
    </div>
  )
}
