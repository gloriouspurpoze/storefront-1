/**
 * Admin: platform revenue, commission, and professional payout operations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  IndianRupee,
  Hourglass,
  CircleCheck,
  Landmark,
  RefreshCw,
  Eye,
  Check,
  Send,
  Download,
  Loader2,
} from 'lucide-react'
import { apiClient } from '../../services/apiClient'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { PageHeader } from '../../components/common/PageHeader'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { HStack } from '../../components/ui/spacing'

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
const TAB_EXPORT_SLUG = ['awaiting-approval', 'approved', 'completed-paid'] as const

export function AdminEarningsOverview() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('0')
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

  const activeTabIdx = Number(activeTab)

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
      if (activeTabIdx === 0) {
        const [pending, requested] = await Promise.all([fetchOne('pending'), fetchOne('requested')])
        list = mergePayoutsById([pending, requested])
      } else if (activeTabIdx === 1) {
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
  }, [activeTabIdx, dispatch])

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
            message: env.message || 'Payout approved successfully',
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
        <Badge variant="outline" className="mt-1 max-w-full border-bloom-coral/50 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep">
          2 admins · ≥ ₹{PAYOUT_SECOND_APPROVAL_THRESHOLD_RUPEES.toLocaleString('en-IN')}
        </Badge>
      )
    }
    if (!payout.secondApprovedBy) {
      return (
        <Badge variant="warning" className="mt-1">
          1/2 — needs second admin
        </Badge>
      )
    }
    return null
  }

  const statusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending review', className: 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep' },
      requested: { label: 'Requested', className: 'border-primary/40 bg-primary/10 text-primary dark:text-primary-deep' },
      approved: { label: 'Approved', className: 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep' },
      processing: { label: 'Processing', className: 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep' },
      completed: { label: 'Completed', className: 'border-storm-deep/40 bg-storm-deep/10 text-storm-deep dark:text-on-ink' },
      paid: { label: 'Paid', className: 'border-storm-deep/40 bg-storm-deep/10 text-storm-deep dark:text-on-ink' },
      failed: { label: 'Failed', className: 'border-destructive/40 bg-destructive/10 text-destructive dark:text-destructive-foreground' },
      cancelled: { label: 'Cancelled', className: 'border-border bg-muted text-muted-foreground' },
      on_hold: { label: 'On hold', className: 'border-destructive/40 bg-destructive/10 text-destructive dark:text-destructive-foreground' },
    }
    const c = map[s] || { label: status || '—', className: 'border-border bg-muted' }
    return (
      <Badge variant="outline" className={cn('text-xs font-medium', c.className)}>
        {c.label}
      </Badge>
    )
  }

  const canApprove = (status: string) => status === 'pending' || status === 'requested'

  const safeSummary = summary ?? emptySummary()

  const paginatedPayouts = useMemo(
    () => payouts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [payouts, page, rowsPerPage]
  )

  const totalPages = Math.max(1, Math.ceil(payouts.length / rowsPerPage) || 1)

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
    a.download = `payouts-${TAB_EXPORT_SLUG[activeTabIdx]}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Platform Earnings & Payouts"
          subtitle="GMV, commission, and professional payout lifecycle (request → approve → mark paid)."
          action={
            <HStack className="flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={payouts.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>
            </HStack>
          }
        />

        {lastUpdated && (
          <p className="mb-4 text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleString()}</p>
        )}

        {loadError && (
          <div
            className="relative mb-4 rounded-md border border-bloom-coral bg-bloom-rose p-4 pr-10 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/40 dark:text-bloom-deep"
            role="alert"
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded p-1 text-bloom-coral hover:bg-bloom-rose/60 dark:text-bloom-deep"
              aria-label="Dismiss"
              onClick={() => setLoadError(null)}
            >
              ×
            </button>
            {loadError}
          </div>
        )}

        {summaryLoading ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="h-[140px] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary-deep text-white shadow-md">
              <CardContent className="p-6">
                <div className="mb-1 flex items-center gap-1">
                  <IndianRupee className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Total Revenue (GMV)</span>
                </div>
                <p className="text-2xl font-bold sm:text-3xl">₹{Number(safeSummary.totalBookingAmount || 0).toLocaleString('en-IN')}</p>
                <p className="mt-1 text-xs opacity-90">From {safeSummary.totalBookings} bookings</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary-deep to-destructive text-white shadow-md">
              <CardContent className="p-6">
                <div className="mb-1 flex items-center gap-1">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Platform Commission</span>
                </div>
                <p className="text-2xl font-bold sm:text-3xl">
                  ₹{Number(safeSummary.totalPlatformCommission || 0).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  {safeSummary.totalBookingAmount
                    ? `${((Number(safeSummary.totalPlatformCommission) / Number(safeSummary.totalBookingAmount)) * 100).toFixed(1)}% of GMV`
                    : '—'}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary text-white shadow-md">
              <CardContent className="p-6">
                <div className="mb-1 flex items-center gap-1">
                  <Hourglass className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Pending Payouts (amount)</span>
                </div>
                <p className="text-2xl font-bold sm:text-3xl">₹{Number(safeSummary.pendingPayouts || 0).toLocaleString('en-IN')}</p>
                <p className="mt-1 text-xs opacity-90">Outstanding to professionals</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-gradient-to-br from-storm-sea to-storm-sea text-white shadow-md">
              <CardContent className="p-6">
                <div className="mb-1 flex items-center gap-1">
                  <CircleCheck className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Total Paid Out</span>
                </div>
                <p className="text-2xl font-bold sm:text-3xl">₹{Number(safeSummary.paidPayouts || 0).toLocaleString('en-IN')}</p>
                <p className="mt-1 text-xs opacity-90">Completed transfers</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Professional earnings (total)</p>
              <p className="text-lg font-semibold">₹{Number(safeSummary.totalProfessionalEarnings || 0).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending customer payments</p>
              <p className="text-lg font-semibold text-bloom-coral dark:text-bloom-coral">
                ₹{Number(safeSummary.pendingPayments || 0).toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Cash in hand (platform)</p>
              <p className="text-lg font-semibold text-storm-deep dark:text-storm-sea">
                ₹{Number(safeSummary.cashInHand || 0).toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Outstanding to providers</p>
              <p className="text-lg font-semibold">₹{Number(safeSummary.outstandingToProvider || 0).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="0" className="rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Hourglass className="mr-2 h-4 w-4" />
                Awaiting approval
              </TabsTrigger>
              <TabsTrigger value="1" className="rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <Landmark className="mr-2 h-4 w-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="2" className="rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary">
                <CircleCheck className="mr-2 h-4 w-4" />
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {activeTabIdx === 0 && (
          <div
            className="mb-4 rounded-md border border-primary/20 bg-primary-soft p-4 text-sm dark:border-primary dark:bg-primary/40"
            role="status"
          >
            Payout batches of <strong>₹{PAYOUT_SECOND_APPROVAL_THRESHOLD_RUPEES.toLocaleString('en-IN')}</strong> or more
            require <strong>two different</strong> admin approvals before they appear under Approved. The Approve button stays
            available until both steps are done.
          </div>
        )}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {activeTabIdx === 0
                ? 'Awaiting approval (pending & requested)'
                : activeTabIdx === 1
                  ? 'Approved payouts'
                  : 'Completed & paid payouts'}
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : payouts.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Professional</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">TDS</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayouts.map((payout) => {
                        const prof = professionalLabel(payout)
                        return (
                          <TableRow key={payout._id}>
                            <TableCell className="font-semibold">{payout.payoutReference}</TableCell>
                            <TableCell>
                              {prof.name}
                              {prof.phone && <span className="mt-0.5 block text-xs text-muted-foreground">{prof.phone}</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {payout.requestedAt
                                ? new Date(payout.requestedAt).toLocaleString('en-IN')
                                : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              ₹{Number(payout.grossAmount ?? 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              ₹{Number(payout.tdsAmount ?? 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-storm-deep tabular-nums dark:text-storm-sea">
                              ₹{Number(payout.netAmount ?? 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="uppercase">
                              <span className="text-sm">{(payout.payoutMethod || '').replace(/_/g, ' ')}</span>
                              {payout.payoutMethod === 'bank_transfer' && payout.bankDetails && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-1 h-8 w-8" type="button" aria-label="Bank details">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {payout.bankDetails.accountNumber ?? ''} · {payout.bankDetails.ifscCode ?? ''}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {(payout.payoutMethod === 'upi' || payout.payoutMethod === 'paytm') && payout.upiId && (
                                <span className="mt-0.5 block text-xs normal-case text-muted-foreground">{payout.upiId}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start gap-1">
                                {statusBadge(payout.status)}
                                {dualApprovalHint(payout)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                {activeTabIdx === 0 && canApprove(payout.status) && (
                                  <Button
                                    size="sm"
                                    className="bg-storm-deep hover:bg-storm-deep"
                                    type="button"
                                    onClick={() => handleApprovePayout(payout._id)}
                                  >
                                    <Check className="mr-1 h-4 w-4" />
                                    {payoutAwaitingSecondAdmin(payout) ? 'Approve (2 of 2)' : 'Approve'}
                                  </Button>
                                )}
                                {activeTabIdx === 1 && payout.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setSelectedPayout(payout)
                                      setCompleteDialogOpen(true)
                                    }}
                                  >
                                    <Send className="mr-1 h-4 w-4" />
                                    Mark paid
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page</span>
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10))
                        setPage(0)
                      }}
                    >
                      {[5, 10, 25, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled={page <= 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm tabular-nums">
                      Page {page + 1} of {totalPages} ({payouts.length} total)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div
                className="rounded-md border border-primary/20 bg-primary-soft p-4 text-sm dark:border-primary dark:bg-primary/40"
                role="status"
              >
                No payouts in this queue. New professional requests usually appear as <strong>pending</strong> or{' '}
                <strong>requested</strong> on the first tab.
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark payout as paid</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {selectedPayout && (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Reference:</strong> {selectedPayout.payoutReference}
                  </p>
                  <p>
                    <strong>Professional:</strong> {professionalLabel(selectedPayout).name}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{Number(selectedPayout.netAmount ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p>
                    <strong>Method:</strong> {(selectedPayout.payoutMethod || '').toUpperCase().replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="txn-ref">Transaction reference / UTR</Label>
                <Input
                  id="txn-ref"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Bank UTR or transfer ID"
                />
                <p className="text-xs text-muted-foreground">Required for audit trail and reconciliation.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleCompletePayout}>
                Confirm paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
