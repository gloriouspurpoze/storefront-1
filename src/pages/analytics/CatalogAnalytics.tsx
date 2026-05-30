/**
 * Catalog Analytics — admin page surfacing per-service / per-product
 * performance over an arbitrary period.
 *
 * Industry pattern (UrbanCompany / Housejoy admin):
 *   - Two ranked tables: top platform services, top products.
 *   - Each row shows volume (requests / orders), revenue, completion rate,
 *     average order value, and a share-of-period bar so the admin can
 *     instantly spot the long tail vs head of the catalog.
 *   - Dropdown switches the period; CSV export ships the current view as-is.
 *   - Industry-grade UI with skeleton loaders, "no data" empty states, and
 *     deep-links to the underlying service / product editor.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RefreshCw,
  Download,
  ChevronDown,
  Star,
  Package,
  Briefcase,
  TrendingUp,
} from 'lucide-react'
import { AnalyticsService } from '../../services/api'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { formatCurrency } from '../../lib/utils'
import { TIME_RANGES } from '../../constants'

type ServiceRow = {
  serviceId: string
  name: string
  slug: string | null
  category: string | null
  image: string | null
  averageRating: number
  reviewCount: number
  requests: number
  completedBookings: number
  completionRate: number
  revenue: number
  completedRevenue: number
  averageOrderValue: number
}

type ProductRow = {
  productId: string
  name: string
  slug: string | null
  brand: string | null
  sku: string | null
  price: number
  image: string | null
  orders: number
  unitsSold: number
  deliveredOrders: number
  revenue: number
  averageOrderValue: number
}

type CatalogAnalyticsData = {
  generatedAt: string
  period: { start: string; end: string }
  totals: {
    bookings: number
    bookingRevenue: number
    orders: number
    orderRevenue: number
  }
  topServices: ServiceRow[]
  topProducts: ProductRow[]
}

const PERIOD_OPTIONS = [
  { value: TIME_RANGES.LAST_7_DAYS, label: 'Last 7 days' },
  { value: TIME_RANGES.LAST_30_DAYS, label: 'Last 30 days' },
  { value: TIME_RANGES.LAST_3_MONTHS, label: 'Last 3 months' },
  { value: TIME_RANGES.LAST_6_MONTHS, label: 'Last 6 months' },
  { value: TIME_RANGES.LAST_YEAR, label: 'Last 12 months' },
] as const

function getDateRangeFromTimeRange(timeRange: string): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  switch (timeRange) {
    case TIME_RANGES.LAST_7_DAYS:
      start.setDate(start.getDate() - 7)
      break
    case TIME_RANGES.LAST_30_DAYS:
      start.setDate(start.getDate() - 30)
      break
    case TIME_RANGES.LAST_3_MONTHS:
      start.setMonth(start.getMonth() - 3)
      break
    case TIME_RANGES.LAST_6_MONTHS:
      start.setMonth(start.getMonth() - 6)
      break
    case TIME_RANGES.LAST_YEAR:
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setDate(start.getDate() - 30)
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

const fmtN = (n: number) => Number(n || 0).toLocaleString('en-IN')

/** Inline progress bar showing this row's share of the period total. */
function SharePill({ value, total, tone = 'sky' }: { value: number; total: number; tone?: 'sky' | 'emerald' }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  const bar = tone === 'emerald' ? 'bg-storm-deep' : 'bg-primary'
  const text = tone === 'emerald' ? 'text-storm-deep' : 'text-primary'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium tabular-nums ${text}`}>{pct}%</span>
    </div>
  )
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (cell: string | number) => {
    const s = String(cell ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function CatalogAnalytics() {
  const [timeRange, setTimeRange] = useState<string>(TIME_RANGES.LAST_30_DAYS)
  const [data, setData] = useState<CatalogAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'services' | 'products'>('services')

  const range = useMemo(() => getDateRangeFromTimeRange(timeRange), [timeRange])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await AnalyticsService.getCatalogAnalytics({
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 50,
      })
      setData((res as { data?: CatalogAnalyticsData }).data ?? (res as unknown as CatalogAnalyticsData))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load catalog analytics'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startDate, range.endDate])

  const totals = data?.totals ?? { bookings: 0, bookingRevenue: 0, orders: 0, orderRevenue: 0 }
  const topServices = data?.topServices ?? []
  const topProducts = data?.topProducts ?? []

  const handleExport = () => {
    if (!data) return
    if (tab === 'services') {
      downloadCsv(
        `top-services-${range.startDate}-to-${range.endDate}.csv`,
        [
          'Service',
          'Category',
          'Requests',
          'Completed bookings',
          'Completion rate %',
          'Revenue',
          'Completed revenue',
          'AOV',
          'Avg rating',
          'Review count',
        ],
        topServices.map((s) => [
          s.name,
          s.category ?? '',
          s.requests,
          s.completedBookings,
          s.completionRate,
          s.revenue,
          s.completedRevenue,
          s.averageOrderValue,
          s.averageRating,
          s.reviewCount,
        ]),
      )
    } else {
      downloadCsv(
        `top-products-${range.startDate}-to-${range.endDate}.csv`,
        [
          'Product',
          'Brand',
          'SKU',
          'Orders',
          'Units sold',
          'Delivered orders',
          'Revenue',
          'AOV',
          'List price',
        ],
        topProducts.map((p) => [
          p.name,
          p.brand ?? '',
          p.sku ?? '',
          p.orders,
          p.unitsSold,
          p.deliveredOrders,
          p.revenue,
          p.averageOrderValue,
          p.price,
        ]),
      )
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalog analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Per-service and per-product performance — bookings, orders, revenue, and
            completion rate from real Booking and Order documents. Use this to identify
            top sellers, low-completion services, and dead inventory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={handleExport}
            disabled={loading || !data}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Service bookings"
          value={fmtN(totals.bookings)}
          sublabel="Distinct bookings with services"
          icon={<Briefcase className="h-4 w-4" />}
          tone="sky"
        />
        <KpiCard
          label="Service revenue"
          value={formatCurrency(totals.bookingRevenue)}
          sublabel="Sum of service line items"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="emerald"
        />
        <KpiCard
          label="Product orders"
          value={fmtN(totals.orders)}
          sublabel="Distinct e-commerce orders"
          icon={<Package className="h-4 w-4" />}
          tone="violet"
        />
        <KpiCard
          label="Product revenue"
          value={formatCurrency(totals.orderRevenue)}
          sublabel="Sum of order totals"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="amber"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'services' | 'products')}>
        <TabsList className="grid w-full grid-cols-2 sm:w-[420px]">
          <TabsTrigger value="services" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Top services ({topServices.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Top products ({topProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── Services tab ─── */}
        <TabsContent value="services" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="min-w-[260px]">Service</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Share of period</TableHead>
                    <TableHead className="text-right">AOV</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={8}>
                          <div className="h-8 animate-pulse rounded bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : topServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                        No service bookings in this period yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topServices.map((s, idx) => (
                      <TableRow key={s.serviceId} className="hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="shrink-0 tabular-nums">
                              #{idx + 1}
                            </Badge>
                            {s.image ? (
                              <img
                                src={s.image}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-md border object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                —
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                to={`/platform-services/edit/${s.serviceId}`}
                                className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                                title={s.name}
                              >
                                {s.name}
                              </Link>
                              {s.category && (
                                <p className="truncate text-xs text-muted-foreground">{s.category}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {fmtN(s.requests)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {fmtN(s.completedBookings)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={s.completionRate >= 70 ? 'default' : 'secondary'}
                            className={
                              s.completionRate >= 70
                                ? 'bg-storm-mist/30 text-storm-deep hover:bg-storm-mist/30'
                                : s.completionRate >= 30
                                  ? 'bg-bloom-rose text-bloom-coral hover:bg-bloom-rose'
                                  : 'bg-destructive/10 text-destructive hover:bg-destructive/10'
                            }
                          >
                            {s.completionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {formatCurrency(s.revenue)}
                        </TableCell>
                        <TableCell>
                          <SharePill value={s.revenue} total={totals.bookingRevenue} />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatCurrency(s.averageOrderValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.averageRating > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-sm">
                              <Star className="h-3.5 w-3.5 fill-bloom-coral text-bloom-coral" />
                              {s.averageRating.toFixed(1)}
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({fmtN(s.reviewCount)})
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Products tab ─── */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="min-w-[260px]">Product</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Units sold</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Share of period</TableHead>
                    <TableHead className="text-right">AOV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <div className="h-8 animate-pulse rounded bg-muted" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No product orders in this period yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((p, idx) => (
                      <TableRow key={p.productId} className="hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="shrink-0 tabular-nums">
                              #{idx + 1}
                            </Badge>
                            {p.image ? (
                              <img
                                src={p.image}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-md border object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                                —
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                to={`/products/edit/${p.productId}`}
                                className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                                title={p.name}
                              >
                                {p.name}
                              </Link>
                              <p className="truncate text-xs text-muted-foreground">
                                {p.brand ?? '—'}
                                {p.sku ? ` · SKU: ${p.sku}` : ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {fmtN(p.orders)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {fmtN(p.unitsSold)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {fmtN(p.deliveredOrders)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {formatCurrency(p.revenue)}
                        </TableCell>
                        <TableCell>
                          <SharePill value={p.revenue} total={totals.orderRevenue} tone="emerald" />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatCurrency(p.averageOrderValue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {data?.generatedAt && (
        <p className="text-xs text-muted-foreground">
          Last refreshed {new Date(data.generatedAt).toLocaleString('en-IN')} ·
          Period {range.startDate} → {range.endDate}
        </p>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sublabel,
  icon,
  tone,
}: {
  label: string
  value: string
  sublabel: string
  icon: React.ReactNode
  tone: 'sky' | 'emerald' | 'violet' | 'amber'
}) {
  const TONE: Record<string, string> = {
    sky: 'from-primary to-primary',
    emerald: 'from-storm-deep to-storm-deep',
    violet: 'from-primary-deep to-primary-deep',
    amber: 'from-bloom-coral to-bloom-coral',
  }
  return (
    <Card className={`overflow-hidden rounded-xl border-0 bg-gradient-to-br text-white ${TONE[tone]}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs opacity-90">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-0.5 text-[11px] opacity-90">{sublabel}</p>
      </CardContent>
    </Card>
  )
}

export default CatalogAnalytics
