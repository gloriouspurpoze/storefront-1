import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Medal } from 'lucide-react'
import { FounderFinanceService } from '../../../services/api/founder-finance.service'
import type { FounderLeaderboardSortBy, FounderProviderLeaderboardRow } from '../../../types/founder-finance.types'
import { formatMoney } from '../../../lib/financeFormat'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
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

const SORT_TABS: { id: FounderLeaderboardSortBy; label: string }[] = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'margin', label: 'Margin' },
  { id: 'rating', label: 'Rating' },
  { id: 'cancellation', label: 'Cancellation' },
]

function rankMedal(rank: number) {
  if (rank === 1) return <Medal className="h-4 w-4 text-primary" aria-label="1st" />
  if (rank === 2) return <Medal className="h-4 w-4 text-graphite" aria-label="2nd" />
  if (rank === 3) return <Medal className="h-4 w-4 text-storm-deep" aria-label="3rd" />
  return <span className="tabular-nums text-muted-foreground">{rank}</span>
}

function downloadCsv(rows: FounderProviderLeaderboardRow[], sortBy: string) {
  const header = [
    'Rank',
    'Provider',
    'Jobs',
    'GMV',
    'Revenue to platform',
    'Provider earnings',
    'Margin %',
    'Cancellation %',
    'Rating',
  ]
  const body = rows.map((r, i) => [
    String(i + 1),
    r.name,
    String(r.completedJobs),
    String(r.gmv),
    String(r.revenueToPlatform),
    String(r.providerEarnings),
    String(r.marginPercent),
    String(r.cancellationRate),
    String(r.averageRating),
  ])
  const csv = [header, ...body].map((line) => line.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `provider-leaderboard-${sortBy}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ProviderLeaderboardPage() {
  const [month, setMonth] = useState(monthInputValue(new Date()))
  const [sortBy, setSortBy] = useState<FounderLeaderboardSortBy>('revenue')
  const [rows, setRows] = useState<FounderProviderLeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const { from, to } = rangeFromMonthInput(month)
      const res = await FounderFinanceService.getProviderLeaderboard({
        from,
        to,
        sortBy,
        limit: 50,
      })
      setRows(res.data ?? [])
    } catch (e: unknown) {
      setErr(isApiNotReadyError(e) ? apiNotReadyMessage() : e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [month, sortBy])

  useEffect(() => {
    void load()
  }, [load])

  const columns: StandardTableColumn<FounderProviderLeaderboardRow & { rank: number }>[] = [
    { id: 'rank', label: '#', width: 48, render: (_, r) => rankMedal(r.rank) },
    {
      id: 'name',
      label: 'Provider',
      render: (_, r) => (
        <Link to={`/professionals/${r.providerId}`} className="font-medium text-primary hover:underline">
          {r.name}
        </Link>
      ),
    },
    { id: 'jobs', label: 'Completed jobs', render: (_, r) => r.completedJobs },
    { id: 'gmv', label: 'GMV', render: (_, r) => formatMoney(r.gmv) },
    { id: 'rev', label: 'Platform revenue', render: (_, r) => formatMoney(r.revenueToPlatform) },
    { id: 'earn', label: 'Provider earnings', render: (_, r) => formatMoney(r.providerEarnings) },
    { id: 'margin', label: 'Margin %', render: (_, r) => `${r.marginPercent.toFixed(1)}%` },
    { id: 'cancel', label: 'Cancellation %', render: (_, r) => `${r.cancellationRate.toFixed(1)}%` },
    { id: 'rating', label: 'Rating', render: (_, r) => r.averageRating.toFixed(2) },
  ]

  const tableData = rows.map((r, i) => ({ ...r, rank: i + 1 }))

  if (loading) return <FounderLoading label="Loading leaderboard…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FounderMonthPicker month={month} onMonthChange={setMonth} />
        <Button type="button" variant="outline" size="sm" onClick={() => downloadCsv(rows, sortBy)} disabled={rows.length === 0}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {err && <FounderError message={err} onRetry={() => void load()} />}

      {!err && (
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as FounderLeaderboardSortBy)}>
          <TabsList>
            {SORT_TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {SORT_TABS.map((t) => (
            <TabsContent key={t.id} value={t.id}>
              <StandardTable
                columns={columns}
                data={tableData}
                getRowId={(r) => r.providerId}
                emptyMessage="No providers ranked for this period."
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
