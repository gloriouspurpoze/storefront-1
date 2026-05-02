/**
 * Admin: platform revenue, commission, and professional payout operations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  TablePagination,
  Skeleton,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  TrendingUp,
  AttachMoney,
  PendingActions,
  CheckCircle,
  AccountBalance,
  Refresh,
  Visibility,
  Check,
  Send,
  FileDownload,
} from '@mui/icons-material'
import { apiClient } from '../../services/apiClient'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { PageHeader } from '../../components/common/PageHeader'

const ADMIN_EARNINGS = '/earnings/admin'

/** Match backend `PAYOUT_SECOND_APPROVAL_AMOUNT_RUPEES` (default 50000). */
const PAYOUT_SECOND_APPROVAL_THRESHOLD_RUPEES = Number(
  process.env.REACT_APP_PAYOUT_SECOND_APPROVAL_AMOUNT_RUPEES ?? 50000
)

/** fetch() JSON: normalize both `{ success, data }` and nested `{ data: { success, data } }`. */
function readApiEnvelope(res: unknown): {
  success: boolean
  data: unknown
  message?: string
} {
  if (!res || typeof res !== 'object') {
    return { success: false, data: null }
  }
  const r = res as Record<string, unknown>
  const inner =
    r.data !== undefined &&
    typeof r.data === 'object' &&
    r.data !== null &&
    ('success' in (r.data as object) || 'data' in (r.data as object))
      ? (r.data as Record<string, unknown>)
      : r
  return {
    success: inner.success === true,
    data: inner.data,
    message: typeof inner.message === 'string' ? inner.message : undefined,
  }
}

function payoutsFromPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { payouts?: unknown[] }).payouts)) {
    return (data as { payouts: unknown[] }).payouts
  }
  return []
}

/** Same payout must not appear twice when merging status queries. */
function mergePayoutsById(lists: Payout[][]): Payout[] {
  const map = new Map<string, Payout>()
  for (const list of lists) {
    for (const p of list) {
      if (p?._id) map.set(p._id, p)
    }
  }
  return Array.from(map.values())
}

interface PlatformSummary {
  totalBookingAmount: number
  totalPlatformCommission: number
  totalProfessionalEarnings: number
  totalBookings: number
  pendingPayments: number
  verifiedPayments: number
  pendingPayouts: number
  paidPayouts: number
  cashInHand: number
  outstandingToProvider: number
}

const emptySummary = (): PlatformSummary => ({
  totalBookingAmount: 0,
  totalPlatformCommission: 0,
  totalProfessionalEarnings: 0,
  totalBookings: 0,
  pendingPayments: 0,
  verifiedPayments: 0,
  pendingPayouts: 0,
  paidPayouts: 0,
  cashInHand: 0,
  outstandingToProvider: 0,
})

interface Payout {
  _id: string
  payoutReference: string
  professionalId: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
  } | string | null
  grossAmount: number
  tdsAmount: number
  deductions: number
  netAmount: number
  payoutMethod: string
  /** Backend may use pending/requested for new pro requests; paid vs completed for history */
  status: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  bankDetails?: { accountNumber?: string; ifscCode?: string }
  upiId?: string
  notes?: string
  firstApprovedBy?: unknown
  firstApprovedAt?: string
  secondApprovedBy?: unknown
  secondApprovedAt?: string
}

function payoutRequiresDualApproval(p: Payout): boolean {
  const gross = Number(p.grossAmount ?? p.netAmount ?? 0)
  return Number.isFinite(gross) && gross >= PAYOUT_SECOND_APPROVAL_THRESHOLD_RUPEES
}

function payoutAwaitingSecondAdmin(p: Payout): boolean {
  const st = (p.status || '').toLowerCase()
  if (st !== 'requested' && st !== 'pending') return false
  return payoutRequiresDualApproval(p) && !!p.firstApprovedBy && !p.secondApprovedBy
}

function professionalLabel(p: Payout): { name: string; phone?: string } {
  const id = p.professionalId
  if (id && typeof id === 'object') {
    const name = [id.firstName, id.lastName].filter(Boolean).join(' ').trim() || '—'
    return { name, phone: id.phoneNumber }
  }
  return { name: typeof id === 'string' ? `ID: ${id.slice(0, 8)}…` : '—' }
}

/** Primary filter per tab; tab 0 & 2 also merge alternate status names (see loadData). */
const TAB_STATUS = ['requested', 'approved', 'completed'] as const
const TAB_EXPORT_SLUG = ['awaiting-approval', 'approved', 'completed-paid'] as const

export function AdminEarningsOverview() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summary, setSummary] = useState<PlatformSummary | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [transactionRef, setTransactionRef] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    setPage(0)
  }, [activeTab])

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const summaryRes = await apiClient.get(`${ADMIN_EARNINGS}/platform-summary`, {
        showLoading: false,
        showSuccessToast: false,
        showErrorToast: false,
      })
      const sEnv = readApiEnvelope(summaryRes)
      let err: string | null = null
      if (sEnv.success && sEnv.data && typeof sEnv.data === 'object') {
        setSummary({ ...emptySummary(), ...(sEnv.data as PlatformSummary) })
      } else {
        setSummary(null)
        err = sEnv.message || 'Could not load platform summary.'
      }

      const fetchOne = async (status: string): Promise<Payout[]> => {
        try {
          const payoutsRes = await apiClient.get(`${ADMIN_EARNINGS}/payouts`, {
            params: { status },
            showLoading: false,
            showSuccessToast: false,
            showErrorToast: false,
          })
          const pEnv = readApiEnvelope(payoutsRes)
          if (!pEnv.success) return []
          return payoutsFromPayload(pEnv.data) as Payout[]
        } catch {
          /* Unknown status enum on older APIs — ignore and try other filters */
          return []
        }
      }

      let list: Payout[] = []
      if (activeTab === 0) {
        // Pro wallet uses "pending" for new requests; some APIs use "requested" — load both
        const [pending, requested] = await Promise.all([fetchOne('pending'), fetchOne('requested')])
        list = mergePayoutsById([pending, requested])
      } else if (activeTab === 1) {
        list = await fetchOne('approved')
      } else {
        const [completed, paid] = await Promise.all([fetchOne('completed'), fetchOne('paid')])
        list = mergePayoutsById([completed, paid])
      }

      list.sort(
        (a, b) =>
          new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime()
      )
      setPayouts(list)

      setLoadError(err)
      setLastUpdated(new Date())
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Failed to load earnings data. Check API URL and authentication.'
      setLoadError(msg)
      dispatch(addToast({ message: msg, severity: 'error', duration: 6000 }))
    } finally {
      setLoading(false)
      setSummaryLoading(false)
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprovePayout = async (payoutId: string) => {
    try {
      const res = await apiClient.post(
        `${ADMIN_EARNINGS}/payouts/${payoutId}/approve`,
        {},
        { showSuccessToast: false, showErrorToast: false }
      )
      const env = readApiEnvelope(res)
      if (env.success) {
        dispatch(
          addToast({
            message:
              env.message ||
              'Payout approved successfully',
            severity: 'success',
          })
        )
        loadData()
      } else {
        dispatch(
          addToast({
            message: env.message || 'Failed to approve payout',
            severity: 'error',
          })
        )
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to approve payout'
      dispatch(addToast({ message: msg, severity: 'error' }))
    }
  }

  const handleCompletePayout = async () => {
    if (!selectedPayout || !transactionRef.trim()) {
      dispatch(addToast({ message: 'Please enter transaction reference', severity: 'error' }))
      return
    }

    try {
      const res = await apiClient.post(
        `${ADMIN_EARNINGS}/payouts/${selectedPayout._id}/complete`,
        { transactionReference: transactionRef.trim() },
        { showSuccessToast: false, showErrorToast: false }
      )
      const env = readApiEnvelope(res)
      if (env.success) {
        dispatch(addToast({ message: 'Payout marked as completed', severity: 'success' }))
        setCompleteDialogOpen(false)
        setSelectedPayout(null)
        setTransactionRef('')
        loadData()
      } else {
        dispatch(
          addToast({
            message: env.message || 'Failed to complete payout',
            severity: 'error',
          })
        )
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to complete payout'
      dispatch(addToast({ message: msg, severity: 'error' }))
    }
  }

  const dualApprovalHint = (payout: Payout) => {
    if (!payoutRequiresDualApproval(payout)) return null
    const st = (payout.status || '').toLowerCase()
    if (st !== 'requested' && st !== 'pending') return null
    if (!payout.firstApprovedBy) {
      return (
        <Chip
          size="small"
          variant="outlined"
          color="warning"
          label={`2 admins · ≥ ₹${PAYOUT_SECOND_APPROVAL_THRESHOLD_RUPEES.toLocaleString('en-IN')}`}
          sx={{ mt: 0.5, maxWidth: '100%' }}
        />
      )
    }
    if (!payout.secondApprovedBy) {
      return (
        <Chip
          size="small"
          color="warning"
          label="1/2 — needs second admin"
          sx={{ mt: 0.5 }}
        />
      )
    }
    return null
  }

  const getStatusChip = (status: string) => {
    const config: Record<string, { label: string; color: 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
      pending: { label: 'Pending review', color: 'warning' },
      requested: { label: 'Requested', color: 'info' },
      approved: { label: 'Approved', color: 'warning' },
      processing: { label: 'Processing', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
      paid: { label: 'Paid', color: 'success' },
      failed: { label: 'Failed', color: 'error' },
      cancelled: { label: 'Cancelled', color: 'default' },
      on_hold: { label: 'On hold', color: 'error' },
    }
    const c = config[status] || { label: status || '—', color: 'default' as const }
    return <Chip label={c.label} color={c.color} size="small" />
  }

  const canApprove = (status: string) => status === 'pending' || status === 'requested'

  const safeSummary = summary ?? emptySummary()

  const paginatedPayouts = useMemo(
    () => payouts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [payouts, page, rowsPerPage]
  )

  const exportCsv = () => {
    const headers = [
      'Reference',
      'Professional',
      'Phone',
      'Requested',
      'Gross',
      'TDS',
      'Net',
      'Method',
      'Status',
    ]
    const rows = payouts.map((p) => {
      const { name, phone } = professionalLabel(p)
      return [
        p.payoutReference,
        name,
        phone ?? '',
        p.requestedAt ? new Date(p.requestedAt).toISOString() : '',
        String(p.grossAmount ?? ''),
        String(p.tdsAmount ?? ''),
        String(p.netAmount ?? ''),
        p.payoutMethod,
        p.status,
      ]
    })
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payouts-${TAB_EXPORT_SLUG[activeTab]}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Platform Earnings & Payouts"
        subtitle="GMV, commission, and professional payout lifecycle (request → approve → mark paid)."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={exportCsv}
              disabled={payouts.length === 0}
              size="small"
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => loadData()}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Stack>
        }
      />

      {lastUpdated && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Last updated: {lastUpdated.toLocaleString()}
        </Typography>
      )}

      {loadError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
      )}

      {summaryLoading ? (
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3, 4].map((k) => (
            <Grid item xs={12} md={3} key={k}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoney sx={{ mr: 1 }} />
                  <Typography variant="body2">Total Revenue (GMV)</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{Number(safeSummary.totalBookingAmount || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  From {safeSummary.totalBookings} bookings
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="body2">Platform Commission</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{Number(safeSummary.totalPlatformCommission || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {safeSummary.totalBookingAmount
                    ? `${((Number(safeSummary.totalPlatformCommission) / Number(safeSummary.totalBookingAmount)) * 100).toFixed(1)}% of GMV`
                    : '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <PendingActions sx={{ mr: 1 }} />
                  <Typography variant="body2">Pending Payouts (amount)</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{Number(safeSummary.pendingPayouts || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Outstanding to professionals
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircle sx={{ mr: 1 }} />
                  <Typography variant="body2">Total Paid Out</Typography>
                </Box>
                <Typography variant="h4" fontWeight="700">
                  ₹{Number(safeSummary.paidPayouts || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Completed transfers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Professional earnings (total)
            </Typography>
            <Typography variant="h6" fontWeight="600">
              ₹{Number(safeSummary.totalProfessionalEarnings || 0).toLocaleString('en-IN')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pending customer payments
            </Typography>
            <Typography variant="h6" fontWeight="600" color="warning.main">
              ₹{Number(safeSummary.pendingPayments || 0).toLocaleString('en-IN')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cash in hand (platform)
            </Typography>
            <Typography variant="h6" fontWeight="600" color="success.main">
              ₹{Number(safeSummary.cashInHand || 0).toLocaleString('en-IN')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Outstanding to providers
            </Typography>
            <Typography variant="h6" fontWeight="600">
              ₹{Number(safeSummary.outstandingToProvider || 0).toLocaleString('en-IN')}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PendingActions />} iconPosition="start" label="Awaiting approval" />
          <Tab icon={<AccountBalance />} iconPosition="start" label="Approved" />
          <Tab icon={<CheckCircle />} iconPosition="start" label="Completed" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Payout batches of{' '}
          <strong>₹{PAYOUT_SECOND_APPROVAL_THRESHOLD_RUPEES.toLocaleString('en-IN')}</strong> or more require{' '}
          <strong>two different</strong> admin approvals before they appear under Approved. The Approve button stays
          available until both steps are done.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {activeTab === 0
              ? 'Awaiting approval (pending & requested)'
              : activeTab === 1
                ? 'Approved payouts'
                : 'Completed & paid payouts'}
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : payouts.length > 0 ? (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference</TableCell>
                      <TableCell>Professional</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="right">Gross</TableCell>
                      <TableCell align="right">TDS</TableCell>
                      <TableCell align="right">Net</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPayouts.map((payout) => {
                      const prof = professionalLabel(payout)
                      return (
                        <TableRow key={payout._id} hover>
                          <TableCell>
                            <Typography fontWeight="600">{payout.payoutReference}</Typography>
                          </TableCell>
                          <TableCell>
                            {prof.name}
                            {prof.phone && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {prof.phone}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {payout.requestedAt
                              ? new Date(payout.requestedAt).toLocaleString('en-IN')
                              : '—'}
                          </TableCell>
                          <TableCell align="right">
                            ₹{Number(payout.grossAmount ?? 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell align="right">
                            ₹{Number(payout.tdsAmount ?? 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="600" color="success.main">
                              ₹{Number(payout.netAmount ?? 0).toLocaleString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textTransform: 'uppercase' }}>
                            {(payout.payoutMethod || '').replace(/_/g, ' ')}
                            {payout.payoutMethod === 'bank_transfer' && payout.bankDetails && (
                              <Tooltip
                                title={`${payout.bankDetails.accountNumber ?? ''} · ${payout.bankDetails.ifscCode ?? ''}`}
                              >
                                <IconButton size="small" aria-label="Bank details">
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {(payout.payoutMethod === 'upi' || payout.payoutMethod === 'paytm') && payout.upiId && (
                              <Typography variant="caption" display="block">
                                {payout.upiId}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box>
                              {getStatusChip(payout.status)}
                              {dualApprovalHint(payout)}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {activeTab === 0 && canApprove(payout.status) && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<Check />}
                                  onClick={() => handleApprovePayout(payout._id)}
                                >
                                  {payoutAwaitingSecondAdmin(payout) ? 'Approve (2 of 2)' : 'Approve'}
                                </Button>
                              )}
                              {activeTab === 1 && payout.status === 'approved' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Send />}
                                  onClick={() => {
                                    setSelectedPayout(payout)
                                    setCompleteDialogOpen(true)
                                  }}
                                >
                                  Mark paid
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={payouts.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10))
                  setPage(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          ) : (
            <Alert severity="info">
              No payouts in this queue. New professional requests usually appear as{' '}
              <strong>pending</strong> or <strong>requested</strong> on the first tab.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mark payout as paid</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedPayout && (
              <Box mb={3}>
                <Typography variant="body2" gutterBottom>
                  <strong>Reference:</strong> {selectedPayout.payoutReference}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Professional:</strong> {professionalLabel(selectedPayout).name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Amount:</strong> ₹
                  {Number(selectedPayout.netAmount ?? 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Method:</strong> {(selectedPayout.payoutMethod || '').toUpperCase().replace(/_/g, ' ')}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Transaction reference / UTR"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="Bank UTR or transfer ID"
              helperText="Required for audit trail and reconciliation."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCompletePayout}>
            Confirm paid
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
