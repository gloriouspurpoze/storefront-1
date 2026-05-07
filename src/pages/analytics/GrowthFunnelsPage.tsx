import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { AnalyticsService } from '../../services/api/analytics.service'

function pct(num: number, den: number): string {
  if (!den || den <= 0) return '—'
  return `${Math.round((num / den) * 1000) / 10}%`
}

export function GrowthFunnelsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usersNew, setUsersNew] = useState(0)
  const [usersTotal, setUsersTotal] = useState(0)
  const [bookNew, setBookNew] = useState(0)
  const [bookDone, setBookDone] = useState(0)
  const [bookTotal, setBookTotal] = useState(0)

  const range = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [u, b] = await Promise.all([
        AnalyticsService.getUserAnalytics(range),
        AnalyticsService.getBookingAnalytics(range),
      ])
      const ud = u.success ? u.data : null
      const bd = b.success ? b.data : null
      setUsersNew(ud?.newUsers ?? 0)
      setUsersTotal(ud?.totalUsers ?? 0)
      setBookNew(bd?.newBookings ?? 0)
      setBookDone(bd?.completedBookings ?? 0)
      setBookTotal(bd?.totalBookings ?? 0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load funnel metrics')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    void load()
  }, [load])

  const activation = pct(bookNew, usersNew || usersTotal || 1)

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Growth funnels</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Last 30 days snapshot from analytics APIs — demand creation vs completion. Pair with CRM for
            top-of-funnel and bookings list for leakage diagnosis.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Range: {range.startDate} → {range.endDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button type="button" variant="default" size="sm" asChild>
            <Link to="/analytics">
              Full analytics <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registered users (total)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{loading ? '—' : usersTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New users (30d)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{loading ? '—' : usersNew}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New bookings (30d)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{loading ? '—' : bookNew}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed bookings (30d)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{loading ? '—' : bookDone}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversion ladder</CardTitle>
          <CardDescription>Coarse funnel — refine with cohort IDs when product analytics ships.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-md border px-3 py-2 font-medium">Audience</span>
            <span className="text-muted-foreground">→</span>
            <span className="rounded-md border px-3 py-2">
              Demand ({bookNew} new bookings / {bookTotal} all-time in API scope)
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
              Fulfillment ({bookDone} completed)
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Heuristic activation ({bookNew} bookings vs {usersNew || '—'} new users):{' '}
            <strong className="text-foreground">{activation}</strong>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/bookings">Bookings</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/crm/leads">CRM leads</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/operations">Industry operations</Link>
        </Button>
      </div>
    </div>
  )
}
