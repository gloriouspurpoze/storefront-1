import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { PaymentsService } from '../../services/api/payments.service'
import { usePermissions } from '../../hooks/usePermissions'
import type { Payment } from '../../types'
import { downloadCsv, openPrintableHtml } from '../../lib/exportUtils'

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
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionPayment, setActionPayment] = useState<Payment | null>(null)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'paid':
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'refunded':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon fontSize="small" />
      case 'paid':
      case 'completed':
        return <CheckIcon fontSize="small" />
      case 'failed':
      case 'refunded':
        return <CancelIcon fontSize="small" />
      default:
        return <ReceiptIcon fontSize="small" />
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (String(method || '').toLowerCase()) {
      case 'card':
        return <CreditCardIcon fontSize="small" />
      case 'bank':
      case 'netbanking':
        return <BankIcon fontSize="small" />
      case 'wallet':
      case 'cash':
      case 'upi':
        return <MoneyIcon fontSize="small" />
      default:
        return <MoneyIcon fontSize="small" />
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

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    setActionMenuAnchor(event.currentTarget)
    setActionPayment(payment)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
    setActionPayment(null)
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailsOpen(true)
    handleActionMenuClose()
  }

  const openRefundDialog = (payment: Payment) => {
    if (!canRefund) return
    setRefundTarget(payment)
    setRefundReason('')
    setRefundAmountInput('')
    setRefundDialogOpen(true)
    setDetailsOpen(false)
    setError(null)
    handleActionMenuClose()
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
    const p = (payment ?? actionPayment ?? selectedPayment) as any
    if (!p) return
    const id = p.id ?? p._id ?? ''
    const txn = p.transaction_id || p.transactionId || `TXN-${String(id).slice(-8)}`
    const amt = p.amount ?? 0
    const cur = (p.currency || 'INR').toUpperCase()
    const status = p.status ?? '—'
    const method = getPaymentMethodLabel(p.payment_method || p.paymentMethod || '')
    const when = formatDate(p.created_at || p.createdAt)
    const cust = p.customer_name || p.customerName || p.customer?.name || '—'
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
    handleActionMenuClose()
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
        const txn = (p as any).transaction_id || p.transactionId || (p as any).transactionId
        const id = p.id ?? (p as any)._id ?? ''
        const display = txn || (id ? `TXN-${String(id).slice(-8)}` : '—')
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            {display}
          </Typography>
        )
      },
    },
    {
      id: 'bookingId',
      label: 'Booking / Ref',
      render: (_, p) => (
        <Typography variant="body2">
          {(p as any).booking_id || p.bookingId || (p as any).description || '—'}
        </Typography>
      ),
    },
    {
      id: 'customer',
      label: 'Customer / Payer',
      sortable: true,
      valueGetter: (p) =>
        (p as any).customer_name || p.customerName || (p as any).customer?.name || '',
      render: (_, p) => {
        const name = (p as any).customer_name || p.customerName || (p as any).customer?.name
        const email = (p as any).customer_email || p.customerEmail || (p as any).customer?.email
        if (!name && !email) return <Typography variant="body2" color="text.secondary">—</Typography>
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {(name || email || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {name || '—'}
              </Typography>
              {email && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {email}
                </Typography>
              )}
            </Box>
          </Box>
        )
      },
    },
    {
      id: 'paymentMethod',
      label: 'Method',
      render: (_, p) => {
        const method = (p as any).payment_method || p.paymentMethod || ''
        return (
          <Chip
            icon={getPaymentMethodIcon(method)}
            label={getPaymentMethodLabel(method)}
            size="small"
            variant="outlined"
          />
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
        const currency = (p as any).currency || 'INR'
        const fee = (p as any).platform_fee ?? p.platformFee ?? p.fee
        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(amount, currency)}
            </Typography>
            {fee != null && Number(fee) > 0 && (
              <Typography variant="caption" color="text.secondary">
                Fee: {formatCurrency(Number(fee), currency)}
              </Typography>
            )}
          </Box>
        )
      },
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (_, p) => {
        const status = p.status ?? (p as any).status ?? 'pending'
        return (
          <Chip
            label={String(status).replace(/_/g, ' ')}
            color={getStatusColor(status) as any}
            size="small"
            icon={getStatusIcon(status)}
            sx={{ textTransform: 'capitalize' }}
          />
        )
      },
    },
    {
      id: 'date',
      label: 'Date & Time',
      sortable: true,
      valueGetter: (p) => (p as any).created_at || p.createdAt || '',
      render: (_, p) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate((p as any).created_at || p.createdAt)}
        </Typography>
      ),
    },
  ]

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title="Payments & Transactions"
        subtitle="Manage payments, transactions, and refunds"
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip
              title={
                canExport
                  ? 'Downloads all payments matching the current tab, search, and date filters (multiple pages).'
                  : 'You need export permission to download payment reports.'
              }
            >
              <span>
                <Button
                  variant="outlined"
                  startIcon={exporting ? <CircularProgress size={18} /> : <DownloadIcon />}
                  sx={{ borderRadius: 2 }}
                  onClick={() => void exportPaymentsReport()}
                  disabled={!canExport || exporting || loading}
                >
                  Export report
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2 }}
              onClick={() => void fetchPaymentsData()}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards — industry-standard KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MoneyIcon sx={{ color: 'success.main' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              {stats.totalCount > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {stats.totalCount} transaction{stats.totalCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon sx={{ color: 'primary.main' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.completedPayments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PendingIcon sx={{ color: 'warning.main' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.pendingPayments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CancelIcon sx={{ color: 'error.main' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.failedPayments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshIcon sx={{ color: 'info.main' }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {formatCurrency(stats.refundedAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Refunded
              </Typography>
              {stats.refundedCount > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {stats.refundedCount} refund{stats.refundedCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by transaction ID, booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 260 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {(['all', 'today', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  size="small"
                  variant={dateRange === range ? 'contained' : 'outlined'}
                  onClick={() => setDateRange(range)}
                  sx={{ borderRadius: 1.5 }}
                >
                  {range === 'all' ? 'All time' : range === 'today' ? 'Today' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
                </Button>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {PAYMENT_TABS.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        <CardContent>
          <StandardTable<Payment>
            columns={paymentColumns}
            data={filteredPayments}
            getRowId={(row) => String(row.id ?? (row as any)._id ?? '')}
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
              <IconButton
                size="small"
                onClick={(e) => handleActionMenuOpen(e, payment)}
              >
                <MoreIcon />
              </IconButton>
            )}
            size="small"
            minHeight={360}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => actionPayment && handleViewDetails(actionPayment)}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => actionPayment && handleDownloadReceipt(actionPayment)}>
          Download Receipt
        </MenuItem>
        {canRefund &&
          ['completed', 'paid'].includes(String(actionPayment?.status ?? '').toLowerCase()) && (
          <>
            <Divider />
            <MenuItem
              onClick={() => actionPayment && openRefundDialog(actionPayment)}
              sx={{ color: 'error.main' }}
            >
              Process refund
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Payment Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Payment Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (() => {
            const p = selectedPayment as any
            const txnId = p.transaction_id || p.transactionId || p.id || '—'
            const status = p.status || 'pending'
            const bookingRef = p.booking_id || p.bookingId || p.description || '—'
            const amount = p.amount ?? 0
            const currency = p.currency || 'INR'
            const fee = p.platform_fee ?? p.platformFee ?? p.fee
            const netAmount = p.netAmount ?? p.providerAmount ?? amount - (fee ?? 0)
            const method = p.payment_method || p.paymentMethod || ''
            const createdAt = p.created_at || p.createdAt
            const completedAt = p.completedAt || p.updated_at || p.updatedAt
            return (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontFamily: 'monospace' }}>
                      {txnId}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={String(status).replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          bgcolor: 'white',
                          color: 'primary.main',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                      <Chip
                        label={`Ref: ${bookingRef}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer / Payer
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {p.customer_name || p.customerName || p.customer?.name || '—'}
                    </Typography>
                    {(p.customer_email || p.customerEmail || p.customer?.email) && (
                      <Typography variant="caption" color="text.secondary">
                        {p.customer_email || p.customerEmail || p.customer?.email}
                      </Typography>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment method & date
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPaymentMethodIcon(method)}
                      <Typography variant="body2">{getPaymentMethodLabel(method)}</Typography>
                    </Box>
                    <Typography variant="body2">{formatDate(createdAt)}</Typography>
                    {completedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Completed: {formatDate(completedAt)}
                      </Typography>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment breakdown
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Amount</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(amount, currency)}
                        </Typography>
                      </Box>
                      {fee != null && Number(fee) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Platform fee</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(Number(fee), currency)}
                          </Typography>
                        </Box>
                      )}
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Net amount</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {formatCurrency(netAmount, currency)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            )
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="outlined" onClick={() => handleDownloadReceipt(selectedPayment)}>
            Download Receipt
          </Button>
          {canRefund &&
            ['completed', 'paid'].includes(String(selectedPayment?.status ?? '').toLowerCase()) && (
            <Button
              variant="contained"
              color="error"
              onClick={() => selectedPayment && openRefundDialog(selectedPayment)}
            >
              Process refund
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={refundDialogOpen} onClose={closeRefundDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Process refund</DialogTitle>
        <DialogContent dividers>
          {refundTarget && (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Refunds are sent to your payment provider. Enter a reason for your audit trail.
              </Typography>
              <Typography variant="body2">
                Amount:{' '}
                <strong>
                  {formatCurrency(
                    (refundTarget as any).amount,
                    (refundTarget as any).currency || 'INR'
                  )}
                </strong>
              </Typography>
              <TextField
                label="Reason (required)"
                required
                multiline
                minRows={2}
                fullWidth
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation, service not completed"
              />
              <TextField
                label="Partial amount (optional)"
                fullWidth
                helperText="Leave blank for a full refund. Must not exceed the original amount."
                value={refundAmountInput}
                onChange={(e) => setRefundAmountInput(e.target.value)}
                placeholder="e.g. 500"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRefundDialog} disabled={refundSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void submitRefund()}
            disabled={refundSubmitting}
          >
            {refundSubmitting ? 'Processing…' : 'Confirm refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

