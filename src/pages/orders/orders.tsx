import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import {
  OrdersService,
  type Order,
  type OrderStatsResponse,
  type OrderStatus,
  type PaymentStatus,
  type OrdersQuery,
} from '../../services/api/orders.service'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { PageHeader } from '../../components/common/PageHeader'
import { OrderDetailDrawer } from './OrderDetailDrawer'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'

const STATUS_OPTIONS: Array<OrderStatus | 'all'> = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

const PAYMENT_OPTIONS: Array<PaymentStatus | 'all'> = ['all', 'pending', 'paid', 'failed', 'refunded']

const fulfillmentColor: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default',
}

function csvEscape(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: string[][]) {
  const blob = new Blob([rows.map((r) => r.map(csvEscape).join(',')).join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Orders() {
  const { checkPermission } = usePermissions()
  const canEdit = checkPermission('edit_orders')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<OrderStatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [total, setTotal] = useState(0)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 450)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await OrdersService.getOrderStats()
      if (res.success && res.data) setStats(res.data)
      else setStats(null)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query: OrdersQuery = {
        page: page + 1,
        limit: rowsPerPage,
      }

      if (statusFilter !== 'all') query.status = statusFilter as OrderStatus
      if (paymentFilter !== 'all') query.paymentStatus = paymentFilter as PaymentStatus
      if (debouncedSearch) query.search = debouncedSearch
      if (startDate) query.startDate = startDate
      if (endDate) query.endDate = endDate

      const response = await OrdersService.getOrders(query)

      if (response.success && response.data) {
        setOrders(response.data.orders || [])
        setTotal(response.data.pagination?.total ?? 0)
      } else {
        const err =
          typeof response.error === 'string'
            ? response.error
            : (response.error as { message?: string })?.message
        throw new Error(err || 'Failed to fetch orders')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders'
      setError(msg)
      setOrders([])
      appToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, statusFilter, paymentFilter, debouncedSearch, startDate, endDate])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const handleRefresh = () => {
    void fetchStats()
    void fetchOrders()
  }

  const openDrawer = (id: string) => {
    setSelectedOrderId(id)
    setDrawerOpen(true)
  }

  const exportCsv = () => {
    if (!orders.length) {
      appToast('No rows to export', 'warning')
      return
    }
    const rows: string[][] = [
      [
        'Order number',
        'Created',
        'Customer',
        'Email',
        'Fulfillment',
        'Payment',
        'Items',
        'Total (INR)',
      ],
      ...orders.map((o) => [
        o.orderNumber,
        o.createdAt,
        o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : o.userId,
        o.customer?.email || '',
        o.status,
        o.paymentStatus,
        String(o.items?.length ?? 0),
        String(o.totalAmount),
      ]),
    ]
    downloadCsv(`orders-export-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    appToast('CSV downloaded', 'success')
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setPaymentFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchInput('')
    setPage(0)
  }

  const byStatus = stats?.byStatus

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader
        title="Orders"
        subtitle="E‑commerce fulfillment queue — search customers, update shipment steps, and reconcile payments."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!orders.length}>
              Export CSV
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                All orders
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {statsLoading ? '—' : stats?.totalOrders ?? '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Paid revenue
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {statsLoading ? '—' : formatCurrency(stats?.totalRevenue ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                AOV (paid)
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {statsLoading ? '—' : formatCurrency(stats?.averageOrderValue ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Pending / processing
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {statsLoading
                  ? '—'
                  : (byStatus?.pending ?? 0) + (byStatus?.confirmed ?? 0) + (byStatus?.processing ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Shipped
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {statsLoading ? '—' : byStatus?.shipped ?? '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Delivered
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {statsLoading ? '—' : byStatus?.delivered ?? '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search order #, email, phone, name, or Mongo id…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(0)
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Fulfillment</InputLabel>
                <Select
                  label="Fulfillment"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(0)
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment</InputLabel>
                <Select
                  label="Payment"
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value)
                    setPage(0)
                  }}
                >
                  {PAYMENT_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p === 'all' ? 'All payments' : p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="From"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(0)
                }}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="To"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(0)
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button size="small" onClick={clearFilters}>
                Clear filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined">
        <TableContainer sx={{ maxHeight: 'min(70vh, 640px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Fulfillment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <ShoppingCartOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">No orders match your filters.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                orders.map((order) => (
                  <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDrawer(order.id)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            typography: 'caption',
                            fontWeight: 700,
                          }}
                        >
                          {order.customer
                            ? getInitials(`${order.customer.firstName} ${order.customer.lastName}`)
                            : '?'}
                        </Box>
                        <Box>
                          <Typography variant="body2">
                            {order.customer
                              ? `${order.customer.firstName} ${order.customer.lastName}`
                              : order.userId.slice(-6)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customer?.email || order.customer?.phone || '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{order.items?.length ?? 0}</TableCell>
                    <TableCell align="right">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={order.paymentStatus} sx={{ textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={order.status}
                        color={fulfillmentColor[order.status]}
                        variant={order.status === 'delivered' ? 'filled' : 'outlined'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View details">
                        <IconButton size="small" onClick={() => openDrawer(order.id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 25, 50, 100]}
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Card>

      <OrderDetailDrawer
        open={drawerOpen}
        orderId={selectedOrderId}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedOrderId(null)
        }}
        onUpdated={() => {
          void fetchOrders()
          void fetchStats()
        }}
        canEdit={canEdit}
      />
    </Box>
  )
}
