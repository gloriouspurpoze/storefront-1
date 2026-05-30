import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { FounderFinanceService } from '../../../services/api/founder-finance.service'
import type { FounderCityPnlRow } from '../../../types/founder-finance.types'
import { formatMoney } from '../../../lib/financeFormat'
import { marginStatus } from '../../../lib/founderFinanceMath'
import { CHART_TOKENS } from '../../../lib/chartPalette'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { StandardTable, type StandardTableColumn } from '../../../components/common'
import {
  FounderError,
  FounderLoading,
  FounderMonthPicker,
  apiNotReadyMessage,
  isApiNotReadyError,
  monthInputValue,
  rangeFromMonthInput,
} from './founder-finance-shared'

function marginBadge(margin: number) {
  const st = marginStatus(margin)
  return (
    <Badge
      variant="outline"
      className={
        st === 'good'
          ? 'border-transparent bg-storm-mist/40 text-storm-deep'
          : st === 'warn'
            ? 'border-transparent bg-bloom-rose text-bloom-deep'
            : 'border-transparent bg-bloom-deep text-on-ink'
      }
    >
      {margin.toFixed(1)}%
    </Badge>
  )
}

export function CityPnlPage() {
  const [month, setMonth] = useState(monthInputValue(new Date()))
  const [rows, setRows] = useState<FounderCityPnlRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { from, to } = rangeFromMonthInput(month)
      const res = await FounderFinanceService.getCityPnl({ from, to })
      setRows(res.data ?? [])
    } catch (e: unknown) {
      setErr(isApiNotReadyError(e) ? apiNotReadyMessage() : e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const chartData = useMemo(
    () => [...rows].sort((a, b) => b.netProfit - a.netProfit).map((r) => ({ name: r.city, netProfit: r.netProfit })),
    [rows],
  )

  const columns: StandardTableColumn<FounderCityPnlRow>[] = [
    { id: 'city', label: 'City', render: (_, r) => r.city },
    { id: 'mult', label: 'Multiplier', render: (_, r) => `${r.priceMultiplier}×` },
    { id: 'orders', label: 'Orders', render: (_, r) => r.orders },
    { id: 'gmv', label: 'GMV', render: (_, r) => formatMoney(r.gmv) },
    { id: 'revenue', label: 'Revenue', render: (_, r) => formatMoney(r.revenue) },
    { id: 'net', label: 'Net profit', render: (_, r) => formatMoney(r.netProfit) },
    { id: 'margin', label: 'Margin', render: (_, r) => marginBadge(r.marginPercent) },
  ]

  if (loading) return <FounderLoading label="Loading city P&L…" />

  return (
    <div className="space-y-6">
      <FounderMonthPicker month={month} onMonthChange={setMonth} />
      {err && <FounderError message={err} onRetry={() => void load()} />}

      {!err && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net profit by city</CardTitle>
              <CardDescription>Mumbai, Bangalore, Delhi, Pune and other operating cities</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No city data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                    <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => formatMoney(v)}
                      contentStyle={{ background: CHART_TOKENS.surface, borderColor: CHART_TOKENS.grid }}
                    />
                    <Bar dataKey="netProfit" fill={CHART_TOKENS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <StandardTable
            columns={columns}
            data={rows}
            getRowId={(r) => r.city}
            emptyMessage="No city-level bookings in this period."
          />
        </>
      )}
    </div>
  )
}
