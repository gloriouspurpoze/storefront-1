import React, { useState, useEffect } from 'react'
import {
  Banknote,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  Info,
  Receipt,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { PaymentsService } from '../../services/api/payments.service'
import type { Payment } from '../../types'
import { downloadCsv } from '../../lib/exportUtils'
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
import { Separator } from '../../components/ui/separator'
import { cn } from '../../lib/utils'

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${v}%` }} />
    </div>
  )
}

export function ProviderEarnings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    thisMonth: 0,
    lastMonth: 0,
    averagePerJob: 0,
    totalJobs: 0,
  })

  const [transactions, setTransactions] = useState<Payment[]>([])

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const statsRes = await PaymentsService.getProviderPaymentStats()
      if (statsRes?.success && statsRes.data) {
        setEarnings(statsRes.data)
      }

      const transactionsRes = await PaymentsService.getProviderTransactions({
        page: 1,
        limit: 10,
      })
      if (transactionsRes?.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.payments || [])
      } else {
        setTransactions([])
      }
    } catch (err: unknown) {
      console.error('Error fetching earnings data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'border-storm-deep/30 bg-storm-deep/15 text-storm-deep dark:text-storm-sea'
      case 'processing':
        return 'border-primary/30 bg-primary/15 text-primary dark:text-primary'
      case 'pending':
        return 'border-bloom-coral/30 bg-bloom-coral/15 text-bloom-coral dark:text-bloom-deep'
      default:
        return ''
    }
  }

  const getStatusIcon = (status: string) => {
    const cls = 'h-3.5 w-3.5'
    switch (status) {
      case 'paid':
        return <CheckCircle2 className={cls} />
      case 'processing':
      case 'pending':
        return <Clock className={cls} />
      default:
        return <Receipt className={cls} />
    }
  }

  const monthlyGrowth =
    earnings.lastMonth === 0 ? '0.0' : (((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100).toFixed(1)
  const isGrowthPositive = parseFloat(monthlyGrowth) > 0

  const handleDownloadStatement = async () => {
    try {
      const res = await PaymentsService.getProviderTransactions({ page: 1, limit: 500 })
      const rows: unknown[][] = []
      const list =
        res?.success && res.data ? (res.data as { payments?: Payment[] }).payments || [] : transactions
      rows.push(['Summary', 'Value'])
      rows.push(['Total earnings', earnings.totalEarnings])
      rows.push(['Pending payouts', earnings.pendingPayouts])
      rows.push(['Completed payouts', earnings.completedPayouts])
      rows.push(['This month', earnings.thisMonth])
      rows.push(['Last month', earnings.lastMonth])
      rows.push(['Average per job', earnings.averagePerJob])
      rows.push(['Total jobs', earnings.totalJobs])
      rows.push([])
      rows.push(['Transaction ID', 'Amount', 'Status', 'Method', 'Date', 'Booking'])
      for (const p of list) {
        const po = p as unknown as Record<string, unknown>
        const id = po.id ?? po._id ?? ''
        const txn = po.transaction_id ?? po.transactionId ?? ''
        rows.push([
          String(txn || id),
          String(po.amount ?? ''),
          String(po.status ?? ''),
          String(po.payment_method ?? po.paymentMethod ?? ''),
          String(po.created_at ?? po.createdAt ?? ''),
          String(po.booking_id ?? po.bookingId ?? ''),
        ])
      }
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`earnings-statement-${stamp}.csv`, rows)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight md:text-3xl">My Earnings</h1>
            <p className="text-muted-foreground">Track your income, payouts, and transaction history</p>
          </div>
          <Button type="button" className="rounded-lg" leftIcon={<Download className="h-4 w-4" />} onClick={handleDownloadStatement}>
            Download Statement
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <div className="mb-6 flex gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Payouts are processed within 2–3 business days after job completion. Pending earnings will be transferred to your
          bank account.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary-deep text-white shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                    <CircleDollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="mb-0.5 text-3xl font-bold">${earnings.totalEarnings.toLocaleString()}</p>
                <p className="text-sm opacity-90">Total Earnings</p>
                <p className="mt-2 block text-xs opacity-70">From {earnings.totalJobs} completed jobs</p>
              </CardContent>
            </Card>

            <Card className="h-full rounded-lg shadow-sm">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bloom-coral/15">
                    <Clock className="h-6 w-6 text-bloom-coral dark:text-bloom-coral" />
                  </div>
                </div>
                <p className="mb-0.5 text-3xl font-bold">${earnings.pendingPayouts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="mt-2 block text-xs text-muted-foreground">Will be paid in 2–3 days</p>
              </CardContent>
            </Card>

            <Card className="h-full rounded-lg shadow-sm">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-storm-deep/15">
                    <CheckCircle2 className="h-6 w-6 text-storm-deep dark:text-storm-sea" />
                  </div>
                </div>
                <p className="mb-0.5 text-3xl font-bold">${earnings.completedPayouts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Completed Payouts</p>
                <p className="mt-2 block text-xs text-muted-foreground">Transferred to bank</p>
              </CardContent>
            </Card>

            <Card className="h-full rounded-lg shadow-sm">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-lg',
                      isGrowthPositive ? 'bg-storm-deep/15' : 'bg-destructive/15',
                    )}
                  >
                    {isGrowthPositive ? (
                      <TrendingUp className="h-6 w-6 text-storm-deep dark:text-storm-sea" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-destructive dark:text-bloom-coral" />
                    )}
                  </div>
                  <Badge variant={isGrowthPositive ? 'success' : 'destructive'} className="text-xs">
                    {isGrowthPositive ? '+' : ''}
                    {monthlyGrowth}%
                  </Badge>
                </div>
                <p className="mb-0.5 text-3xl font-bold">${earnings.thisMonth.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="mt-2 block text-xs text-muted-foreground">vs ${earnings.lastMonth} last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="rounded-lg lg:col-span-8">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Transaction History</h2>
                  <Button type="button" variant="outline" size="sm" className="rounded-md">
                    View All
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Net Earning</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const t = transaction as unknown as Record<string, unknown>
                      return (
                        <TableRow key={String(transaction.id)}>
                          <TableCell className="font-semibold">
                            {String(t.booking_id ?? transaction.bookingId ?? `BK-${String(transaction.id).slice(0, 8)}`)}
                          </TableCell>
                          <TableCell>
                            {String(t.customer_name ?? transaction.customerName ?? (t.customer as { name?: string })?.name ?? 'N/A')}
                          </TableCell>
                          <TableCell>{String(t.service_name ?? transaction.serviceName ?? 'N/A')}</TableCell>
                          <TableCell className="font-semibold">${transaction.amount || 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            -$
                            {String(t.platform_fee ?? transaction.platformFee ?? transaction.fee ?? 0)}
                          </TableCell>
                          <TableCell className="font-semibold text-storm-deep dark:text-storm-sea">
                            $
                            {String(
                              t.provider_amount ??
                                transaction.providerAmount ??
                                t.net_amount ??
                                transaction.netAmount ??
                                0,
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('inline-flex items-center gap-1 capitalize', statusBadgeClass(transaction.status))}
                            >
                              {getStatusIcon(transaction.status)}
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{String(t.created_at ?? transaction.createdAt ?? 'N/A')}</div>
                            {(t.payout_date ?? transaction.payoutDate) ? (
                              <div className="text-xs text-muted-foreground">
                                Paid: {String(t.payout_date ?? transaction.payoutDate)}
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6 lg:col-span-4">
              <Card className="rounded-lg">
                <CardContent className="pt-6">
                  <h2 className="mb-4 text-lg font-semibold">Earnings Breakdown</h2>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Per Job</span>
                      <span className="font-semibold">${earnings.averagePerJob}</span>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Fee Rate</span>
                        <span className="font-semibold">10%</span>
                      </div>
                      <ProgressBar value={10} className="h-2" />
                    </div>
                    <Separator />
                    <div className="rounded-lg bg-storm-deep/10 p-4 dark:bg-storm-deep/40">
                      <p className="mb-1 text-sm text-storm-deep dark:text-on-ink">This Month&apos;s Progress</p>
                      <p className="mb-2 text-2xl font-bold text-storm-deep dark:text-on-ink">
                        ${earnings.thisMonth.toLocaleString()}
                      </p>
                      <ProgressBar value={75} className="h-2 bg-storm-mist/50 dark:bg-storm-deep/50" />
                      <p className="mt-2 text-xs text-storm-deep dark:text-storm-sea">75% of monthly goal ($4,500)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Payout Account</h2>
                  </div>
                  <div className="mb-4 rounded-md border bg-muted/50 p-4 text-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Bank Name</p>
                        <p className="font-medium">Chase Bank</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-medium">******* 1234</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Account Holder</p>
                        <p className="font-medium">Mike Smith</p>
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full rounded-md">
                    Update Bank Details
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-0 bg-primary text-primary-foreground shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Payout Schedule</h2>
                  </div>
                  <p className="mb-4 text-sm opacity-90">
                    Next payout on <strong>November 10, 2025</strong>
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Pending Amount:</span>
                      <span className="font-semibold">${earnings.pendingPayouts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Payout Frequency:</span>
                      <span className="font-semibold">Weekly</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
