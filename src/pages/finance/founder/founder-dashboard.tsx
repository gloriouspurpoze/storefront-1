import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
} from 'recharts'
import {
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Users,
  Percent,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { FounderFinanceService } from '../../../services/api/founder-finance.service'
import type { FounderPnlRow } from '../../../types/founder-finance.types'
import { formatMoney } from '../../../lib/financeFormat'
import { CHART_TOKENS, CHART_CATEGORICAL } from '../../../lib/chartPalette'
import { KpiStatCard } from '../../../components/common'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import {
  FounderError,
  FounderLoading,
  FounderMonthPicker,
  apiNotReadyMessage,
  isApiNotReadyError,
  lastNMonthsRange,
  monthInputValue,
  rangeFromMonthInput,
} from './founder-finance-shared'

function sumRows(rows: FounderPnlRow[]) {
  return rows.reduce(
    (acc, r) => ({
      orders: acc.orders + r.orders,
      gmv: acc.gmv + r.gmv,
      revenue: acc.revenue + r.revenue,
      providerPayout: acc.providerPayout + r.providerPayout,
      grossProfit: acc.grossProfit + r.grossProfit,
      netProfit: acc.netProfit + r.netProfit,
    }),
    { orders: 0, gmv: 0, revenue: 0, providerPayout: 0, grossProfit: 0, netProfit: 0 },
  )
}

export function FounderDashboardPage() {
  const [month, setMonth] = useState(monthInputValue(new Date()))
  const [trend, setTrend] = useState<FounderPnlRow[]>([])
  const [mtd, setMtd] = useState<FounderPnlRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { from, to } = rangeFromMonthInput(month)
      const trendRange = lastNMonthsRange(12)
      const [monthlyRes, trendRes] = await Promise.all([
        FounderFinanceService.getPnl({ from, to, granularity: 'monthly' }),
        FounderFinanceService.getPnl({ ...trendRange, granularity: 'monthly' }),
      ])
      const monthRows = monthlyRes.data ?? []
      const summed = sumRows(monthRows)
      const marginPercent = summed.gmv > 0 ? (summed.netProfit / summed.gmv) * 100 : 0
      setMtd({
        period: month,
        orders: summed.orders,
        gmv: summed.gmv,
        revenue: summed.revenue,
        providerPayout: summed.providerPayout,
        gatewayFee: monthRows.reduce((s, r) => s + r.gatewayFee, 0),
        supportCost: monthRows.reduce((s, r) => s + r.supportCost, 0),
        refundReserve: monthRows.reduce((s, r) => s + r.refundReserve, 0),
        marketingSpend: monthRows.reduce((s, r) => s + r.marketingSpend, 0),
        grossProfit: summed.grossProfit,
        netProfit: summed.netProfit,
        marginPercent,
      })
      setTrend(trendRes.data ?? [])
    } catch (e: unknown) {
      setErr(isApiNotReadyError(e) ? apiNotReadyMessage() : e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const waterfall = useMemo(() => {
    if (!mtd) return []
    return [
      { name: 'Revenue', value: mtd.revenue, fill: CHART_TOKENS.primary },
      { name: 'Provider payout', value: -mtd.providerPayout, fill: CHART_CATEGORICAL[1] },
      { name: 'Gateway', value: -mtd.gatewayFee, fill: CHART_CATEGORICAL[2] },
      { name: 'Support', value: -mtd.supportCost, fill: CHART_CATEGORICAL[3] },
      { name: 'Refund reserve', value: -mtd.refundReserve, fill: CHART_CATEGORICAL[4] },
      { name: 'Marketing', value: -mtd.marketingSpend, fill: CHART_CATEGORICAL[5] },
      { name: 'Net profit', value: mtd.netProfit, fill: CHART_TOKENS.success },
    ]
  }, [mtd])

  const trendChart = useMemo(
    () =>
      trend.map((r) => ({
        name: r.period.slice(0, 7),
        netProfit: r.netProfit,
        margin: r.marginPercent,
        gmv: r.gmv,
      })),
    [trend],
  )

  if (loading) return <FounderLoading label="Loading founder dashboard…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FounderMonthPicker month={month} onMonthChange={setMonth} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/finance/founder/simulator">
              Pricing simulator <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/finance/founder/city-pnl">City P&amp;L</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/finance/founder/leaderboard">Leaderboard</Link>
          </Button>
        </div>
      </div>

      {err && <FounderError message={err} onRetry={() => void load()} />}

      {mtd && !err && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <KpiStatCard icon={<ShoppingCart className="h-6 w-6" />} value={mtd.orders} label="Orders" tone="info" />
            <KpiStatCard
              icon={<IndianRupee className="h-6 w-6" />}
              value={formatMoney(mtd.gmv)}
              label="GMV"
              tone="primary"
            />
            <KpiStatCard
              icon={<TrendingUp className="h-6 w-6" />}
              value={formatMoney(mtd.revenue)}
              label="Revenue"
              tone="success"
            />
            <KpiStatCard
              icon={<Users className="h-6 w-6" />}
              value={formatMoney(mtd.providerPayout)}
              label="Provider payout"
              tone="warning"
            />
            <KpiStatCard
              icon={<Wallet className="h-6 w-6" />}
              value={formatMoney(mtd.grossProfit)}
              label="Gross profit"
              tone="info"
            />
            <KpiStatCard
              icon={<IndianRupee className="h-6 w-6" />}
              value={formatMoney(mtd.netProfit)}
              label="Net profit"
              tone={mtd.netProfit >= 0 ? 'success' : 'destructive'}
            />
            <KpiStatCard
              icon={<Percent className="h-6 w-6" />}
              value={`${mtd.marginPercent.toFixed(1)}%`}
              label="Margin"
              tone="primary"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost waterfall (selected month)</CardTitle>
                <CardDescription>Revenue through deductions to net profit</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={waterfall} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                    <YAxis tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => formatMoney(Math.abs(v))}
                      contentStyle={{ background: CHART_TOKENS.surface, borderColor: CHART_TOKENS.grid }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">12-month trend</CardTitle>
                <CardDescription>Net profit and margin %</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: CHART_TOKENS.surface, borderColor: CHART_TOKENS.grid }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="netProfit" name="Net profit" fill={CHART_TOKENS.primary} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="margin"
                      name="Margin %"
                      stroke={CHART_TOKENS.success}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
