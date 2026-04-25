import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  IndianRupee,
  CreditCard,
  Building2,
  Banknote,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react'
import {
  DismissibleAlert,
  KpiStatCard,
  PageHeader,
  StandardTable,
  type StandardTableColumn,
} from '../../components/common'
import { PaymentsService } from '../../services/api/payments.service'
import { usePermissions } from '../../hooks/usePermissions'
import type { Payment } from '../../types'
import { downloadCsv, openPrintableHtml } from '../../lib/exportUtils'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Separator } from '../../components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { cn } from '../../lib/utils'

const PAYMENT_TABS = [
  { label: 'All Payments', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
] as const

const EXPORT_PAGE_SIZE = 200

export function Payments() {
  const { checkPermission } = usePermissions()
  const canRefund = checkPermission('refund_payments')
  const canExport = checkPermission('export_payments')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real payments data from API
  const [payments, setPayments] = useState<Payment[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Real stats from API (normalized for backend: totalAmount, completedPayments, pendingPayments, refundAmount)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    refundedCount: 0,
    refundedAmount: 0,
    totalCount: 0,
  })

  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all')

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [currentTab, searchQuery, dateRange])

  const [exporting, setExporting] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundAmountInput, setRefundAmountInput] = useState('')
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const getDateRangeParams = (): { start_date?: string; end_date?: string } => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    let start: Date
    if (dateRange === 'today') {
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === '7d') {
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === '30d') {
      start = new Date(now)
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
    } else {
      return {}
    }
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    }
  }

  const buildListQuery = useCallback(
    (page: number, limit: number) => {
      const status = PAYMENT_TABS[currentTab].value
      const query: {
        page: number
        limit: number
        status?: string
        search?: string
        start_date?: string
        end_date?: string
      } = {
        page,
        limit,
        ...getDateRangeParams(),
      }
      if (status !== 'all') query.status = status
      if (searchQuery.trim()) query.search = searchQuery.trim()
      return query
    },
    [currentTab, searchQuery, dateRange]
  )

  const fetchPaymentsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const statsResponse = await PaymentsService.getPaymentStats()
      if (statsResponse.success && statsResponse.data) {
        const d = statsResponse.data as any
        setStats({
          totalRevenue: d.totalAmount ?? d.totalRevenue ?? 0,
          pendingPayments: d.pendingPayments ?? d.byStatus?.pending ?? 0,
          completedPayments: d.completedPayments ?? d.byStatus?.completed ?? 0,
          failedPayments: d.failedPayments ?? d.byStatus?.failed ?? 0,
          refundedCount: d.totalRefunds ?? 0,
          refundedAmount: d.refundAmount ?? 0,
          totalCount: d.totalPayments ?? 0,
        })
      }

      const paymentsResponse = await PaymentsService.getPayments(buildListQuery(pagination.page, pagination.limit))
      if (paymentsResponse.success && paymentsResponse.data) {
        const data = paymentsResponse.data as any
        const list = data.payments ?? data ?? []
        setPayments(Array.isArray(list) ? list : [])
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: data.pagination.page ?? prev.page,
            limit: data.pagination.limit ?? prev.limit,
            total: data.pagination.total ?? 0,
            totalPages: data.pagination.totalPages ?? 0,
          }))
        }
      } else {
        setPayments([])
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err)
      setError(err?.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [buildListQuery, pagination.page, pagination.limit])

  useEffect(() => {
    void fetchPaymentsData()
  }, [fetchPaymentsData])

  const paymentStatusClass = (status: string) => {
    const s = String(status || '')
      .toLowerCase()
      .replace(/_/g, ' ')
    if (s.includes('pending')) return 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30'
    if (s === 'paid' || s === 'completed' || s.includes('success'))
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
    if (s.includes('fail') || s.includes('cancel')) return 'bg-destructive/15 text-destructive border-destructive/30'
    if (s.includes('refund')) return 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/30'
    return 'bg-muted text-muted-foreground border-border'
  }

  const getStatusIcon = (status: string) => {
    const s = String(status || '')
      .toLowerCase()
      .replace(/_/g, ' ')
    const c = 'h-3.5 w-3.5 shrink-0'
    if (s.includes('pending')) return <Clock className={c} />
    if (s === 'paid' || s === 'completed' || s.includes('success')) return <CheckCircle className={c} />
    if (s.includes('fail') || s.includes('refund') || s.includes('cancel')) return <XCircle className={c} />
    return <Receipt className={c} />
  }

  const getPaymentMethodIcon = (method: string) => {
    const c = 'h-3.5 w-3.5 shrink-0'
    switch (String(method || '').toLowerCase()) {
      case 'card':
        return <CreditCard className={c} />
      case 'bank':
      case 'netbanking':
        return <Building2 className={c} />
      case 'wallet':
      case 'cash':
      case 'upi':
        return <Banknote className={c} />
      default:
        return <IndianRupee className={c} />
    }
  }

  const formatDate = (val: string | Date | undefined) => {
    if (!val) return '—'
    const d = typeof val === 'string' ? new Date(val) : val
    if (Number.isNaN(d.getTime())) return String(val)
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number | undefined, currency?: string) => {
    if (amount == null) return '—'
    const c = (currency || 'INR').toUpperCase()
    if (c === 'INR' || c === '₹') return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    return `${c} ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  const getPaymentMethodLabel = (method: string) => {
    const m = String(method || '').toLowerCase()
    if (m === 'upi') return 'UPI'
    if (m === 'card' || m === 'credit_card') return 'Card'
    if (m === 'netbanking' || m === 'bank') return 'Net Banking'
    if (m === 'cash' || m === 'pay_after_service') return 'Cash'
    if (m === 'wallet') return 'Wallet'
    return method ? String(method).replace(/_/g, ' ') : '—'
  }

  const filteredPayments = payments

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailsOpen(true)
  }

  const openRefundDialog = (payment: Payment) => {
    if (!canRefund) return
    setRefundTarget(payment)
    setRefundReason('')
    setRefundAmountInput('')
    setRefundDialogOpen(true)
    setDetailsOpen(false)
    setError(null)
  }

  const closeRefundDialog = () => {
    if (refundSubmitting) return
    setRefundDialogOpen(false)
    setRefundTarget(null)
  }

  const submitRefund = async () => {
    if (!refundTarget) return
    const reason = refundReason.trim()
    if (!reason) {
      setError('Please enter a reason for the refund.')
      return
    }
    const p = refundTarget as any
    const id = String(p.id ?? p._id ?? '')
    if (!id) {
      setError('Missing payment id.')
      return
    }
    const maxAmt = Number(p.amount ?? 0)
    let amount: number | undefined
    if (refundAmountInput.trim()) {
      const n = parseFloat(refundAmountInput.replace(/,/g, ''))
      if (Number.isNaN(n) || n <= 0) {
        setError('Enter a valid partial refund amount.')
        return
      }
      if (n > maxAmt) {
        setError('Refund amount cannot exceed the original payment amount.')
        return
      }
      amount = n
    }
    setRefundSubmitting(true)
    setError(null)
    try {
      await PaymentsService.refundPayment(id, amount, reason)
      setSuccessMessage('Refund processed successfully.')
      setRefundDialogOpen(false)
      setRefundTarget(null)
      await fetchPaymentsData()
    } catch (err: any) {
      setError(err?.message || 'Failed to process refund')
    } finally {
      setRefundSubmitting(false)
    }
  }

  const handleDownloadReceipt = (payment?: Payment | null) => {
    const p = (payment ?? selectedPayment) as unknown as Record<string, unknown>
    if (!p) return
    const id = p.id ?? p._id ?? ''
    const txn = p.transaction_id || p.transactionId || `TXN-${String(id).slice(-8)}`
    const amt = Number(p.amount ?? 0)
    const cur = String(p.currency || 'INR').toUpperCase()
    const status = p.status ?? '—'
    const method = getPaymentMethodLabel(
      String(p.payment_method || p.paymentMethod || ''),
    )
    const when = formatDate(
      (p.created_at || p.createdAt) as string | Date | undefined,
    )
    const cust =
      p.customer_name ||
      p.customerName ||
      (p.customer as { name?: string } | undefined)?.name ||
      '—'
    const booking = p.booking_id || p.bookingId || '—'
    const body = `
      <h1>Payment receipt</h1>
      <p class="muted">Generated ${new Date().toLocaleString()}</p>
      <table>
        <tr><td>Transaction</td><td><strong>${String(txn)}</strong></td></tr>
        <tr><td>Booking / ref</td><td>${String(booking)}</td></tr>
        <tr><td>Customer</td><td>${String(cust)}</td></tr>
        <tr><td>Amount</td><td><strong>${formatCurrency(amt, cur)}</strong></td></tr>
        <tr><td>Status</td><td>${String(status)}</td></tr>
        <tr><td>Method</td><td>${String(method)}</td></tr>
        <tr><td>Date</td><td>${when}</td></tr>
      </table>
      <p class="muted" style="margin-top:24px">This is a printable summary. Retain for your records.</p>
    `
    openPrintableHtml(`Receipt-${txn}`, body)
  }

  const buildCsvRows = (list: Payment[]) => {
    const rows: unknown[][] = [
      ['Transaction ID', 'Booking', 'Customer', 'Email', 'Amount', 'Currency', 'Status', 'Method', 'Date'],
    ]
    for (const p of list) {
      const x = p as any
      const id = x.id ?? x._id ?? ''
      const txn = x.transaction_id || x.transactionId || `TXN-${String(id).slice(-8)}`
      rows.push([
        txn,
        String(x.booking_id || x.bookingId || ''),
        String(x.customer_name || x.customerName || x.customer?.name || ''),
        String(x.customer_email || x.customerEmail || x.customer?.email || ''),
        x.amount ?? '',
        (x.currency || 'INR').toString(),
        String(x.status || ''),
        getPaymentMethodLabel(x.payment_method || x.paymentMethod || ''),
        formatDate(x.created_at || x.createdAt),
      ])
    }
    return rows
  }

  const exportPaymentsReport = async () => {
    if (!canExport) return
    setExporting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const all: Payment[] = []
      let page = 1
      let totalPages = 1
      const maxPages = 500
      while (page <= totalPages && page <= maxPages) {
        const res = await PaymentsService.getPayments(buildListQuery(page, EXPORT_PAGE_SIZE))
        if (!res.success || !res.data) break
        const data = res.data as any
        const list = data.payments ?? data ?? []
        if (!Array.isArray(list) || list.length === 0) break
        all.push(...list)
        const tp = data.pagination?.totalPages
        totalPages = typeof tp === 'number' && tp >= 1 ? tp : page
        if (page >= totalPages) break
        page += 1
      }
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`payments-export-${stamp}.csv`, buildCsvRows(all))
      setSuccessMessage(
        `Exported ${all.length} payment${all.length !== 1 ? 's' : ''} (all rows matching current tab, search, and date filters).`
      )
    } catch (err: any) {
      setError(err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const paymentColumns: StandardTableColumn<Payment>[] = [
    {
      id: 'transactionId',
      label: 'Transaction ID',
      sortable: true,
      render: (_, p) => {
        const r = p as unknown as Record<string, unknown>
        const txn = r.transaction_id || r.transactionId
        const id = p.id ?? (r._id as string) ?? ''
        const display = (txn as string) || (id ? `TXN-${String(id).slice(-8)}` : '—')
        return <span className="font-mono text-sm font-semibold">{String(display)}</span>
      },
    },
    {
      id: 'bookingId',
      label: 'Booking / Ref',
      render: (_, p) => {
        const r = p as unknown as Record<string, unknown>
        return <span className="text-sm">{(r.booking_id || r.bookingId || r.description || '—') as string}</span>
      },
    },
    {
      id: 'customer',
      label: 'Customer / Payer',
      sortable: true,
      valueGetter: (p) => {
        const r = p as unknown as Record<string, unknown>
        return (r.customer_name || r.customerName || (r.customer as { name?: string })?.name || '') as string
      },
      render: (_, p) => {
        const r = p as unknown as Record<string, unknown>
        const name = (r.customer_name || r.customerName || (r.customer as { name?: string })?.name) as
          | string
          | undefined
        const email = (r.customer_email || r.customerEmail || (r.customer as { email?: string })?.email) as
          | string
          | undefined
        if (!name && !email) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{(name || email || '?').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{name || '—'}</p>
              {email && <p className="text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
        )
      },
    },
    {
      id: 'paymentMethod',
      label: 'Method',
      render: (_, p) => {
        const r = p as unknown as Record<string, unknown>
        const method = (r.payment_method || r.paymentMethod || '') as string
        return (
          <Badge variant="outline" className="gap-1 font-normal">
            {getPaymentMethodIcon(method)}
            {getPaymentMethodLabel(method)}
          </Badge>
        )
      },
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      valueGetter: (p) => p.amount ?? 0,
      render: (_, p) => {
        const amount = p.amount ?? 0
        const r = p as unknown as Record<string, unknown>
        const currency = (r.currency || 'INR') as string
        const fee = r.platform_fee ?? r.platformFee ?? r.fee
        return (
          <div className="text-right">
            <p className="text-sm font-semibold">{formatCurrency(amount, currency)}</p>
            {fee != null && Number(fee) > 0 && (
              <p className="text-xs text-muted-foreground">Fee: {formatCurrency(Number(fee), currency)}</p>
            )}
          </div>
        )
      },
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (_, p) => {
        const r = p as unknown as Record<string, unknown>
        const status = (p.status ?? r.status ?? 'pending') as string
        return (
          <Badge variant="outline" className={cn('gap-1.5 border capitalize', paymentStatusClass(status))}>
            {getStatusIcon(status)}
            {String(status).replace(/_/g, ' ')}
          </Badge>
        )
      },
    },
    {
      id: 'date',
      label: 'Date & Time',
      sortable: true,
      valueGetter: (p) => {
        const r = p as unknown as Record<string, unknown>
        return (r.created_at || r.createdAt || '') as string
      },
      render: (_, p) => {
        const r = p as unknown as Record<string, unknown>
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate((r.created_at || r.createdAt) as string | Date | undefined)}
          </span>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payments & Transactions"
        subtitle="Manage payments, transactions, and refunds"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              title={
                canExport
                  ? 'Downloads all payments matching the current tab, search, and date filters (multiple pages).'
                  : 'You need export permission to download payment reports.'
              }
            >
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => void exportPaymentsReport()}
                disabled={!canExport || exporting || loading}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export report
              </Button>
            </span>
            <Button
              type="button"
              className="gap-1.5"
              onClick={() => void fetchPaymentsData()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      {successMessage && (
        <DismissibleAlert
          variant="success"
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && <DismissibleAlert variant="error" message={error} onDismiss={() => setError(null)} />}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiStatCard
          tone="emerald"
          icon={<IndianRupee className="h-6 w-6" />}
          value={formatCurrency(stats.totalRevenue)}
          label="Total revenue"
          hint={
            stats.totalCount > 0 ? (
              <>
                {stats.totalCount} transaction{stats.totalCount !== 1 ? 's' : ''}
              </>
            ) : null
          }
        />
        <KpiStatCard
          tone="primary"
          icon={<CheckCircle className="h-6 w-6" />}
          value={stats.completedPayments}
          label="Completed"
        />
        <KpiStatCard
          tone="amber"
          icon={<Clock className="h-6 w-6" />}
          value={stats.pendingPayments}
          label="Pending"
        />
        <KpiStatCard
          tone="destructive"
          icon={<XCircle className="h-6 w-6" />}
          value={stats.failedPayments}
          label="Failed"
        />
        <KpiStatCard
          tone="sky"
          icon={<RefreshCw className="h-6 w-6" />}
          value={formatCurrency(stats.refundedAmount)}
          label="Refunded"
          hint={
            stats.refundedCount > 0 ? (
              <>
                {stats.refundedCount} refund{stats.refundedCount !== 1 ? 's' : ''}
              </>
            ) : null
          }
        />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by transaction ID, booking ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'today', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  type="button"
                  size="sm"
                  variant={dateRange === range ? 'default' : 'outline'}
                  onClick={() => setDateRange(range)}
                >
                  {range === 'all' ? 'All time' : range === 'today' ? 'Today' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {PAYMENT_TABS.map((tab, index) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={currentTab === index ? 'default' : 'ghost'}
              className="rounded-md"
              onClick={() => setCurrentTab(index)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <CardContent>
          <StandardTable<Payment>
            columns={paymentColumns}
            data={filteredPayments}
            getRowId={(row) => String(row.id ?? (row as { _id?: string })._id ?? '')}
            loading={loading}
            emptyMessage={
              dateRange !== 'all'
                ? `No payments in this period. Try "All time" or another filter.`
                : 'No payments yet. Transactions will appear here once payments are recorded.'
            }
            showSearch={false}
            sortControlled={false}
            page={pagination.page - 1}
            rowsPerPage={pagination.limit}
            totalCount={pagination.total}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p + 1 }))}
            onRowsPerPageChange={(limit) =>
              setPagination((prev) => ({ ...prev, limit, page: 1 }))
            }
            renderActions={(payment) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Payment actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewDetails(payment)} className="cursor-pointer">
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadReceipt(payment)} className="cursor-pointer">
                    Download receipt
                  </DropdownMenuItem>
                  {canRefund &&
                    ['completed', 'paid'].includes(String(payment?.status ?? '').toLowerCase()) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openRefundDialog(payment)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          Process refund
                        </DropdownMenuItem>
                      </>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            size="small"
            minHeight={360}
          />
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Payment details</DialogTitle>
            </DialogHeader>
            {selectedPayment && (() => {
            const p = selectedPayment as unknown as Record<string, unknown>
            const txnId = (p.transaction_id || p.transactionId || p.id || '—') as string
            const status = (p.status || 'pending') as string
            const bookingRef = (p.booking_id || p.bookingId || p.description || '—') as string
            const amount = Number(p.amount ?? 0)
            const currency = (p.currency || 'INR') as string
            const fee = p.platform_fee ?? p.platformFee ?? p.fee
            const netAmount =
              (p.netAmount as number) ??
              (p.providerAmount as number) ??
              amount - (fee != null ? Number(fee) : 0)
            const method = (p.payment_method || p.paymentMethod || '') as string
            const createdAt = p.created_at || p.createdAt
            const completedAt = p.completedAt || p.updated_at || p.updatedAt
            return (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg bg-primary p-4 text-primary-foreground">
                  <p className="font-mono text-lg font-bold">{String(txnId)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      className="border-0 bg-background capitalize text-primary"
                      variant="secondary"
                    >
                      {String(status).replace(/_/g, ' ')}
                    </Badge>
                    <Badge
                      className="border-0 bg-primary-foreground/20 text-primary-foreground"
                      variant="secondary"
                    >
                      Ref: {String(bookingRef)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Customer / payer</p>
                    <p className="mt-1">
                      {String(
                        p.customer_name ||
                          p.customerName ||
                          (p.customer as { name?: string } | undefined)?.name ||
                          '—',
                      )}
                    </p>
                    {(p.customer_email || p.customerEmail || (p.customer as { email?: string } | undefined)?.email) && (
                      <p className="text-xs text-muted-foreground">
                        {String(
                          p.customer_email ||
                            p.customerEmail ||
                            (p.customer as { email?: string })?.email ||
                            '',
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Method & date</p>
                      <div className="flex items-center gap-1.5">
                        {getPaymentMethodIcon(method)}
                        <span>{getPaymentMethodLabel(String(method))}</span>
                      </div>
                      <p className="text-sm">{formatDate(createdAt as string | Date | undefined)}</p>
                      {completedAt ? (
                        <p className="text-xs text-muted-foreground">
                          Completed: {formatDate(completedAt as string | Date | undefined)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Payment breakdown</p>
                  <div className="mt-2 rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex justify-between">
                      <span>Amount</span>
                      <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                    </div>
                    {fee != null && Number(fee) > 0 && (
                      <div className="mt-2 flex justify-between text-muted-foreground">
                        <span>Platform fee</span>
                        <span>{formatCurrency(Number(fee), currency)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="font-medium">Net amount</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(netAmount, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleDownloadReceipt(selectedPayment)}>
                Download receipt
              </Button>
              {canRefund &&
                selectedPayment &&
                ['completed', 'paid'].includes(String(selectedPayment?.status ?? '').toLowerCase()) && (
                  <Button type="button" variant="destructive" onClick={() => openRefundDialog(selectedPayment)}>
                    Process refund
                  </Button>
                )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={(o) => !o && closeRefundDialog()}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process refund</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Refunds are sent to your payment provider. Enter a reason for your audit trail.
              </p>
              <p>
                Amount:{' '}
                <strong>
                  {formatCurrency(
                    (refundTarget as { amount?: number }).amount,
                    (refundTarget as { currency?: string }).currency || 'INR',
                  )}
                </strong>
              </p>
              <div>
                <Label htmlFor="refund-reason">Reason (required)</Label>
                <Textarea
                  id="refund-reason"
                  className="mt-1.5"
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation, service not completed"
                />
              </div>
              <div>
                <Label htmlFor="refund-partial">Partial amount (optional)</Label>
                <Input
                  id="refund-partial"
                  className="mt-1.5"
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(e.target.value)}
                  placeholder="e.g. 500"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank for a full refund. Must not exceed the original amount.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRefundDialog} disabled={refundSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void submitRefund()}
              disabled={refundSubmitting}
            >
              {refundSubmitting ? 'Processing…' : 'Confirm refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

