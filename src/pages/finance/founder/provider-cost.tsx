import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FounderFinanceService } from '../../../services/api/founder-finance.service'
import type { FounderProviderCostRow, ProviderCostStatus } from '../../../types/founder-finance.types'
import { formatMoney } from '../../../lib/financeFormat'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { StandardTable, type StandardTableColumn } from '../../../components/common'
import { Button } from '../../../components/ui/button'
import {
  FounderError,
  FounderLoading,
  FounderMonthPicker,
  apiNotReadyMessage,
  isApiNotReadyError,
  monthInputValue,
  rangeFromMonthInput,
} from './founder-finance-shared'

function statusBadge(status: ProviderCostStatus) {
  const map: Record<ProviderCostStatus, string> = {
    ok: 'border-transparent bg-storm-mist/40 text-storm-deep',
    overpaid: 'border-transparent bg-bloom-rose text-bloom-deep',
    underpaid: 'border-transparent bg-primary-soft text-primary-deep',
  }
  return (
    <Badge variant="outline" className={map[status]}>
      {status}
    </Badge>
  )
}

export function ProviderCostPage() {
  const [month, setMonth] = useState(monthInputValue(new Date()))
  const [rows, setRows] = useState<FounderProviderCostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProviderCostStatus | 'all'>('all')
  const [minVariancePct, setMinVariancePct] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { from, to } = rangeFromMonthInput(month)
      const res = await FounderFinanceService.getProviderCost({ from, to })
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

  const filtered = useMemo(() => {
    const minV = Number(minVariancePct) || 0
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (minV > 0 && Math.abs(r.variancePercent) < minV) return false
      return true
    })
  }, [rows, statusFilter, minVariancePct])

  const columns: StandardTableColumn<FounderProviderCostRow>[] = [
    {
      id: 'name',
      label: 'Provider',
      render: (_, r) => (
        <Link to={`/professionals/${r.providerId}`} className="font-medium text-primary hover:underline">
          {r.name}
        </Link>
      ),
    },
    { id: 'modeled', label: 'Modeled payout', render: (_, r) => formatMoney(r.modeledPayout) },
    { id: 'actual', label: 'Actual payout', render: (_, r) => formatMoney(r.actualPayout) },
    {
      id: 'variance',
      label: 'Variance',
      render: (_, r) => (
        <span className={r.variance >= 0 ? 'text-bloom-deep' : 'text-storm-deep'}>
          {formatMoney(r.variance)}
        </span>
      ),
    },
    { id: 'varPct', label: 'Variance %', render: (_, r) => `${r.variancePercent.toFixed(1)}%` },
    { id: 'status', label: 'Status', render: (_, r) => statusBadge(r.status) },
  ]

  if (loading) return <FounderLoading label="Loading provider cost…" />

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Compare modeled provider payout (slab engine on completed GMV) vs actual payouts from the earnings ledger.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <FounderMonthPicker month={month} onMonthChange={setMonth} />
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProviderCostStatus | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="overpaid">Overpaid</SelectItem>
              <SelectItem value="underpaid">Underpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Min |variance| %</Label>
          <Input
            type="number"
            min={0}
            className="w-[120px]"
            placeholder="0"
            value={minVariancePct}
            onChange={(e) => setMinVariancePct(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/payouts">Earnings &amp; payouts</Link>
        </Button>
      </div>

      {err && <FounderError message={err} onRetry={() => void load()} />}

      {!err && (
        <StandardTable
          columns={columns}
          data={filtered}
          getRowId={(r) => r.providerId}
          emptyMessage="No provider cost rows for this period."
        />
      )}
    </div>
  )
}
