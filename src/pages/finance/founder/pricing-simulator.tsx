import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Filter, Info, Settings2 } from 'lucide-react'
import { OperationsCommercialService } from '../../../services/api/operations-commercial.service'
import { platformServicesService } from '../../../services/api/platformServices.service'
import type { PlatformService } from '../../../services/api/platformServices.service'
import type { OperatingCityDto, TenantCommercialTermsDto } from '../../../types/operating-commercial.types'
import { simulateTicket, marginStatus, type TicketSimulationOverrides } from '../../../lib/founderFinanceMath'
import { formatMoney } from '../../../lib/financeFormat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { StandardTable, type StandardTableColumn } from '../../../components/common'
import { Badge } from '../../../components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip'
import { FounderError, FounderLoading } from './founder-finance-shared'

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Margin-tone badge shared by ad-hoc breakdown and catalog rows. */
function MarginBadge({ value }: { value: number }) {
  const st = marginStatus(value)
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
      {value.toFixed(1)}%
    </Badge>
  )
}

export function PricingSimulatorPage() {
  const [terms, setTerms] = useState<TenantCommercialTermsDto | null>(null)
  const [cities, setCities] = useState<OperatingCityDto[]>([])
  const [services, setServices] = useState<PlatformService[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [ticketPrice, setTicketPrice] = useState('750')
  const [cityId, setCityId] = useState<string>('__default')
  const [overrides, setOverrides] = useState<TicketSimulationOverrides>({})

  // Catalog table state — owned by the page so filter/sort/paginate compose.
  const [categoryFilter, setCategoryFilter] = useState<string>('__all')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<string>('netProfit')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        OperationsCommercialService.getTerms(),
        OperationsCommercialService.listCities({ activeOnly: true, limit: 100 }),
        platformServicesService.getServices({ limit: 200, status: 'published' }),
      ])
      setTerms(tRes.data)
      setCities(cRes.data.cities ?? [])
      setServices(sRes.services ?? [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load simulator data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cityMultiplier = useMemo(() => {
    if (cityId === '__default') return 1
    const c = cities.find((x) => x.id === cityId)
    return c?.priceMultiplier ?? 1
  }, [cityId, cities])

  const adHoc = useMemo(() => {
    if (!terms) return null
    const amount = Number(ticketPrice) || 0
    return simulateTicket(amount, terms, cityMultiplier, overrides)
  }, [terms, ticketPrice, cityMultiplier, overrides])

  // Unique categories surfaced from the catalog itself — keeps the filter in
  // sync with whatever the platform-services service returns.
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of services) {
      const key = (s.category || '').trim()
      if (!key) continue
      if (!seen.has(key.toLowerCase())) seen.set(key.toLowerCase(), key)
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
  }, [services])

  // Apply category + text filter BEFORE running the (cost-heavy) simulation
  // pass so we don't waste work on rows the table will never show.
  const filteredServices = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return services.filter((s) => {
      if (categoryFilter !== '__all' && (s.category || '').toLowerCase() !== categoryFilter) {
        return false
      }
      if (!q) return true
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.subcategory || '').toLowerCase().includes(q)
      )
    })
  }, [services, categoryFilter, searchText])

  const catalogRows = useMemo(() => {
    if (!terms) return []
    return filteredServices.map((s) => {
      const base = s.base_price ?? s.consultation_fee ?? s.hourly_rate ?? 0
      const sim = simulateTicket(base, terms, cityMultiplier, overrides)
      return { service: s, base, ...sim }
    })
  }, [terms, filteredServices, cityMultiplier, overrides])

  type CatalogRow = (typeof catalogRows)[number]

  // Sort + slice on the parent side because we drive `StandardTable` in fully
  // controlled mode (its built-in pagination doesn't honour external `page`
  // when defaults collide, so doing it here is the reliable path).
  const sortedRows = useMemo(() => {
    if (!sortBy) return catalogRows
    const getVal = (r: CatalogRow): string | number => {
      switch (sortBy) {
        case 'name':
          return r.service.name.toLowerCase()
        case 'category':
          return (r.service.category || '').toLowerCase()
        case 'base':
          return r.base
        case 'customerPays':
          return r.customerPays
        case 'commission':
          return r.commissionPercent
        case 'payout':
          return r.providerPayout
        case 'fees':
          return r.feesSubtotal
        case 'gateway':
          return r.gatewayFee
        case 'netProfit':
          return r.netProfit
        case 'margin':
          return r.marginPercent
        default:
          return 0
      }
    }
    return [...catalogRows].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va < vb) return sortOrder === 'asc' ? -1 : 1
      if (va > vb) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [catalogRows, sortBy, sortOrder])

  // Reset pagination whenever the filtered row set shrinks below the current
  // page — otherwise the table would render empty on the last page.
  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(sortedRows.length / rowsPerPage) - 1)
    if (page > lastPage) setPage(lastPage)
  }, [sortedRows.length, rowsPerPage, page])

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage
    return sortedRows.slice(start, start + rowsPerPage)
  }, [sortedRows, page, rowsPerPage])

  const catalogColumns: StandardTableColumn<CatalogRow>[] = [
    {
      id: 'name',
      label: 'Service',
      sortable: true,
      valueGetter: (r) => r.service.name,
      render: (_, r) => (
        <div className="min-w-[180px]">
          <div className="font-medium leading-tight">{r.service.name}</div>
          <div className="text-caption-sm text-muted-foreground">
            {r.service.category}
            {r.service.subcategory ? ` · ${r.service.subcategory}` : ''}
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      valueGetter: (r) => r.service.category,
      render: (_, r) => r.service.category || '—',
    },
    {
      id: 'base',
      label: 'Base price',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.base,
      render: (_, r) => formatMoney(r.base),
    },
    {
      id: 'customerPays',
      label: 'Customer pays',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.customerPays,
      render: (_, r) => (
        <BreakdownCell
          value={r.customerPays}
          title="Customer pays — checkout total"
          rows={[
            ['Service charges', r.serviceAmount],
            ['Visiting / inspection fee', r.visitingFee],
            ['Platform fee', r.platformFee],
            ['Convenience fee', r.convenienceFee],
            ['GST on fees (pass-through)', r.gstOnFees],
          ]}
          total={['Customer pays', r.customerPays]}
        />
      ),
    },
    {
      id: 'commission',
      label: 'Commission',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.commissionPercent,
      render: (_, r) => `${r.commissionPercent.toFixed(1)}%`,
    },
    {
      id: 'payout',
      label: 'Provider payout',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.providerPayout,
      render: (_, r) => formatMoney(r.providerPayout),
    },
    {
      id: 'fees',
      label: 'Add-on fees',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.feesSubtotal,
      render: (_, r) => (
        <BreakdownCell
          value={r.feesSubtotal}
          title="Add-on fees — platform revenue lines"
          rows={[
            ['Visiting / inspection fee', r.visitingFee],
            ['Platform fee', r.platformFee],
            ['Convenience fee', r.convenienceFee],
          ]}
          total={['Add-on fees', r.feesSubtotal]}
          footer="GST is excluded — it's collected on top and remitted to govt."
        />
      ),
    },
    {
      id: 'gateway',
      label: 'Gateway',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.gatewayFee,
      render: (_, r) => formatMoney(r.gatewayFee),
    },
    {
      id: 'netProfit',
      label: 'Net profit',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.netProfit,
      render: (_, r) => (
        <span className={r.netProfit < 0 ? 'text-destructive' : 'font-medium'}>
          {formatMoney(r.netProfit)}
        </span>
      ),
    },
    {
      id: 'margin',
      label: 'Margin %',
      align: 'right',
      sortable: true,
      valueGetter: (r) => r.marginPercent,
      render: (_, r) => <MarginBadge value={r.marginPercent} />,
    },
  ]

  const exportCatalog = () => {
    const header = [
      'Service',
      'Category',
      'Subcategory',
      'Base',
      'Service amount (after city ×)',
      'Visiting fee',
      'Platform fee',
      'Convenience fee',
      'GST on fees',
      'Customer pays',
      'Commission %',
      'Commission ₹',
      'Provider payout',
      'Platform revenue',
      'Gateway',
      'Support',
      'Refund reserve',
      'Marketing',
      'Net profit',
      'Margin %',
    ]
    // Export the full filtered+sorted set, not just the current page — that's
    // the founder's mental model when they pull this into a spreadsheet.
    const rows = catalogRows.map((r) => [
      r.service.name,
      r.service.category ?? '',
      r.service.subcategory ?? '',
      String(r.base),
      String(r.serviceAmount),
      String(r.visitingFee),
      String(r.platformFee),
      String(r.convenienceFee),
      String(r.gstOnFees),
      String(r.customerPays),
      String(r.commissionPercent),
      String(r.commissionAmount),
      String(r.providerPayout),
      String(r.platformRevenue),
      String(r.gatewayFee),
      String(r.supportCost),
      String(r.refundReserve),
      String(r.marketingAllocation),
      String(r.netProfit),
      String(r.marginPercent.toFixed(2)),
    ])
    downloadCsv('founder-pricing-catalog.csv', [header, ...rows])
  }

  if (loading) return <FounderLoading label="Loading pricing simulator…" />
  if (!terms) return <FounderError message={err ?? 'Commercial terms unavailable'} onRetry={() => void load()} />

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-6">
      {err && <FounderError message={err} onRetry={() => void load()} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label>City multiplier</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default">Default (1×)</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.priceMultiplier}×)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/operations/commercial/terms">
              <Settings2 className="mr-1 h-3.5 w-3.5" />
              Edit slabs, fees &amp; cost levers
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ticket">
        <TabsList>
          <TabsTrigger value="ticket">Ad-hoc ticket</TabsTrigger>
          <TabsTrigger value="catalog">Service catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="ticket" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket input</CardTitle>
                <CardDescription>Slab commission auto-applies from commercial terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sim-price">Service charges (₹, pre-fees)</Label>
                  <Input
                    id="sim-price"
                    type="number"
                    min={0}
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                  />
                  <p className="text-caption-sm text-muted-foreground">
                    Base price before city multiplier and add-on fees. City × applies first, then commission slab.
                  </p>
                </div>
                <details className="rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    What-if overrides (session only — leave blank to use Operations terms)
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ['commissionPercent', 'Commission %'],
                        ['paymentProcessingFeePercent', 'Gateway % (on customer pays)'],
                        ['visitingFeeFixed', 'Visiting fee (₹)'],
                        ['platformFeeFixed', 'Platform fee (₹)'],
                        ['convenienceFeePercent', 'Convenience %'],
                        ['convenienceFeeFixed', 'Convenience flat (₹)'],
                        ['gstPercentOnFees', 'GST on fees %'],
                        ['supportCostPercent', 'Support %'],
                        ['refundReservePercent', 'Refund reserve %'],
                        ['marketingAllocationPercent', 'Marketing %'],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-caption-sm">{label}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Default"
                          value={overrides[key] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            setOverrides((o) => ({
                              ...o,
                              [key]: v === '' ? undefined : Number(v),
                            }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>

            {adHoc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Breakdown</CardTitle>
                  <CardDescription>
                    Service {formatMoney(adHoc.serviceAmount)} · Commission {adHoc.commissionPercent}% ·{' '}
                    Margin <MarginBadge value={adHoc.marginPercent} />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer side — what shows up on checkout. */}
                  <BreakdownGroup
                    title="Customer-facing (checkout summary)"
                    rows={[
                      ['Service charges', formatMoney(adHoc.serviceAmount)],
                      ['Visiting / inspection fee', formatMoney(adHoc.visitingFee)],
                      ['Platform fee', formatMoney(adHoc.platformFee)],
                      ['Convenience fee', formatMoney(adHoc.convenienceFee)],
                      ['GST on fees (pass-through)', formatMoney(adHoc.gstOnFees)],
                      ['Customer pays', formatMoney(adHoc.customerPays), true],
                    ]}
                  />

                  {/* Platform side — where revenue comes from + where it goes. */}
                  <BreakdownGroup
                    title="Platform economics"
                    rows={[
                      ['Provider payout (service − commission)', formatMoney(adHoc.providerPayout)],
                      ['Commission retained', formatMoney(adHoc.commissionAmount)],
                      ['+ Add-on fees retained', formatMoney(adHoc.feesSubtotal)],
                      ['Platform revenue', formatMoney(adHoc.platformRevenue), true],
                      ['− Gateway cost', formatMoney(adHoc.gatewayFee)],
                      ['− Support cost', formatMoney(adHoc.supportCost)],
                      ['− Refund reserve', formatMoney(adHoc.refundReserve)],
                      ['− Marketing allocation', formatMoney(adHoc.marketingAllocation)],
                      ['Net profit', formatMoney(adHoc.netProfit), true],
                    ]}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          {/* Compact formula explainer — makes the column structure obvious
              before the user starts hovering. */}
          <FormulaCard />

          {/* Toolbar: category filter on the left, search + export on the right. */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-caption-sm flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Category
                </Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All categories ({services.length})</SelectItem>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-caption-sm text-muted-foreground self-end pb-2">
                Showing {catalogRows.length.toLocaleString()} of {services.length.toLocaleString()} services
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={exportCatalog}>
              <Download className="mr-1 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>

          <StandardTable<CatalogRow>
            columns={catalogColumns}
            data={pagedRows}
            getRowId={(r) => r.service.id}
            emptyMessage={
              services.length === 0
                ? 'No published platform services.'
                : 'No services match the filter.'
            }
            emptyDescription={
              services.length > 0 && catalogRows.length === 0
                ? 'Adjust the category filter or clear the search to see more rows.'
                : undefined
            }
            searchPlaceholder="Search service, category, subcategory…"
            searchControlled
            searchValue={searchText}
            onSearchChange={setSearchText}
            sortControlled
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(by, order) => {
              setSortBy(by)
              setSortOrder(order)
              setPage(0)
            }}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={sortedRows.length}
            onPageChange={setPage}
            onRowsPerPageChange={(n) => {
              setRowsPerPage(n)
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            stickyHeader
          />
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  )
}

/* ─────────────────── helpers ─────────────────── */

/**
 * Inline number cell with a hover tooltip that itemises the components.
 * Used for "Customer pays" and "Add-on fees" — both are derived sums and the
 * founder needs to see the inputs without leaving the table.
 */
function BreakdownCell({
  value,
  title,
  rows,
  total,
  footer,
}: {
  value: number
  title: string
  rows: Array<[label: string, amount: number]>
  total: [label: string, amount: number]
  footer?: string
}) {
  const visibleRows = rows.filter(([, amt]) => amt > 0)
  // If every component is zero, fall back to the value with no tooltip — no
  // point in showing "0 + 0 + 0 = 0" on a low-ticket service.
  if (visibleRows.length === 0) {
    return <span className="tabular-nums">{formatMoney(value)}</span>
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/40 tabular-nums hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={`${title}: tap for breakdown`}
        >
          {formatMoney(value)}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[280px] p-0">
        <div className="border-b border-on-ink/15 px-3 py-2 text-caption-sm font-semibold uppercase tracking-wide text-on-ink/80">
          {title}
        </div>
        <dl className="space-y-1 px-3 py-2 text-caption-md">
          {visibleRows.map(([label, amt]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-on-ink/75">{label}</dt>
              <dd className="tabular-nums text-on-ink">{formatMoney(amt)}</dd>
            </div>
          ))}
          <div className="mt-1 flex justify-between gap-4 border-t border-on-ink/15 pt-1 font-semibold">
            <dt>{total[0]}</dt>
            <dd className="tabular-nums">{formatMoney(total[1])}</dd>
          </div>
        </dl>
        {footer && (
          <p className="border-t border-on-ink/15 px-3 py-2 text-caption-sm text-on-ink/65">
            {footer}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Visual cheat-sheet that lives above the catalog table.
 * Keeps the formula 1-glance for new finance hires; deliberately concise.
 */
function FormulaCard() {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-caption-sm leading-relaxed text-muted-foreground">
      <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
        <Info className="h-3.5 w-3.5" />
        How customer-pays and add-on fees are built
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        <div>
          <span className="font-medium text-foreground">Add-on fees</span> ={' '}
          <span className="tabular-nums">visiting + platform + convenience</span>
        </div>
        <div>
          <span className="font-medium text-foreground">Customer pays</span> ={' '}
          <span className="tabular-nums">service + add-on fees + GST on fees</span>
        </div>
        <div>
          <span className="font-medium text-foreground">Provider payout</span> ={' '}
          <span className="tabular-nums">service − commission</span> · platform keeps 100% of add-ons
        </div>
        <div>
          <span className="font-medium text-foreground">Margin %</span> ={' '}
          <span className="tabular-nums">net profit ÷ customer pays</span>
        </div>
      </div>
      <p className="mt-1.5 text-caption-sm">
        Hover the dashed totals in the table to see each row's actual breakdown.
      </p>
    </div>
  )
}

/**
 * Two-column dl group used by the ad-hoc breakdown. Final row in each group is
 * the subtotal (bold + top border) — mirrors how invoices are presented.
 */
function BreakdownGroup({
  title,
  rows,
}: {
  title: string
  rows: Array<[label: string, value: string, isTotal?: boolean]>
}) {
  return (
    <div>
      <div className="mb-1 text-caption-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <dl className="grid gap-1 text-sm">
        {rows.map(([label, value, isTotal]) => (
          <div
            key={label}
            className={
              isTotal
                ? 'flex justify-between border-t border-border pt-1 font-semibold'
                : 'flex justify-between border-b border-border/60 py-1'
            }
          >
            <dt className={isTotal ? 'text-foreground' : 'text-muted-foreground'}>{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Sort the catalog rows on the page side because we drive `sortControlled` —
// `StandardTable` won't sort when controlled (it expects parent-supplied data).
PricingSimulatorPage.displayName = 'PricingSimulatorPage'
