import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Plus, Search } from 'lucide-react'
import { AmcService } from '../../services/api/amc.service'
import { usersService } from '../../services/api/users.service'
import type { User } from '../../services/api/users.service'
import type { AmcContract, AmcContractStatus } from '../../types/amc.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Pagination } from '../../components/common/Pagination'
import { cn } from '../../lib/utils'

const CATEGORY_PRESETS = [
  'AC servicing',
  'RO / Water purifier',
  'Plumbing',
  'Electrical',
  'Appliances',
  'Deep cleaning',
  'Pest control',
  'General handyman',
] as const

const STATUS_TAB: Array<{ value: 'all' | AmcContractStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'renewed', label: 'Renewed' },
]

function statusBadgeVariant(st: AmcContractStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (st === 'active') return 'default'
  if (st === 'draft') return 'secondary'
  if (st === 'expired' || st === 'cancelled') return 'destructive'
  return 'outline'
}

export function AmcContractsPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_amc')
  const navigate = useNavigate()

  const [tab, setTab] = useState<'all' | AmcContractStatus>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [rows, setRows] = useState<AmcContract[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [custQuery, setCustQuery] = useState('')
  const [custHits, setCustHits] = useState<User[]>([])
  const [custLoading, setCustLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [form, setForm] = useState({
    planName: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    totalAmount: '',
    visitsIncluded: '4',
    status: 'draft' as AmcContractStatus,
    line1: '',
    city: '',
    state: '',
    pincode: '',
    categories: [] as string[],
  })

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await AmcService.listContracts({
        page,
        limit,
        status: tab === 'all' ? undefined : tab,
        search: debouncedSearch || undefined,
      })
      setRows(res.data.contracts)
      setTotal(res.data.pagination.total)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }, [page, limit, tab, debouncedSearch])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [tab, debouncedSearch])

  useEffect(() => {
    if (!dialogOpen || custQuery.trim().length < 2) {
      setCustHits([])
      return
    }
    let cancelled = false
    setCustLoading(true)
    void usersService
      .getUsers({
        scope: 'directory',
        user_type: 'customer',
        search: custQuery.trim(),
        limit: 15,
        page: 1,
      })
      .then((r) => {
        if (!cancelled) setCustHits(r.users)
      })
      .catch(() => {
        if (!cancelled) setCustHits([])
      })
      .finally(() => {
        if (!cancelled) setCustLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [custQuery, dialogOpen])

  const openCreate = () => {
    setSelectedCustomer(null)
    setCustQuery('')
    setCustHits([])
    setForm({
      planName: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      totalAmount: '',
      visitsIncluded: '4',
      status: 'draft',
      line1: '',
      city: '',
      state: '',
      pincode: '',
      categories: [...CATEGORY_PRESETS.slice(0, 3)],
    })
    setDialogOpen(true)
  }

  const toggleCategory = (c: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c],
    }))
  }

  const submitCreate = async () => {
    if (!selectedCustomer) {
      setErr('Select a customer')
      return
    }
    const totalAmount = parseFloat(form.totalAmount)
    const visitsIncluded = parseInt(form.visitsIncluded, 10)
    if (!form.planName.trim() || Number.isNaN(totalAmount) || totalAmount < 0) {
      setErr('Plan name and valid total amount are required')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await AmcService.createContract({
        customerId: selectedCustomer.id,
        planName: form.planName.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        totalAmount,
        visitsIncluded: Number.isNaN(visitsIncluded) ? 0 : Math.max(0, visitsIncluded),
        coveredCategories: form.categories,
        status: form.status,
        propertyAddress: {
          line1: form.line1.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
        },
      })
      setDialogOpen(false)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="h-auto flex-wrap justify-start">
                {STATUS_TAB.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search contract #, customer, plan…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {canManage ? (
                <Button type="button" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  New AMC
                </Button>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-x-auto rounded-md border">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contract</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No contracts match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow
                      key={r._id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => navigate(`/amc/contracts/${r._id}`)}
                    >
                      <TableCell className="font-mono text-sm font-bold">{r.contractNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.customerName || '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.customerPhone || ''}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-2 text-sm">{r.planName}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatMoney(r.totalAmount, r.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {r.visitsUsed}/{r.visitsIncluded}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(r.status)} className="capitalize">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/amc/contracts/${r._id}`}
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > limit ? (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New AMC contract</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label>Customer</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ')} ·{' '}
                    {selectedCustomer.phone || selectedCustomer.email}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Type name, phone, or email (customers)"
                    value={custQuery}
                    onChange={(e) => setCustQuery(e.target.value)}
                  />
                  {custLoading ? (
                    <p className="text-xs text-muted-foreground">Searching…</p>
                  ) : custHits.length > 0 ? (
                    <ul className="max-h-40 overflow-auto rounded-md border text-sm">
                      {custHits.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
                            onClick={() => {
                              setSelectedCustomer(u)
                              setCustHits([])
                              setCustQuery('')
                            }}
                          >
                            <span className="font-medium">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{u.phone || u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : custQuery.trim().length >= 2 ? (
                    <p className="text-xs text-muted-foreground">No customers found.</p>
                  ) : null}
                </>
              )}
            </div>
            <div className="grid gap-1">
              <Label>Plan name</Label>
              <Input
                placeholder="e.g. RO + AC combo AMC – Gold"
                value={form.planName}
                onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Start</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label>End</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Total (INR)</Label>
                <Input
                  inputMode="decimal"
                  value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Visits included</Label>
                <Input
                  inputMode="numeric"
                  value={form.visitsIncluded}
                  onChange={(e) => setForm((f) => ({ ...f, visitsIncluded: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Initial status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as AmcContractStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Covered categories</Label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                      form.categories.includes(c)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground">Service address (optional)</Label>
              <Input
                placeholder="Flat / street"
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
                <Input
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
                <Input
                  placeholder="PIN"
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving || !selectedCustomer} onClick={() => void submitCreate()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
