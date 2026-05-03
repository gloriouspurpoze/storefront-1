import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  LineChart,
  Package,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { cn, formatCurrency } from '../../lib/utils'
import dashboardService from '../../services/api/dashboard.service'

type Shortcut = {
  to: string
  title: string
  description: string
  icon: React.ReactNode
}

const SHORTCUTS: Shortcut[] = [
  {
    to: '/analytics',
    title: 'Analytics',
    description: 'Trends, charts, and KPIs when your backend exposes analytics endpoints.',
    icon: <LineChart className="h-5 w-5" aria-hidden />,
  },
  {
    to: '/orders',
    title: 'Orders',
    description: 'Filter and export order data from the operational ledger.',
    icon: <ClipboardList className="h-5 w-5" aria-hidden />,
  },
  {
    to: '/payments',
    title: 'Payments & invoices',
    description: 'Reconciliation-friendly views for finance.',
    icon: <Wallet className="h-5 w-5" aria-hidden />,
  },
  {
    to: '/users',
    title: 'Users',
    description: 'User lifecycle reports and admin actions.',
    icon: <Users className="h-5 w-5" aria-hidden />,
  },
  {
    to: '/products',
    title: 'Products',
    description: 'Catalog performance tied to commerce metrics.',
    icon: <Package className="h-5 w-5" aria-hidden />,
  },
]

export function Reports() {
  const [loading, setLoading] = useState(true)
  const [dashError, setDashError] = useState<string | null>(null)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [orders, setOrders] = useState<number | null>(null)
  const [providers, setProviders] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(null)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    setDashError(null)
    try {
      const data = await dashboardService.getAdminDashboard()
      const s = data.stats
      setRevenue(s.totalRevenue)
      setOrders(s.totalOrders)
      setProviders(s.activeProviders)
      setRating(s.averageRating)
    } catch (e: unknown) {
      setDashError(e instanceof Error ? e.message : 'Could not load dashboard snapshot')
      setRevenue(null)
      setOrders(null)
      setProviders(null)
      setRating(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  return (
    <div className="min-h-0 flex-1 space-y-8">
      <PageHeader
        title="Reports & data"
        subtitle="Industry pattern: use dedicated analytics for charts, and module screens for CSV/PDF exports. Below is a live snapshot from your dashboard API when available."
        icon={<BarChart3 className="h-8 w-8 shrink-0" aria-hidden />}
        action={
          <Button variant="outline" size="sm" onClick={() => void loadSnapshot()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} aria-hidden />
            Refresh snapshot
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue (summary)"
          value={revenue != null ? formatCurrency(revenue) : '—'}
          loading={loading}
          hint="From /dashboard/admin"
        />
        <MetricCard
          label="Orders"
          value={orders != null ? String(orders) : '—'}
          loading={loading}
          hint="Total in dashboard payload"
        />
        <MetricCard
          label="Active providers"
          value={providers != null ? String(providers) : '—'}
          loading={loading}
          hint="Mapped from backend summary"
        />
        <MetricCard
          label="Avg. rating"
          value={rating != null ? rating.toFixed(1) : '—'}
          loading={loading}
          hint="When provided by API"
        />
      </div>

      {dashError && (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Snapshot unavailable: {dashError}. Open Analytics or individual modules — tables often include export
              actions when the backend supports them.
            </p>
            <Button variant="outline" size="sm" className="shrink-0 border-amber-800/30" asChild>
              <Link to="/analytics">
                Open analytics <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base">Where to get exports</CardTitle>
            <CardDescription>
              We keep this hub lightweight: reporting UX stays next to the domain data (orders, payouts, users) so
              filters match what finance and ops expect.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className={cn(
                  'group flex gap-3 rounded-lg border bg-card p-4 transition-colors',
                  'hover:border-primary/40 hover:bg-accent/40',
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {s.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 font-medium">
                    {s.title}
                    <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">Scheduled &amp; bulk reports</CardTitle>
            <CardDescription>
              When your backend adds report jobs (e.g. POST /reports/generate), this card becomes the status surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <p className="text-sm font-medium text-foreground">No report queue connected</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ship a reports API or connect a BI tool (Metabase, Looker, etc.). Until then, use module exports and the
                analytics page.
              </p>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-normal">
                CSV / Excel
              </Badge>
              <Badge variant="outline" className="font-normal">
                PDF statements
              </Badge>
              <Badge variant="outline" className="font-normal">
                Webhooks → warehouse
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  loading,
  hint,
}: {
  label: string
  value: string
  loading: boolean
  hint: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {loading ? <span className="text-muted-foreground">…</span> : value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

export default Reports
