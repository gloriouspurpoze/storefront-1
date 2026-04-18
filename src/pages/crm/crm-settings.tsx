import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  CloudSync as SyncIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Checklist as ChecklistIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { crmApi } from '../../services/api/crm.api'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'

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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="CRM settings"
        subtitle="Google Calendar & Gmail sync, and server-side field policies (API mode)."
      />
      <CrmSubnav />

      <Accordion variant="outlined" disableGutters sx={{ mb: 2, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ChecklistIcon color="action" fontSize="small" />
            <Typography fontWeight={600}>Production launch checklist (internal)</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Use before go-live. Full env notes live in <code>.env.example</code> (CRM section).
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {PRODUCTION_LAUNCH_CHECKLIST.map((line) => (
              <Typography key={line.slice(0, 48)} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                {line}
              </Typography>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {!isApi && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Set <code>REACT_APP_CRM_USE_API=true</code> and point <code>REACT_APP_API_URL</code> at your fixer-backend
          <code>/api</code> to enable integrations and field-level permissions from MongoDB.
        </Alert>
      )}

      {isApi && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <LinkIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Email &amp; calendar sync (Google)
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Connect a Google workspace account with Calendar + Gmail read-only. Sync creates CRM activities
                (meetings from calendar; email subjects as notes). Configure OAuth in the backend env:{' '}
                <code>CRM_GOOGLE_CLIENT_ID</code>, <code>CRM_GOOGLE_CLIENT_SECRET</code>,{' '}
                <code>CRM_GOOGLE_REDIRECT_URI</code>.
              </Typography>
              {status && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Status: {status.googleConnected ? 'Connected' : 'Not connected'}
                  {status.lastCalendarSyncAt && (
                    <> · Last calendar sync: {new Date(status.lastCalendarSyncAt).toLocaleString()}</>
                  )}
                  {status.lastEmailSyncAt && (
                    <> · Last email sync: {new Date(status.lastEmailSyncAt).toLocaleString()}</>
                  )}
                </Typography>
              )}
              {syncMsg && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {syncMsg}
                </Alert>
              )}
              {canManage ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Button variant="contained" startIcon={<LinkIcon />} onClick={connectGoogle}>
                    Connect Google
                  </Button>
                  <Button variant="outlined" startIcon={<SyncIcon />} onClick={runCalendar}>
                    Sync calendar
                  </Button>
                  <Button variant="outlined" startIcon={<SyncIcon />} onClick={runEmail}>
                    Sync email
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Manage CRM permission required to connect and sync.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Field-level permissions
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Rules match <code>roleKey</code> to the user&apos;s MongoDB Role name (or <code>userType</code> if no
                role). Users with <code>manage_crm</code> bypass all field restrictions. Default for others: read all,
                write none — add rules to open specific fields per role.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Entities: {ENTITY_OPTIONS.join(', ')} · Example field keys: email, phone, notes, amount…
              </Typography>
              {canManage ? (
                <>
                  <TextField
                    fullWidth
                    multiline
                    minRows={12}
                    value={rulesJson}
                    onChange={(e) => setRulesJson(e.target.value)}
                    sx={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                  <Button variant="contained" sx={{ mt: 2 }} onClick={savePolicies}>
                    Save policies
                  </Button>
                </>
              ) : (
                <Typography variant="body2">View-only — field policy editing requires manage_crm.</Typography>
              )}
            </CardContent>
          </Card>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Rule shape
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>roleKey</TableCell>
                  <TableCell>entity</TableCell>
                  <TableCell>field</TableCell>
                  <TableCell>read</TableCell>
                  <TableCell>write</TableCell>
                </TableRow>
              </TableHead>
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
          </Paper>
        </>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
