import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { NotificationManager } from '../../components/notifications/NotificationManager'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { api } from '../../services/api/base'

export function Notifications() {
  const [probe, setProbe] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [probeMs, setProbeMs] = useState<number | null>(null)
  const [probePath, setProbePath] = useState<string | null>(null)
  const [probeDetail, setProbeDetail] = useState<string | null>(null)

  const runProbe = useCallback(async () => {
    setProbe('loading')
    setProbeDetail(null)
    setProbePath(null)
    const start = performance.now()
    const paths = ['/notifications/unread-count', '/notifications?page=1&limit=1']
    let lastErr: unknown
    for (const path of paths) {
      const t = performance.now()
      try {
        await api.get<unknown>(path, {
          showLoading: false,
          showErrorToast: false,
          showSuccessToast: false,
        })
        setProbeMs(Math.round(performance.now() - t))
        setProbePath(path)
        setProbe('ok')
        return
      } catch (e: unknown) {
        lastErr = e
      }
    }
    setProbeMs(Math.round(performance.now() - start))
    setProbe('fail')
    setProbeDetail(lastErr instanceof Error ? lastErr.message : String(lastErr))
  }, [])

  useEffect(() => {
    void runProbe()
  }, [runProbe])

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-3">
      <PageHeader
        title="Notifications"
        subtitle="In-app feed, broadcast sends where permitted, reusable templates, and device preferences — typical SaaS notification operations."
        icon={<Bell className="h-8 w-8 shrink-0" aria-hidden />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void runProbe()} disabled={probe === 'loading'}>
              <RefreshCw className={cn('mr-2 h-4 w-4', probe === 'loading' && 'animate-spin')} aria-hidden />
              Test API
            </Button>
            <Badge variant="outline" className="hidden font-normal sm:inline-flex">
              <Link to="/settings" className="text-foreground underline-offset-4 hover:underline">
                Email &amp; push prefs in Settings
              </Link>
            </Badge>
          </div>
        }
      />

      <Card className="overflow-hidden border">
        <div
          className={cn(
            'flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
            probe === 'ok' && 'bg-emerald-50/80 dark:bg-emerald-950/25',
            probe === 'fail' && 'bg-destructive/5',
            probe === 'loading' && 'bg-muted/40',
          )}
        >
          <div className="flex items-start gap-2">
            {probe === 'ok' ? (
              <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            ) : probe === 'fail' ? (
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            ) : (
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {probe === 'loading' && 'Checking notifications API…'}
                {probe === 'ok' && 'Notifications API reachable'}
                {probe === 'fail' && 'Notifications API unreachable'}
                {probe === 'idle' && 'Waiting…'}
              </p>
              <p className="text-xs text-muted-foreground">
                Authenticated GET{' '}
                <code className="rounded bg-muted px-1">{probePath ?? '/notifications/unread-count (then list)'}</code>
                {probeMs != null ? ` · ${probeMs} ms` : ''}. Server must enforce{' '}
                <code className="rounded bg-muted px-1">notification_send</code> /{' '}
                <code className="rounded bg-muted px-1">notification_manage</code> on destructive routes.
              </p>
              {probeDetail && (
                <p className="mt-1 font-mono text-xs text-destructive">{probeDetail}</p>
              )}
            </div>
          </div>
          <Link
            to="/system-status"
            className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Full integration checks →
          </Link>
        </div>
        <CardContent className="p-0">
          <NotificationManager />
        </CardContent>
      </Card>
    </div>
  )
}
