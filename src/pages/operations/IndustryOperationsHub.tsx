import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  ShieldCheck,
  Scale,
  Users,
  Wallet,
  ArrowRight,
  Loader2,
  RefreshCw,
  ScanLine,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { BookingsService } from '../../services/api/bookings.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { SupportTicketsService } from '../../services/api/supportTickets.service'
import { usePermissions } from '../../hooks/usePermissions'

type HubStats = {
  bookingByStatus: Record<string, number>
  pendingRefundTickets: number
  professionalsTotal: number
  pendingVerificationPros: number
}

const cards: {
  title: string
  description: string
  href: string
  icon: typeof LayoutDashboard
}[] = [
  {
    title: 'Command center',
    description: 'Live queues: pending, in-flight jobs, payment flags — jump straight to fixes.',
    href: '/operations/command-center',
    icon: Radar,
  },
  {
    title: 'Trust & disputes',
    description: 'Refunds, tickets, booking-level earning disputes — governance in one lane.',
    href: '/operations/trust',
    icon: ShieldCheck,
  },
  {
    title: 'Dispute desk',
    description: 'SLA-tracked cases: parties, evidence URLs, immutable audit trail.',
    href: '/operations/dispute-cases',
    icon: Scale,
  },
  {
    title: 'Supply quality',
    description: 'Ratings, verification, completion signals — tier-ready workforce view.',
    href: '/operations/supply-quality',
    icon: Users,
  },
  {
    title: 'Payouts playbook',
    description: 'How money moves: platform fee, GST posture, links to payouts & ledger.',
    href: '/operations/payouts-playbook',
    icon: Wallet,
  },
]

export function IndustryOperationsHub() {
  const { checkAnyPermission } = usePermissions()
  const canPos = checkAnyPermission(['create_bookings', 'manage_bookings'])
  const canBookings = checkAnyPermission(['view_bookings', 'manage_bookings'])
  const canPros = checkAnyPermission(['view_providers', 'edit_providers', 'approve_providers'])
  const canRefund = checkAnyPermission(['refund_payments', 'create_payments'])
  const canAnalytics = checkAnyPermission(['view_analytics'])
  const canDisputes = checkAnyPermission(['view_bookings', 'manage_bookings', 'edit_bookings'])

  const [stats, setStats] = useState<HubStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const tasks: Promise<void>[] = []

      let bookingByStatus: Record<string, number> = {}
      let pendingRefundTickets = 0
      let professionalsTotal = 0
      let pendingVerificationPros = 0

      if (canBookings) {
        tasks.push(
          (async () => {
            const res = await BookingsService.getBookingStats()
            const raw = (res as { success?: boolean; data?: { byStatus?: Record<string, number> } }).data
            bookingByStatus = raw?.byStatus ?? {}
          })(),
        )
      }

      if (canRefund) {
        tasks.push(
          (async () => {
            try {
              const res = await SupportTicketsService.listRefundQueue({ limit: 100, status: 'pending' })
              const data = res.success && res.data && typeof res.data === 'object' ? res.data : null
              const tickets =
                data && 'tickets' in data ? (data as { tickets: unknown[] }).tickets : []
              pendingRefundTickets = Array.isArray(tickets) ? tickets.length : 0
            } catch {
              pendingRefundTickets = 0
            }
          })(),
        )
      }

      if (canPros) {
        tasks.push(
          (async () => {
            const [allRes, pendRes] = await Promise.all([
              ProfessionalsService.getProfessionals({ page: 1, limit: 1 }),
              ProfessionalsService.getProfessionals({
                page: 1,
                limit: 1,
                verificationStatus: 'pending',
              }),
            ])
            professionalsTotal =
              allRes.success && allRes.data?.pagination?.total != null
                ? allRes.data.pagination.total
                : 0
            pendingVerificationPros =
              pendRes.success && pendRes.data?.pagination?.total != null
                ? pendRes.data.pagination.total
                : 0
          })(),
        )
      }

      await Promise.all(tasks)
      setStats({ bookingByStatus, pendingRefundTickets, professionalsTotal, pendingVerificationPros })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load hub metrics')
      setStats({
        bookingByStatus: {},
        pendingRefundTickets: 0,
        professionalsTotal: 0,
        pendingVerificationPros: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [canBookings, canPros, canRefund])

  useEffect(() => {
    void load()
  }, [load])

  const pendingJobs =
    (stats?.bookingByStatus.pending ?? 0) +
    (stats?.bookingByStatus.confirmed ?? 0) +
    (stats?.bookingByStatus.scheduled ?? 0) +
    (stats?.bookingByStatus.accepted ?? 0)

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Industry operations</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            CEO-grade operational spine: exceptions first, supply health, payouts clarity, and growth
            diagnostics — aligned with how scaled service marketplaces run day-to-day.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          {canAnalytics && (
            <Button type="button" variant="default" size="sm" asChild>
              <Link to="/analytics/funnels">Growth funnels</Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open pipeline (bookings)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {canBookings ? (loading ? '—' : pendingJobs) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pending + confirmed + scheduled + accepted
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In progress</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {canBookings ? (loading ? '—' : (stats?.bookingByStatus.in_progress ?? 0)) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Active field jobs</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Refund queue</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {canRefund ? (loading ? '—' : stats?.pendingRefundTickets ?? 0) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Pending refund tickets</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Supply</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {canPros ? (loading ? '—' : stats?.professionalsTotal ?? 0) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Professionals</span>
            {canPros && !loading && (stats?.pendingVerificationPros ?? 0) > 0 && (
              <Badge variant="secondary">{stats?.pendingVerificationPros} pending KYC</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {canPos ? (
          <Card className="border-primary/35 bg-gradient-to-br from-primary/8 via-background to-background shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-lg">POS — Home services</CardTitle>
              </div>
              <CardDescription>
                Walk-in and phone desk: live catalog, GST-aware ticket, technician assignment — posts through{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">POST /api/bookings/admin</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" size="sm" asChild>
                <Link to="/operations/pos">
                  Open POS <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        {cards.map((c) => {
          const Icon = c.icon
          let allowed = true
          if (c.href.includes('command-center') || c.href.includes('trust')) {
            allowed = canBookings || canRefund
          }
          if (c.href.includes('supply-quality')) allowed = canPros
          if (c.href.includes('payouts-playbook')) {
            allowed = checkAnyPermission(['view_payments', 'create_payments', 'refund_payments'])
          }
          if (c.href.includes('dispute-cases')) allowed = canDisputes

          return (
            <Card key={c.href} className={!allowed ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                </div>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild disabled={!allowed}>
                  <Link to={allowed ? c.href : '#'}>
                    Open <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
