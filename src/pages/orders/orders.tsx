import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  HStack,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '../../components/ui'
import {
  Search,
  RefreshCw,
  Eye,
  Download,
  ShoppingCart,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Truck,
} from 'lucide-react'
import { carrierLabel, resolveTrackingUrl } from '../../lib/carrierTracking'
import {
  OrdersService,
  type Order,
  type OrderStatsResponse,
  type OrderStatus,
  type PaymentStatus,
  type OrdersQuery,
} from '../../services/api/orders.service'
import { formatCurrency, formatDate, getInitials, cn } from '../../lib/utils'
import { getOrderDeliveryWhen } from '../../lib/deliveryNotes'
import { PageHeader } from '../../components/common/PageHeader'
import { OrderDetailDrawer } from './OrderDetailDrawer'
import { BulkShipDialog } from './BulkShipDialog'
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

type OrdersListView = 'all' | 'delivery_queue' | 'delivered_today'

const fulfillmentBadgeVariant: Record<
  OrderStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  pending: 'warning',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'secondary',
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

function paymentBadgeVariant(
  s: PaymentStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (s === 'paid') return 'success'
  if (s === 'failed' || s === 'refunded') return 'destructive'
  return 'outline'
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

  const [listView, setListView] = useState<OrdersListView>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // Deep-link from admin alerts / notifications: /orders?id=<mongoId>
  useEffect(() => {
    const id = searchParams.get('id')?.trim()
    if (!id) return
    setSelectedOrderId(id)
    setDrawerOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('id')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

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

      if (listView === 'delivery_queue') {
        query.fulfillmentQueue = true
      } else if (listView === 'delivered_today') {
        query.deliveredToday = true
      } else if (statusFilter !== 'all') {
        query.status = statusFilter as OrderStatus
      }
      if (paymentFilter !== 'all') query.paymentStatus = paymentFilter as PaymentStatus
      if (debouncedSearch) query.search = debouncedSearch
      if (listView === 'all') {
        if (startDate) query.startDate = startDate
        if (endDate) query.endDate = endDate
      }

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
  }, [page, rowsPerPage, listView, statusFilter, paymentFilter, debouncedSearch, startDate, endDate])

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
        'Delivery time',
        'Payment',
        'Carrier',
        'Tracking',
        'Items',
        'Total (INR)',
      ],
      ...orders.map((o) => [
        o.orderNumber,
        o.createdAt,
        o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : o.userId,
        o.customer?.email || '',
        o.status,
        getOrderDeliveryWhen(o) || '',
        o.paymentStatus,
        carrierLabel(o.carrier),
        o.trackingNumber || '',
        String(o.items?.length ?? 0),
        String(o.totalAmount),
      ]),
    ]
    downloadCsv(`orders-export-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    appToast('CSV downloaded', 'success')
  }

  const clearFilters = () => {
    setListView('all')
    setStatusFilter('all')
    setPaymentFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchInput('')
    setPage(0)
  }

  const applyListView = (view: OrdersListView) => {
    setListView(view)
    setPage(0)
    if (view === 'all') {
      setStatusFilter('all')
      setStartDate('')
      setEndDate('')
    } else if (view === 'delivery_queue') {
      setStatusFilter('all')
      setStartDate('')
      setEndDate('')
    } else if (view === 'delivered_today') {
      setStatusFilter('delivered')
      setStartDate('')
      setEndDate('')
    }
  }

  const copyTracking = (e: React.MouseEvent, tracking: string) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(tracking).then(() => {
      appToast('Tracking copied', 'success')
    })
  }

  const byStatus = stats?.byStatus
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage) || 1)

  const processingOnPage = orders.filter((o) => o.status === 'processing')
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllProcessing = () => {
    const ids = processingOnPage.map((o) => o.id)
    if (ids.every((id) => selectedIds.has(id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...ids]))
    }
  }

  const selectedOrders = orders.filter((o) => selectedIds.has(o.id))

  return (
    <div className="min-w-0 flex-1">
      <PageHeader
        title="Orders"
        subtitle="E‑commerce fulfillment — delivery queue, carrier tracking, and payment reconciliation."
        action={
          <HStack spacing={2} className="flex-wrap">
            <Button type="button" variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline" onClick={exportCsv} disabled={!orders.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {canEdit && selectedIds.size > 0 ? (
              <Button type="button" onClick={() => setBulkOpen(true)}>
                <Truck className="mr-2 h-4 w-4" />
                Bulk ship ({selectedIds.size})
              </Button>
            ) : null}
          </HStack>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {[
          { label: 'All orders', value: statsLoading ? '—' : (stats?.totalOrders ?? '—') },
          { label: 'Paid revenue', value: statsLoading ? '—' : formatCurrency(stats?.totalRevenue ?? 0) },
          { label: 'AOV (paid)', value: statsLoading ? '—' : formatCurrency(stats?.averageOrderValue ?? 0) },
          {
            label: 'Pending / processing',
            value: statsLoading
              ? '—'
              : (byStatus?.pending ?? 0) + (byStatus?.confirmed ?? 0) + (byStatus?.processing ?? 0),
          },
          { label: 'Shipped', value: statsLoading ? '—' : (byStatus?.shipped ?? '—') },
          { label: 'Delivered', value: statsLoading ? '—' : (byStatus?.delivered ?? '—') },
        ].map(({ label, value }) => (
          <Card key={label} className="border-border">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'all' as const, label: 'All orders' },
            { id: 'delivery_queue' as const, label: 'Delivery queue' },
            { id: 'delivered_today' as const, label: 'Delivered today' },
          ] as const
        ).map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={listView === id ? 'default' : 'outline'}
            onClick={() => applyListView(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search order #, email, phone, name, or Mongo id…"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fulfillment</label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setListView('all')
                  setStatusFilter(v)
                  setPage(0)
                }}
                disabled={listView === 'delivery_queue' || listView === 'delivered_today'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All statuses' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment</label>
              <Select
                value={paymentFilter}
                onValueChange={(v) => {
                  setPaymentFilter(v)
                  setPage(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === 'all' ? 'All payments' : p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <Input
                type="date"
                value={startDate}
                disabled={listView !== 'all'}
                onChange={(e) => {
                  setListView('all')
                  setStartDate(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <Input
                type="date"
                value={endDate}
                disabled={listView !== 'all'}
                onChange={(e) => {
                  setListView('all')
                  setEndDate(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="md:col-span-12">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Card className="border-border">
        <div className="max-h-[min(70vh,640px)] overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                {canEdit ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        processingOnPage.length > 0 &&
                        processingOnPage.every((o) => selectedIds.has(o.id))
                      }
                      onCheckedChange={() => toggleSelectAllProcessing()}
                      aria-label="Select all processing on page"
                    />
                  </TableHead>
                ) : null}
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Delivery time</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 10 : 9} className="py-12 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 10 : 9} className="py-16 text-center">
                    <ShoppingCart className="mx-auto mb-2 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No orders match your filters.</p>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                orders.map((order) => {
                  const deliveryWhen = getOrderDeliveryWhen(order)
                  return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => openDrawer(order.id)}
                  >
                    {canEdit ? (
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        {order.status === 'processing' ? (
                          <Checkbox
                            checked={selectedIds.has(order.id)}
                            onCheckedChange={() => toggleSelect(order.id)}
                            aria-label={`Select ${order.orderNumber}`}
                          />
                        ) : null}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <HStack spacing={3} className="items-center">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold',
                          )}
                        >
                          {order.customer
                            ? getInitials(`${order.customer.firstName} ${order.customer.lastName}`)
                            : '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm">
                            {order.customer
                              ? `${order.customer.firstName} ${order.customer.lastName}`
                              : order.userId
                                ? String(order.userId).slice(-6)
                                : '—'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {order.customer?.email || order.customer?.phone || '—'}
                          </p>
                        </div>
                      </HStack>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{order.items?.length ?? 0}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentBadgeVariant(order.paymentStatus)} className="capitalize">
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={fulfillmentBadgeVariant[order.status]}
                        className={cn(
                          'capitalize',
                          order.status !== 'delivered' && 'border border-current bg-transparent',
                        )}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deliveryWhen ? (
                        <p className="max-w-[160px] text-xs leading-snug text-foreground">{deliveryWhen}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {order.trackingNumber ? (
                        <HStack spacing={1} className="items-center">
                          <span className="max-w-[120px] truncate font-mono text-xs" title={order.trackingNumber}>
                            {order.trackingNumber}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            aria-label="Copy tracking"
                            onClick={(e) => copyTracking(e, order.trackingNumber!)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </HStack>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDrawer(order.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => {
                setRowsPerPage(parseInt(v, 10))
                setPage(0)
              }}
            >
              <SelectTrigger className="h-9 w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {total === 0 ? 0 : page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1 || total === 0}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <BulkShipDialog
        open={bulkOpen}
        orders={selectedOrders}
        onClose={() => setBulkOpen(false)}
        onDone={() => {
          setSelectedIds(new Set())
          void fetchOrders()
          void fetchStats()
        }}
      />

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
    </div>
  )
}
