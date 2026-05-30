import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Plus, Trash2, Pencil, Sparkles } from 'lucide-react'
import { FounderFinanceService } from '../../../services/api/founder-finance.service'
import type {
  AttributionChannel,
  CacChannel,
  FounderAttributionBreakdown,
  FounderCacEntry,
  FounderCacSummary,
} from '../../../types/founder-finance.types'
import { formatMoney } from '../../../lib/financeFormat'
import { CHART_CATEGORICAL, CHART_TOKENS } from '../../../lib/chartPalette'
import { KpiStatCard } from '../../../components/common'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { usePermissions } from '../../../hooks/usePermissions'
import { EmptyState, StandardTable, type StandardTableColumn } from '../../../components/common'
import {
  FounderError,
  FounderLoading,
  FounderMonthPicker,
  apiNotReadyMessage,
  isApiNotReadyError,
  lastNMonthsRange,
  monthInputValue,
} from './founder-finance-shared'

const CHANNELS: { id: CacChannel; label: string }[] = [
  { id: 'google', label: 'Google Ads' },
  { id: 'meta', label: 'Meta Ads' },
  { id: 'seo', label: 'SEO' },
  { id: 'referral', label: 'Referral' },
  { id: 'other', label: 'Other' },
]

const ATTRIBUTION_CHANNEL_LABELS: Record<AttributionChannel, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  seo: 'SEO / Organic Search',
  social_organic: 'Organic Social',
  referral: 'Referral',
  direct: 'Direct',
  other: 'Other',
}

const emptyForm = () => ({
  month: monthInputValue(new Date()),
  channel: 'google' as CacChannel,
  spend: '',
  attributedCustomers: '',
  notes: '',
})

export function CacPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const [month, setMonth] = useState(monthInputValue(new Date()))
  const [entries, setEntries] = useState<FounderCacEntry[]>([])
  const [summary, setSummary] = useState<FounderCacSummary | null>(null)
  const [breakdown, setBreakdown] = useState<FounderAttributionBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FounderCacEntry | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const range = lastNMonthsRange(6)
      const [listRes, sumRes, breakdownRes] = await Promise.all([
        FounderFinanceService.listCac({ month }),
        FounderFinanceService.getCacSummary(range),
        FounderFinanceService.getCacAttribution(range),
      ])
      setEntries(listRes.data ?? [])
      setSummary(sumRes.data)
      setBreakdown(breakdownRes.data)
    } catch (e: unknown) {
      setErr(isApiNotReadyError(e) ? apiNotReadyMessage() : e instanceof Error ? e.message : 'Failed to load CAC')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const channelCards = useMemo(() => {
    const by = summary?.byChannel ?? []
    return CHANNELS.map((ch) => {
      const row = by.find((b) => b.channel === ch.id)
      return {
        ...ch,
        spend: row?.spend ?? 0,
        acquired: row?.acquired ?? 0,
        acquiredAuto: row?.acquiredAuto ?? 0,
        acquiredManual: row?.acquiredManual ?? 0,
        cac: row?.cac ?? 0,
      }
    })
  }, [summary])

  const stackedChart = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>()
    for (const e of entries) {
      const m = e.month.slice(0, 7)
      if (!byMonth.has(m)) byMonth.set(m, {})
      const row = byMonth.get(m)!
      row[e.channel] = (row[e.channel] ?? 0) + e.spend
    }
    return Array.from(byMonth.entries()).map(([name, channels]) => ({ name, ...channels }))
  }, [entries])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm(), month })
    setDialogOpen(true)
  }

  const openEdit = (row: FounderCacEntry) => {
    setEditing(row)
    setForm({
      month: row.month.slice(0, 7),
      channel: row.channel,
      spend: String(row.spend),
      attributedCustomers: String(row.attributedCustomers),
      notes: row.notes ?? '',
    })
    setDialogOpen(true)
  }

  const saveEntry = async () => {
    if (!canManage) return
    setSaving(true)
    try {
      const body = {
        month: form.month,
        channel: form.channel,
        spend: Number(form.spend) || 0,
        attributedCustomers: Number(form.attributedCustomers) || 0,
        notes: form.notes || undefined,
      }
      if (editing) {
        await FounderFinanceService.updateCac(editing.id, body)
      } else {
        await FounderFinanceService.createCac(body)
      }
      setDialogOpen(false)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const removeEntry = async (id: string) => {
    if (!canManage || !window.confirm('Delete this CAC entry?')) return
    try {
      await FounderFinanceService.deleteCac(id)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const columns: StandardTableColumn<FounderCacEntry>[] = [
    { id: 'month', label: 'Month', render: (_, r) => r.month.slice(0, 7) },
    { id: 'channel', label: 'Channel', render: (_, r) => r.channel },
    { id: 'spend', label: 'Spend', render: (_, r) => formatMoney(r.spend) },
    { id: 'acquired', label: 'Customers', render: (_, r) => r.attributedCustomers },
    {
      id: 'cac',
      label: 'CAC',
      render: (_, r) =>
        r.attributedCustomers > 0 ? formatMoney(r.spend / r.attributedCustomers) : '—',
    },
    { id: 'notes', label: 'Notes', render: (_, r) => r.notes ?? '—' },
  ]

  if (loading) return <FounderLoading label="Loading CAC…" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FounderMonthPicker month={month} onMonthChange={setMonth} label="Filter month" />
        {canManage && (
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Add entry
          </Button>
        )}
      </div>

      {err && <FounderError message={err} onRetry={() => void load()} />}

      {!err && !loading && entries.length === 0 && (
        <EmptyState
          title="No CAC data yet"
          description={
            canManage
              ? 'Customer signups on the website are now auto-attributed by channel via UTM / referrer tracking — no entry needed for the customer count. You only need to log monthly spend (Google Ads / Meta / SEO budget) and CAC will be computed automatically. Add one row per channel per month.'
              : 'No entries for the selected month. Ask someone with manage_finance permission to add monthly ad spend; customer attribution is already tracked automatically from the customer site.'
          }
          action={
            canManage
              ? { label: 'Add first CAC entry', onClick: openCreate }
              : undefined
          }
        />
      )}

      {/* Auto-attribution coverage banner — confidence in CAC numbers depends on
          what % of signups carry a captured first-touch channel. */}
      {breakdown && breakdown.totalSignups > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Acquisition mix (last 6 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Where {breakdown.totalAttributed.toLocaleString()} of {breakdown.totalSignups.toLocaleString()} new
              customer signups came from ({breakdown.attributionCoveragePercent.toFixed(0)}% coverage).{' '}
              {breakdown.attributionCoveragePercent < 60 && (
                <span className="text-amber-600">
                  Low coverage — older accounts predate the tracking rollout and have no first-touch data.
                </span>
              )}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {breakdown.byChannel
                .slice()
                .sort((a, b) => b.customers - a.customers)
                .map((row) => (
                  <div key={row.channel} className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {ATTRIBUTION_CHANNEL_LABELS[row.channel]}
                    </div>
                    <div className="font-medium">
                      {row.customers.toLocaleString()}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({row.sharePercent.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary && !err && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiStatCard
            icon={<span className="text-lg font-bold">CAC</span>}
            value={summary.blendedCac > 0 ? formatMoney(summary.blendedCac) : '—'}
            label="Blended CAC (6 mo)"
            tone="primary"
          />
          <KpiStatCard
            icon={<span className="text-lg font-bold">#</span>}
            value={summary.totalAcquired}
            label="Customers acquired"
            tone="success"
          />
          <KpiStatCard
            icon={<span className="text-lg font-bold">₹</span>}
            value={formatMoney(summary.totalSpend)}
            label="Total ad spend"
            tone="warning"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channelCards.map((ch, i) => {
          // When an admin enters a manual `acquiredManual`, that's the override
          // and the auto count is shown for transparency. Otherwise the auto
          // first-touch count drives CAC directly.
          const sourceLabel = ch.acquiredManual > 0 ? 'manual override' : 'auto-tracked'
          return (
            <Card key={ch.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{ch.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  Spend: <span className="font-medium">{formatMoney(ch.spend)}</span>
                </p>
                <p>
                  Acquired: <span className="font-medium">{ch.acquired}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({sourceLabel})</span>
                </p>
                {ch.acquiredManual > 0 && ch.acquiredAuto > 0 && (
                  <p className="text-xs text-muted-foreground">
                    auto would be {ch.acquiredAuto}
                  </p>
                )}
                <p>
                  CAC:{' '}
                  <span
                    className="font-medium"
                    style={{ color: CHART_CATEGORICAL[i % CHART_CATEGORICAL.length] }}
                  >
                    {ch.cac > 0 ? formatMoney(ch.cac) : '—'}
                  </span>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {stackedChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend by channel</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedChart}>
                <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_TOKENS.axis, fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
                {CHANNELS.map((ch, i) => (
                  <Bar key={ch.id} dataKey={ch.id} stackId="a" fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <StandardTable
        columns={columns}
        data={entries}
        getRowId={(r) => r.id}
        emptyMessage="No CAC entries for this month."
        renderActions={
          canManage
            ? (row) => (
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeEntry(row.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              )
            : undefined
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit CAC entry' : 'Add CAC entry'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input type="month" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v as CacChannel }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spend (₹)</Label>
              <Input type="number" min={0} value={form.spend} onChange={(e) => setForm((f) => ({ ...f, spend: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>
                Attributed customers <span className="text-xs text-muted-foreground">(optional override)</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={form.attributedCustomers}
                onChange={(e) => setForm((f) => ({ ...f, attributedCustomers: e.target.value }))}
                placeholder="Leave 0 to use auto-tracked count"
              />
              <p className="text-xs text-muted-foreground">
                Auto-attribution from UTM / referrer tracking is used by default. Only enter a
                manual count for offline channels (e.g. billboards, OOH) that signups can&apos;t
                self-report through the customer site.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEntry()} disabled={saving || !canManage}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
