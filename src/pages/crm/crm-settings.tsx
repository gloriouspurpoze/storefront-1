import React, { useEffect, useState } from 'react'
import { ChevronDown, Cloud, Link2, ListChecks, RefreshCw, Shield } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { crmApi } from '../../services/api/crm.api'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { Card, CardContent } from '../../components/ui/card'
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

const PRODUCTION_LAUNCH_CHECKLIST: string[] = [
  'Secrets: JWT and CRM_GOOGLE_* live only in the server environment or secrets manager — never in git or the browser bundle.',
  'HTTPS everywhere for admin and API in production; OAuth redirect URIs must match backend CRM_GOOGLE_REDIRECT_URI exactly.',
  'MongoDB: backups scheduled and a restore drill done; CRM collections included.',
  'RBAC: run seed:crm-permissions (or equivalent); confirm view_crm / manage_crm on the right roles and test field masks for non-admins.',
  'CORS: your admin origin is allowed to call REACT_APP_API_URL (see fixer-backend CORS / deployment docs).',
  'Google Cloud: OAuth consent screen appropriate for production; Calendar + Gmail APIs enabled for the OAuth client.',
  'Operations: monitor or rate-limit /api/crm and sync routes; alert on 5xx spikes.',
  'Security: plan encryption at rest for Google refresh tokens in MongoDB if your policy requires it.',
  'Compliance: document Gmail/calendar read access in your privacy policy; define CRM data retention.',
  'Smoke test: create/edit contact, deal, activity; CSV export; field policies; Google connect + one calendar and one email sync.',
]

export function CrmSettings() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const isApi = crmService.isApiEnabled()

  const [status, setStatus] = useState<{
    googleConnected: boolean
    lastCalendarSyncAt?: string
    lastEmailSyncAt?: string
  } | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [rulesJson, setRulesJson] = useState('[]')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (!isApi || !canManage) return
    crmApi
      .getIntegrationStatus()
      .then(setStatus)
      .catch(() => setStatus({ googleConnected: false }))
    crmApi
      .getFieldPolicies()
      .then((r) => setRulesJson(JSON.stringify(r.rules, null, 2)))
      .catch(() => {})
  }, [isApi, canManage])

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
      const rules = JSON.parse(rulesJson)
      await crmApi.saveFieldPolicies(rules)
      setSnackbar({ open: true, message: 'Field policies saved', severity: 'success' })
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
    } else if (q === 'error') {
      setSnackbar({ open: true, message: 'Google connection failed', severity: 'error' })
      window.history.replaceState({}, '', '/crm/settings')
    }
  }, [])

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="CRM settings"
        subtitle="Google Calendar & Gmail sync, and server-side field policies (API mode)."
      />
      <CrmSubnav />

      <details className="mb-4 rounded-md border group">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          Production launch checklist (internal)
        </summary>
        <div className="border-t px-3 pb-4 pt-0">
          <p className="mb-3 text-sm text-muted-foreground">
            Use before go-live. Full env notes live in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> (CRM section).
          </p>
          <ul className="list-inside list-disc space-y-2 pl-0.5 text-sm text-muted-foreground">
            {PRODUCTION_LAUNCH_CHECKLIST.map((line) => (
              <li key={line.slice(0, 48)}>{line}</li>
            ))}
          </ul>
        </div>
      </details>

      {!isApi && (
        <div
          role="status"
          className="mb-4 rounded-md border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-900 dark:text-sky-100"
        >
          Set <code className="rounded bg-background/60 px-1">REACT_APP_CRM_USE_API=true</code> and point{' '}
          <code className="rounded bg-background/60 px-1">REACT_APP_API_URL</code> at your fixer-backend
          <code className="rounded bg-background/60 px-1">/api</code> to enable integrations and field-level permissions from MongoDB.
        </div>
      )}

      {isApi && (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Email &amp; calendar sync (Google)</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Connect a Google workspace account with Calendar + Gmail read-only. Sync creates CRM activities (meetings from calendar; email
                subjects as notes). Configure OAuth in the backend env: <code className="rounded bg-muted px-1 text-xs">CRM_GOOGLE_CLIENT_ID</code>
                , <code className="rounded bg-muted px-1 text-xs">CRM_GOOGLE_CLIENT_SECRET</code>,{' '}
                <code className="rounded bg-muted px-1 text-xs">CRM_GOOGLE_REDIRECT_URI</code>.
              </p>
              {status && (
                <p className="mb-4 text-sm">
                  Status: {status.googleConnected ? 'Connected' : 'Not connected'}
                  {status.lastCalendarSyncAt && (
                    <> · Last calendar sync: {new Date(status.lastCalendarSyncAt).toLocaleString()}</>
                  )}
                  {status.lastEmailSyncAt && <> · Last email sync: {new Date(status.lastEmailSyncAt).toLocaleString()}</>}
                </p>
              )}
              {syncMsg && (
                <div
                  role="status"
                  className="mb-4 rounded-md border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-900 dark:text-sky-100"
                >
                  {syncMsg}
                </div>
              )}
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Button className="gap-1" onClick={connectGoogle}>
                    <Link2 className="h-4 w-4" />
                    Connect Google
                  </Button>
                  <Button variant="outline" className="gap-1" onClick={runCalendar}>
                    <Cloud className="h-4 w-4" />
                    Sync calendar
                  </Button>
                  <Button variant="outline" className="gap-1" onClick={runEmail}>
                    <RefreshCw className="h-4 w-4" />
                    Sync email
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Manage CRM permission required to connect and sync.</p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Field-level permissions</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Rules match <code className="rounded bg-muted px-1 text-xs">roleKey</code> to the user&apos;s MongoDB Role name (or{' '}
                <code className="rounded bg-muted px-1 text-xs">userType</code> if no role). Users with{' '}
                <code className="rounded bg-muted px-1 text-xs">manage_crm</code> bypass all field restrictions. Default for others: read all, write
                none — add rules to open specific fields per role.
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                Entities: {ENTITY_OPTIONS.join(', ')} · Example field keys: email, phone, notes, amount…
              </p>
              {canManage ? (
                <>
                  <Textarea
                    value={rulesJson}
                    onChange={(e) => setRulesJson(e.target.value)}
                    rows={14}
                    className="font-mono text-[13px]"
                  />
                  <Button className="mt-4" onClick={savePolicies}>
                    Save policies
                  </Button>
                </>
              ) : (
                <p className="text-sm">View-only — field policy editing requires manage_crm.</p>
              )}
            </CardContent>
          </Card>

          <div className="rounded-md border p-4">
            <h3 className="mb-3 text-sm font-semibold">Rule shape</h3>
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
                    <TableCell>moderator</TableCell>
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
      )}

      {snackbar.open ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-4 left-1/2 z-[200] w-[min(100%,20rem)] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md',
            snackbar.severity === 'error'
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-emerald-600 bg-emerald-600 text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
