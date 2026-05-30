import React, { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { PageHeader } from '../../components/common/PageHeader'
import { cn } from '../../lib/utils'
import {
  runIntegrationHealthChecks,
  type IntegrationCheck,
} from '../../services/api/systemHealth.service'

export function SystemStatus() {
  const [checks, setChecks] = useState<IntegrationCheck[]>([])
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const report = await runIntegrationHealthChecks()
      setChecks(report.checks)
      setApiBaseUrl(report.apiBaseUrl)
      setCheckedAt(report.checkedAt)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Health check failed')
      setChecks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const allOk = checks.length > 0 && checks.every((c) => c.ok)
  const anyFail = checks.some((c) => !c.ok)

  return (
    <div className="min-h-0 flex-1 space-y-6">
      <PageHeader
        title="System status"
        subtitle="Live checks against your configured API. Use this for quick integration verification — pair it with external uptime and APM for production."
        icon={<Cloud className="h-8 w-8 shrink-0" aria-hidden />}
        action={
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden />
            {loading ? 'Checking…' : 'Run checks'}
          </Button>
        }
      />

      <Card
        className={cn(
          'border-2',
          loading && 'border-muted',
          !loading && allOk && 'border-storm-mist/30 bg-storm-mist/60 dark:border-storm-deep dark:bg-storm-deep/25',
          !loading && anyFail && 'border-bloom-coral/40 bg-bloom-rose/60 dark:border-bloom-coral dark:bg-bloom-coral/25',
          !loading && checks.length === 0 && error && 'border-destructive/40 bg-destructive/5',
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {loading ? (
                <Activity className="mt-0.5 h-8 w-8 animate-pulse text-muted-foreground" aria-hidden />
              ) : allOk ? (
                <CheckCircle2 className="mt-0.5 h-8 w-8 text-storm-deep" aria-hidden />
              ) : checks.length === 0 ? (
                <XCircle className="mt-0.5 h-8 w-8 text-destructive" aria-hidden />
              ) : (
                <AlertTriangle className="mt-0.5 h-8 w-8 text-bloom-coral" aria-hidden />
              )}
              <div>
                <CardTitle className="text-lg">
                  {loading
                    ? 'Running integration checks…'
                    : checks.length === 0 && error
                      ? 'Could not complete checks'
                      : allOk
                        ? 'All probes succeeded'
                        : 'Some integrations need attention'}
                </CardTitle>
                <CardDescription className="mt-1 max-w-2xl text-pretty">
                  {apiBaseUrl ? (
                    <>
                      API base:{' '}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">{apiBaseUrl}</code>
                    </>
                  ) : (
                    'Configure REACT_APP_API_URL to point at your backend.'
                  )}
                </CardDescription>
              </div>
            </div>
            {checkedAt && (
              <Badge variant="outline" className="shrink-0 font-normal">
                Last run: {new Date(checkedAt).toLocaleString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        {error && (
          <CardContent className="pt-0">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" aria-hidden />
              Integration checks
            </CardTitle>
            <CardDescription>
              Each row is a real authenticated request from this browser session, with round-trip time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            {loading && checks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : checks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No results.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {checks.map((c) => (
                  <li key={c.id} className="flex gap-3 px-4 py-3">
                    <div className="pt-0.5">
                      {c.ok ? (
                        <Wifi className="h-5 w-5 text-storm-deep" aria-hidden />
                      ) : (
                        <WifiOff className="h-5 w-5 text-destructive" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.label}</span>
                        <Badge variant={c.ok ? 'secondary' : 'destructive'} className="text-[0.65rem] capitalize">
                          {c.ok ? 'Reachable' : 'Failed'}
                        </Badge>
                        {c.latencyMs != null && (
                          <span className="text-xs text-muted-foreground">{c.latencyMs} ms</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                      {c.ok && c.endpointUsed && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Responded via <code className="rounded bg-muted px-1">{c.endpointUsed}</code>
                        </p>
                      )}
                      {!c.ok && c.detail && (
                        <p className="mt-1 font-mono text-xs text-destructive">{c.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational readiness</CardTitle>
            <CardDescription>Typical SaaS checklist — mostly outside this admin UI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-2">
              <li>External uptime monitors on API + auth endpoints</li>
              <li>Database backups and failover tested</li>
              <li>Error tracking (e.g. Sentry) on API and web</li>
              <li>Status page for customers when you have incidents</li>
            </ul>
            <Separator />
            <p className="text-xs leading-relaxed">
              This page does not display CPU, disk, or container metrics. Those come from your hosting provider or
              observability stack. If you add a <code className="rounded bg-muted px-0.5">/health</code> route on the
              backend, we can surface it here next.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SystemStatus
