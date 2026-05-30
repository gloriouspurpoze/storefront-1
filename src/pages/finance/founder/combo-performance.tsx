import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, TrendingUp, IndianRupee, Percent } from 'lucide-react'
import { FounderFinanceService } from '../../../services/api/founder-finance.service'
import type { FounderComboPerformance } from '../../../types/founder-finance.types'
import { formatMoney } from '../../../lib/financeFormat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { StandardTable, type StandardTableColumn } from '../../../components/common'
import {
  FounderError,
  FounderLoading,
  FounderMonthPicker,
  monthInputValue,
  rangeFromMonthInput,
} from './founder-finance-shared'
import { KpiStatCard } from '../../../components/common'

export function ComboPerformancePage() {
  const [month, setMonth] = useState(monthInputValue(new Date()))
  const [data, setData] = useState<FounderComboPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { from, to } = rangeFromMonthInput(month)
      const res = await FounderFinanceService.getComboPerformance({ from, to })
      setData(res.data)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load combo performance')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const columns: StandardTableColumn<FounderComboPerformance['byPromoCode'][0]>[] = useMemo(
    () => [
      { id: 'code', label: 'Promo code', sortable: true, valueGetter: (r) => r.code, render: (_, r) => r.code },
      {
        id: 'bookings',
        label: 'Bookings',
        align: 'right',
        sortable: true,
        valueGetter: (r) => r.bookings,
        render: (_, r) => r.bookings,
      },
      {
        id: 'discount',
        label: 'Discount given',
        align: 'right',
        sortable: true,
        valueGetter: (r) => r.totalDiscount,
        render: (_, r) => formatMoney(r.totalDiscount),
      },
      {
        id: 'avg',
        label: 'Avg ticket',
        align: 'right',
        sortable: true,
        valueGetter: (r) => r.avgTicket,
        render: (_, r) => formatMoney(r.avgTicket),
      },
    ],
    [],
  )

  if (loading && !data) return <FounderLoading label="Loading combo performance…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FounderMonthPicker month={month} onMonthChange={setMonth} />
      </div>

      {err && <FounderError message={err} onRetry={() => void load()} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiStatCard
              icon={<Percent className="h-6 w-6" />}
              value={`${data.attachRatePercent.toFixed(1)}%`}
              label="Promo attach rate"
              hint={`${data.promoBookings} of ${data.totalBookings} bookings`}
              tone="primary"
            />
            <KpiStatCard
              icon={<TrendingUp className="h-6 w-6" />}
              value={formatMoney(data.incrementalAov)}
              label="Incremental AOV"
              hint="Avg ticket with promo − without"
              tone="success"
            />
            <KpiStatCard
              icon={<IndianRupee className="h-6 w-6" />}
              value={formatMoney(data.totalDiscountGiven)}
              label="Discount given"
              hint="Sum of coupon discounts"
              tone="warning"
            />
            <KpiStatCard
              icon={<Layers className="h-6 w-6" />}
              value={formatMoney(data.estimatedCannibalisation)}
              label="Est. cannibalisation"
              hint={`Assumes ${data.cannibalisationAssumptionPercent}% of discount was unnecessary`}
              tone="info"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket comparison</CardTitle>
                <CardDescription>Same period, direct bookings only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With promo</span>
                  <span className="font-medium tabular-nums">{formatMoney(data.avgTicketWithPromo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Without promo</span>
                  <span className="font-medium tabular-nums">{formatMoney(data.avgTicketWithoutPromo)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How to read this</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Attach rate shows how often customers used a promo code at checkout. Positive incremental AOV
                means promo bookings are larger baskets — combos are working. Cannibalisation is an estimate
                of discount given on orders that may have converted anyway; tune offers if this exceeds 40%
                of discount spend.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By promo code</CardTitle>
            </CardHeader>
            <CardContent>
              <StandardTable
                columns={columns}
                data={data.byPromoCode}
                getRowId={(r) => r.code}
                emptyMessage="No promo codes used in this period."
                showSearch={false}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
