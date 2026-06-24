import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Cloud, Link2, ListChecks, RefreshCw, Shield } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { CrmWhatsAppStaffPlaybook } from '../../components/crm/CrmWhatsAppStaffPlaybook'
import { crmApi } from '../../services/api/crm.api'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { cn } from '../../lib/utils'

const ENTITY_OPTIONS = ['contact', 'company', 'deal', 'activity'] as const

/** Grouped go-live items — short lines for ops/security reviews before production. */
const GO_LIVE_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'API & data (MongoDB)',
    items: [
      'REACT_APP_API_URL points at production API; admin uses /api/crm only (no browser CRM store in production).',
      'Mongo CRM collections match admin: contact lifecycle (inquiry→paid, partner_*), deal stages (inquiry→lost), activities (whatsapp, site_visit, …), optional platformUserId / platformBookingId / platformOrderId.',
      'GET /crm/metrics returns paidThisMonth or legacy wonThisMonth; deal stage counts align with admin pipeline.',
    ],
  },
  {
    title: 'Security & access',
    items: [
      'JWT and CRM_GOOGLE_* only in server env or secrets manager — never in the client bundle or git.',
      'HTTPS on admin and API; CRM_GOOGLE_REDIRECT_URI matches backend OAuth callback exactly.',
      'RBAC: seed view_crm / manage_crm; test field masks for staff vs managers.',
    ],
  },
  {
    title: 'Google CRM sync (optional)',
    items: [
      'Google Cloud: OAuth consent appropriate for production; Calendar + Gmail APIs enabled.',
      'Plan encryption at rest for refresh tokens if required by policy; document data retention.',
    ],
  },
  {
    title: 'Operations',
    items: [
      'CORS: admin origin allowed on the API (see fixer-backend CORS config).',
      'Monitor /api/crm and sync routes; rate-limit or alert on 5xx.',
      'Smoke test: contact/deal/activity CRUD, CSV export, field policies save, Google connect + one calendar/email sync.',
      'WhatsApp ops: lead source WhatsApp, log WhatsApp activities after threads, paste platform user / booking / order IDs when the job exists.',
    ],
  },
]

export function CrmSettings() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const isApi = crmService.isApiEnabled()

  const [status, setStatus] = useState<{
    googleConnected: boolean
    calendarSyncEnabled?: boolean
    emailSyncEnabled?: boolean
    lastCalendarSyncAt?: string
    lastEmailSyncAt?: string
  } | null>(null)
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const [policiesLoading, setPoliciesLoading] = useState(false)
  const [policiesLoaded, setPoliciesLoaded] = useState(false)
  const [policiesError, setPoliciesError] = useState<string | null>(null)
  const [rulesJson, setRulesJson] = useState('[]')
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const loadIntegrationStatus = useCallback(() => {
    if (!isApi) return
    setIntegrationError(null)
    crmApi
      .getIntegrationStatus()
      .then((s) => {
        setStatus(s)
        setIntegrationError(null)
      })
      .catch((e: unknown) => {
        setStatus({ googleConnected: false })
        setIntegrationError(e instanceof Error ? e.message : 'Could not load integration status')
      })
  }, [isApi])

  const loadFieldPolicies = useCallback(() => {
    if (!isApi || !canManage) return
    setPoliciesLoading(true)
    setPoliciesError(null)
    crmApi
      .getFieldPolicies()
      .then((r) => {
        setRulesJson(JSON.stringify(r.rules, null, 2))
        setPoliciesError(null)
      })
      .catch((e: unknown) => {
        setPoliciesError(e instanceof Error ? e.message : 'Could not load field policies (needs manage_crm and backend /crm/admin/field-policies)')
      })
      .finally(() => {
        setPoliciesLoading(false)
        setPoliciesLoaded(true)
      })
  }, [isApi, canManage])

  useEffect(() => {
    loadIntegrationStatus()
  }, [loadIntegrationStatus])

  useEffect(() => {
    loadFieldPolicies()
  }, [loadFieldPolicies])

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 5000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const connectGoogle = async () => {
    try {
      const url = await crmApi.getGoogleAuthUrl()
      window.location.href = url
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Could not start Google OAuth',
        severity: 'error',
      })
    }
  }

  const runCalendar = async () => {
    try {
      const r = await crmApi.syncCalendar()
      setSyncMsg(`Calendar: imported ${r.imported} new events as activities.`)
      const s = await crmApi.getIntegrationStatus()
      setStatus(s)
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : 'Calendar sync failed')
    }
  }

  const runEmail = async () => {
    try {
      const r = await crmApi.syncEmail()
      setSyncMsg(`Email: imported ${r.imported} threads as activity notes.`)
      const s = await crmApi.getIntegrationStatus()
      setStatus(s)
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : 'Email sync failed')
    }
  }

  const savePolicies = async () => {
    try {
      const parsed = JSON.parse(rulesJson) as unknown
      if (!Array.isArray(parsed)) {
        setSnackbar({ open: true, message: 'Field policies must be a JSON array of rule objects.', severity: 'error' })
        return
      }
      await crmApi.saveFieldPolicies(
        parsed as Array<{ roleKey: string; entity: string; field: string; read: boolean; write: boolean }>
      )
      setSnackbar({ open: true, message: 'Field policies saved', severity: 'success' })
      await loadFieldPolicies()
    } catch (e: unknown) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Invalid JSON or save failed',
        severity: 'error',
      })
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('crm_google')
    if (q === 'connected') {
      setSnackbar({ open: true, message: 'Google connected for CRM sync', severity: 'success' })
      window.history.replaceState({}, '', '/crm/settings')
      loadIntegrationStatus()
    } else if (q === 'error') {
      setSnackbar({ open: true, message: 'Google connection failed', severity: 'error' })
      window.history.replaceState({}, '', '/crm/settings')
    }
  }, [loadIntegrationStatus])

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="CRM settings"
        subtitle="Google Calendar & Gmail sync, field-level permissions, and go-live checklist — all backed by fixer-backend when CRM API mode is on."
      />
      <CrmSubnav />
{/* 
      <div className="mb-6">
        <CrmWhatsAppStaffPlaybook variant="compact" />
      </div> */}

      <Card className="mb-6 border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base">Pre-production checklist</CardTitle>
          </div>
          <CardDescription>
            Review before launch. Env reference: <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> (CRM section).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {GO_LIVE_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                {section.items.map((item, idx) => (
                  <li key={`${section.title}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div
        role="status"
        className={cn(
          'mb-4 rounded-md border px-4 py-3 text-sm',
          isApi
            ? 'border-storm-deep/40 bg-storm-deep/10 text-storm-deep dark:text-on-ink'
            : 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep',
        )}
      >
        {isApi ? (
          <>
            <strong>API mode on.</strong> CRM reads and writes MongoDB via <code className="rounded bg-background/60 px-1 text-xs">/api/crm</code>.
            Metrics use job-style deal stages; backend may return <code className="rounded bg-background/60 px-1 text-xs">paidThisMonth</code> or
            legacy <code className="rounded bg-background/60 px-1 text-xs">wonThisMonth</code> — the admin normalizes both.
          </>
        ) : (
          <>
            <strong>Local CRM demo.</strong> Set <code className="rounded bg-background/60 px-1 text-xs">REACT_APP_CRM_USE_API=true</code> and a
            valid <code className="rounded bg-background/60 px-1 text-xs">REACT_APP_API_URL</code> for Mongo-backed settings and integrations (
            <code className="rounded bg-background/60 px-1 text-xs">.env.example</code>).
          </>
        )}
      </div>

      {!isApi ? (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Integrations unavailable</p>
            <p className="mt-1 text-destructive/90">
              Google sync and field policies require CRM API mode. Enable{' '}
              <code className="rounded bg-background/60 px-1 text-xs">REACT_APP_CRM_USE_API=true</code> and restart the dev server, then reload this
              page.
            </p>
          </div>
        </div>
      ) : null}

      {isApi ? (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="text-lg font-semibold">Email &amp; calendar sync (Google)</h2>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => loadIntegrationStatus()}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh status
                </Button>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Connect a Google account (Calendar + Gmail read). Backend env:{' '}
                <code className="rounded bg-muted px-1 text-xs">CRM_GOOGLE_CLIENT_ID</code>,{' '}
                <code className="rounded bg-muted px-1 text-xs">CRM_GOOGLE_CLIENT_SECRET</code>,{' '}
                <code className="rounded bg-muted px-1 text-xs">CRM_GOOGLE_REDIRECT_URI</code>.
              </p>
              {integrationError ? (
                <div
                  role="alert"
                  className="mb-4 flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Could not load status</p>
                    <p className="mt-1 text-destructive/90">{integrationError}</p>
                  </div>
                </div>
              ) : null}
              {status && !integrationError ? (
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                  <CheckCircle2
                    className={cn('h-4 w-4 shrink-0', status.googleConnected ? 'text-storm-deep' : 'text-muted-foreground')}
                    aria-hidden
                  />
                  <span>
                    Google: <strong>{status.googleConnected ? 'Connected' : 'Not connected'}</strong>
                    {status.lastCalendarSyncAt && (
                      <> · Last calendar sync: {new Date(status.lastCalendarSyncAt).toLocaleString()}</>
                    )}
                    {status.lastEmailSyncAt && <> · Last email sync: {new Date(status.lastEmailSyncAt).toLocaleString()}</>}
                  </span>
                </div>
              ) : null}
              {!status && !integrationError ? (
                <p className="mb-4 text-sm text-muted-foreground">Loading integration status…</p>
              ) : null}
              {syncMsg ? (
                <div
                  role="status"
                  className="mb-4 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary dark:text-primary-deep"
                >
                  {syncMsg}
                </div>
              ) : null}
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="gap-1" onClick={() => void connectGoogle()}>
                    <Link2 className="h-4 w-4" />
                    Connect Google
                  </Button>
                  <Button type="button" variant="outline" className="gap-1" onClick={() => void runCalendar()}>
                    <Cloud className="h-4 w-4" />
                    Sync calendar
                  </Button>
                  <Button type="button" variant="outline" className="gap-1" onClick={() => void runEmail()}>
                    <RefreshCw className="h-4 w-4" />
                    Sync email
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <strong>manage_crm</strong> is required to connect Google and run sync. You can still view status with <strong>view_crm</strong>.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="text-lg font-semibold">Field-level permissions</h2>
                </div>
                {canManage ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={policiesLoading}
                    onClick={() => void loadFieldPolicies()}
                  >
                    <RefreshCw className={cn('h-4 w-4', policiesLoading && 'animate-spin')} />
                    Reload from server
                  </Button>
                ) : null}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Rules match <code className="rounded bg-muted px-1 text-xs">roleKey</code> to the user&apos;s MongoDB Role name (or{' '}
                <code className="rounded bg-muted px-1 text-xs">userType</code> if no role). Users with{' '}
                <code className="rounded bg-muted px-1 text-xs">manage_crm</code> bypass field restrictions. Default for others: read all, write
                none — add rules to allow writes per role.
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                Entities: {ENTITY_OPTIONS.join(', ')} · Include niche fields (e.g. locality, platformUserId) in rules if you mask them.
              </p>
              {policiesError ? (
                <div
                  role="alert"
                  className="mb-4 flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Could not load policies</p>
                    <p className="mt-1 text-destructive/90">{policiesError}</p>
                  </div>
                </div>
              ) : null}
              {canManage ? (
                <>
                  <Textarea
                    value={rulesJson}
                    onChange={(e) => setRulesJson(e.target.value)}
                    rows={14}
                    className="font-mono text-[13px]"
                    disabled={policiesLoading}
                    placeholder={policiesLoaded && !policiesError ? undefined : 'Loading rules…'}
                  />
                  <Button type="button" className="mt-4" disabled={policiesLoading} onClick={() => void savePolicies()}>
                    Save policies
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Policy JSON editing requires <strong>manage_crm</strong>. Ask an admin to adjust rules or grant permission.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="rounded-md border p-4">
            <h3 className="mb-3 text-sm font-semibold">Rule shape (example)</h3>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>roleKey</TableHead>
                    <TableHead>entity</TableHead>
                    <TableHead>field</TableHead>
                    <TableHead>read</TableHead>
                    <TableHead>write</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>staff</TableCell>
                    <TableCell>contact</TableCell>
                    <TableCell>email</TableCell>
                    <TableCell>true</TableCell>
                    <TableCell>false</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : null}

      {snackbar.open ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-4 left-1/2 z-[200] w-[min(100%,24rem)] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md',
            snackbar.severity === 'error'
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-storm-deep bg-storm-deep text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
