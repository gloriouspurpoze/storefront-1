import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { AlertTriangle, TrendingUp, Wallet, Receipt, Lock, CalendarClock, Scale, Percent } from 'lucide-react'
import { FinanceService } from '../../services/api/finance.service'
import type { FinanceOverview, FinancePnl } from '../../types/finance.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { KpiStatCard } from '../../components/common'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function pctVsPrior(cur: number, prev: number): string {
  if (prev === 0) return cur === 0 ? 'in line with prior (0)' : 'prior month was 0 — n/a'
  const d = ((cur - prev) / prev) * 100
  return `${d >= 0 ? '+' : ''}${d.toFixed(1)}% vs prior month in chart`
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 55% 40%)',
  'hsl(217 91% 60%)',
  'hsl(280 65% 55%)',
  'hsl(25 90% 55%)',
  'hsl(340 75% 52%)',
  'hsl(190 70% 42%)',
  'hsl(45 93% 47%)',
  'hsl(var(--muted-foreground) / 0.55)',
]

export function FinanceOverviewPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [pnl, setPnl] = useState<FinancePnl | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lockDate, setLockDate] = useState('')
  const [savingLock, setSavingLock] = useState(false)

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const from = startOfMonth(new Date())
      const to = new Date()
      const [o, p] = await Promise.all([
        FinanceService.getOverview(10),
        FinanceService.getPnl(from.toISOString(), to.toISOString()),
      ])
      setOverview(o.data)
      setPnl(p.data)
      const locked = o.data.settings?.lockedExpenseThrough
      if (locked) {
        setLockDate(locked.slice(0, 10))
      } else {
        setLockDate('')
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load finance overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const seriesPair = useMemo(() => {
    const s = overview?.series ?? []
    if (s.length < 2) return null
    return { prev: s[s.length - 2] }
  }, [overview])

  const chartData = useMemo(
    () =>
      overview?.series.map((s) => ({
        name: s.month,
        Revenue: s.revenue,
        'Expenses (cash)': s.expenseCashBasis,
        'Expenses (accrual)': s.expenseAccrualBasis,
        'Net cash': s.netCash,
      })) ?? [],
    [overview],
  )

  const pieData = useMemo(() => {
    if (!pnl?.byCategory?.length) return []
    const sorted = [...pnl.byCategory].sort((a, b) => b.total - a.total)
    const top = sorted.slice(0, 8)
    const rest = sorted.slice(8).reduce((sum, x) => sum + x.total, 0)
    const out = top.map((r) => ({ name: r.categoryName, value: r.total }))
    if (rest > 0) out.push({ name: 'Other categories', value: rest })
    return out
  }, [pnl])

  const mtdNetAccrual = overview ? overview.mtd.revenue - overview.mtd.expenseAccrualBasis : 0
  const mtdAccrualMargin = overview && overview.mtd.revenue > 0
    ? (overview.mtd.revenue - overview.mtd.expenseAccrualBasis) / overview.mtd.revenue
    : null

  const savePeriodLock = async () => {
    if (!lockDate.trim()) {
      setErr('Choose a “closed through” date, or clear the lock instead.')
      return
    }
    setSavingLock(true)
    setErr(null)
    try {
      await FinanceService.updateFinanceSettings({
        lockedExpenseThrough: new Date(`${lockDate}T12:00:00.000Z`).toISOString(),
      })
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not update period lock')
    } finally {
      setSavingLock(false)
    }
  }

  const clearPeriodLock = async () => {
    setSavingLock(true)
    setErr(null)
    try {
      await FinanceService.updateFinanceSettings({ lockedExpenseThrough: null })
      setLockDate('')
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not clear period lock')
    } finally {
      setSavingLock(false)
    }
  }

  return (
    <div className="space-y-6">
      {err && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive"
        >
          <span>{err}</span>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {overview && overview.alerts.pendingApprovals > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          {overview.alerts.pendingApprovals} expense
          {overview.alerts.pendingApprovals === 1 ? '' : 's'} awaiting approval — open Expenses to review.
        </div>
      )}

      {overview?.settings?.lockedExpenseThrough && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">Books closed through</span>{' '}
            {new Date(overview.settings.lockedExpenseThrough).toLocaleDateString()}. Non–super-admin users cannot create
            or change expenses on or before this date (including approvals, payments, and voids).
          </span>
        </div>
      )}

      {overview && (overview.alerts.overduePayablesCount ?? 0) > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          <span className="font-medium text-destructive">Overdue payables: </span>
          {overview.alerts.overduePayablesCount} open bill
          {(overview.alerts.overduePayablesCount ?? 0) === 1 ? '' : 's'} with due date in the past (
          {formatMoney(overview.alerts.overduePayablesAmount ?? 0)}). Review in Expenses (approved / pending approval with
          due date).
        </div>
      )}

      {overview && (overview.alerts.unreconciledDebitLines ?? 0) > 0 && (
        <div className="rounded-md border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-sm text-sky-950 dark:text-sky-100">
          <span className="font-medium">Reconciliation: </span>
          {overview.alerts.unreconciledDebitLines} unmatched bank debits — open Reconciliation to match or create
          expenses.
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How to read this overview</CardTitle>
          <CardDescription>
            <strong>Cash view</strong> uses paid expenses (liquidity). <strong>Accrual view</strong> includes approved
            unpaid bills (obligations). Use cash for bank runway; use accrual for operating discipline and margin. Charts
            use calendar months; the current month is partial until month-end.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard
          label="MTD revenue"
          value={loading ? '—' : formatMoney(overview?.mtd.revenue ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          hint={
            seriesPair
              ? pctVsPrior(overview!.mtd.revenue, seriesPair.prev.revenue)
              : 'Completed payments (platform)'
          }
        />
        <KpiStatCard
          label="MTD expenses (cash)"
          value={loading ? '—' : formatMoney(overview?.mtd.expenseCashBasis ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          hint={
            seriesPair
              ? pctVsPrior(overview!.mtd.expenseCashBasis, seriesPair.prev.expenseCashBasis)
              : 'Paid expenses by expense date'
          }
        />
        <KpiStatCard
          label="MTD net cash"
          value={loading ? '—' : formatMoney(overview?.mtd.netCash ?? 0)}
          icon={<Receipt className="h-5 w-5" />}
          hint={
            seriesPair
              ? pctVsPrior(overview!.mtd.netCash, seriesPair.prev.netCash)
              : 'Revenue − cash expenses'
          }
          tone="emerald"
        />
        <KpiStatCard
          label="Draft expenses"
          value={loading ? '—' : String(overview?.alerts.draftExpenses ?? 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          hint="Not yet submitted"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiStatCard
          label="MTD expenses (accrual)"
          value={loading ? '—' : formatMoney(overview?.mtd.expenseAccrualBasis ?? 0)}
          icon={<Scale className="h-5 w-5" />}
          hint={overview?.basis.expenseAccrual}
          tone="sky"
        />
        <KpiStatCard
          label="MTD net (accrual)"
          value={loading ? '—' : formatMoney(mtdNetAccrual)}
          icon={<Scale className="h-5 w-5" />}
          hint="Revenue − accrued expenses (approved + paid)"
          tone={mtdNetAccrual >= 0 ? 'emerald' : 'destructive'}
        />
        <KpiStatCard
          label="MTD operating margin (accrual)"
          value={
            loading
              ? '—'
              : mtdAccrualMargin != null
                ? `${(mtdAccrualMargin * 100).toFixed(1)}%`
                : '—'
          }
          icon={<Percent className="h-5 w-5" />}
          hint={
            pnl?.operatingMargin != null
              ? `Same window as category table: ${(pnl.operatingMargin * 100).toFixed(1)}%`
              : 'Needs revenue and expenses in the month'
          }
          tone="primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue vs expenses by month</CardTitle>
          <p className="text-sm text-muted-foreground">
            {overview?.basis.revenue} {overview?.basis.expenseCash} {overview?.basis.expenseAccrual}
          </p>
        </CardHeader>
        <CardContent className="h-[360px]">
          {chartData.length === 0 && !loading ? (
            <p className="text-muted-foreground text-sm">No series data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : String(v))} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
                <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses (cash)" fill="hsl(var(--muted-foreground) / 0.35)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses (accrual)" fill="hsl(217 91% 60% / 0.45)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Net cash" stroke="hsl(142 76% 36%)" strokeWidth={2} dot />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Month-to-date spend mix</CardTitle>
            <p className="text-sm text-muted-foreground">
              Accrual-style expenses in the current calendar month (same basis as the category table beside this chart).
            </p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category spend yet this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => {
                      const p = typeof percent === 'number' ? percent : Number(percent) || 0
                      const nm = String(name ?? '')
                      return `${nm.slice(0, 14)}${nm.length > 14 ? '…' : ''} ${(p * 100).toFixed(0)}%`
                    }}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {pnl && pnl.byCategory.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top categories (MTD)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Revenue {formatMoney(pnl.revenue)} · Expenses {formatMoney(pnl.expensesTotal)}
                {pnl.operatingMargin != null && (
                  <> · Operating margin {`${(pnl.operatingMargin * 100).toFixed(1)}%`}</>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border rounded-md border border-border max-h-[300px] overflow-y-auto">
                {pnl.byCategory.slice(0, 14).map((row) => (
                  <li key={row.categoryId ?? row.categoryName} className="flex justify-between gap-4 px-3 py-2 text-sm">
                    <span className="truncate">{row.categoryName}</span>
                    <span className="shrink-0 font-medium tabular-nums">{formatMoney(row.total)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top categories (MTD)</CardTitle>
              <CardDescription>No accrual expenses recorded for this month yet.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-muted-foreground" aria-hidden />
              Period close (soft lock)
            </CardTitle>
            <CardDescription>
              Set the last day that is considered “closed” for operational edits. Super admins can still adjust closed
              periods on the API if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="fin-lock-through">Close books through (UTC day)</Label>
              <Input
                id="fin-lock-through"
                type="date"
                value={lockDate}
                onChange={(e) => setLockDate(e.target.value)}
                className="w-[200px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void savePeriodLock()} disabled={savingLock || !lockDate}>
                Save lock
              </Button>
              <Button type="button" variant="outline" onClick={() => void clearPeriodLock()} disabled={savingLock}>
                Clear lock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
