import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2, MoreHorizontal, Download } from 'lucide-react'
import { FinanceService } from '../../services/api/finance.service'
import type { FinanceExpense, FinanceExpenseCategory, FinanceVendor, FinanceCashAccount } from '../../types/finance.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { StandardTable, type StandardTableColumn } from '../../components/common'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

function refName(v: unknown): string {
  if (v && typeof v === 'object' && 'name' in (v as object)) return String((v as { name?: string }).name ?? '—')
  return '—'
}

function refId(v: unknown): string | null {
  if (v && typeof v === 'object' && 'id' in (v as object)) return String((v as { id: string }).id)
  if (typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v)) return v
  return null
}

const OID = /^[a-f0-9]{24}$/i

function expenseTotal(row: FinanceExpense) {
  return (row.amount ?? 0) + (row.taxAmount ?? 0)
}

const STATUS_OPTIONS = [
  'all',
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'paid',
  'void',
] as const

export function FinanceExpensesPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')
  const canView = checkPermission('view_finance')

  const [rows, setRows] = useState<FinanceExpense[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [categories, setCategories] = useState<FinanceExpenseCategory[]>([])
  const [vendors, setVendors] = useState<FinanceVendor[]>([])
  const [accounts, setAccounts] = useState<FinanceCashAccount[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    taxAmount: '0',
    expenseDate: new Date().toISOString().slice(0, 10),
    vendorInvoiceNumber: '',
    dueDate: '',
    categoryId: '',
    vendorId: '',
    cashAccountId: '',
    status: 'draft' as FinanceExpense['status'],
    paymentMethod: 'bank_transfer',
    description: '',
    bookingId: '',
    invoiceId: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const params: Record<string, string | number | undefined> = { page, limit }
      if (status !== 'all') params.status = status
      if (search.trim()) params.search = search.trim()
      const res = await FinanceService.listExpenses(params)
      setRows(res.data)
      const p = res.meta?.pagination as { total?: number } | undefined
      setTotal(p?.total ?? res.data.length)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [page, limit, status, search])

  useEffect(() => {
    void (async () => {
      try {
        const [c, v, a] = await Promise.all([
          FinanceService.listCategories(),
          FinanceService.listVendors(true),
          FinanceService.listAccounts(),
        ])
        setCategories(c.data)
        setVendors(v.data)
        setAccounts(a.data)
      } catch {
        /* optional */
      }
    })()
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [status, search])

  const activeCategories = categories.filter((c) => c.isActive !== false)
  const activeAccounts = accounts.filter((a) => a.isActive !== false)

  const exportCsv = async () => {
    const now = new Date()
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const to = new Date()
    setExporting(true)
    setErr(null)
    try {
      await FinanceService.downloadExpensesCsv(from.toISOString(), to.toISOString())
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const openCreate = () => {
    setForm({
      title: '',
      amount: '',
      taxAmount: '0',
      expenseDate: new Date().toISOString().slice(0, 10),
      vendorInvoiceNumber: '',
      dueDate: '',
      categoryId: activeCategories[0]?.id ?? '',
      vendorId: '',
      cashAccountId: activeAccounts[0]?.id ?? '',
      status: 'draft',
      paymentMethod: 'bank_transfer',
      description: '',
      bookingId: '',
      invoiceId: '',
    })
    setDialogOpen(true)
  }

  const submitCreate = async () => {
    setSaving(true)
    try {
      const amount = parseFloat(form.amount)
      if (Number.isNaN(amount) || amount < 0) throw new Error('Enter a valid amount')
      const taxAmount = parseFloat(form.taxAmount) || 0
      await FinanceService.createExpense({
        title: form.title.trim(),
        amount,
        taxAmount,
        currency: 'INR',
        expenseDate: new Date(form.expenseDate).toISOString(),
        ...(form.vendorInvoiceNumber.trim()
          ? { vendorInvoiceNumber: form.vendorInvoiceNumber.trim().slice(0, 80) }
          : {}),
        ...(form.dueDate ? { dueDate: new Date(`${form.dueDate}T12:00:00.000Z`).toISOString() } : {}),
        categoryId: form.categoryId || undefined,
        vendorId: form.vendorId || undefined,
        cashAccountId: form.cashAccountId || undefined,
        status: form.status,
        paymentMethod: form.paymentMethod,
        description: form.description.trim() || undefined,
        tags: [],
        billable: false,
        ...(form.bookingId.trim() && OID.test(form.bookingId.trim())
          ? { bookingId: form.bookingId.trim() }
          : {}),
        ...(form.invoiceId.trim() && OID.test(form.invoiceId.trim())
          ? { invoiceId: form.invoiceId.trim() }
          : {}),
      })
      setDialogOpen(false)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const act = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn()
      void load()
    } catch (e: unknown) {
      setErr(`${label}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  const columns: StandardTableColumn<FinanceExpense>[] = [
      {
        id: 'expenseDate',
        label: 'Date',
        sortable: false,
        render: (_, row) => (
          <span className="tabular-nums text-muted-foreground">
            {row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : '—'}
          </span>
        ),
      },
      { id: 'title', label: 'Title', render: (_, row) => <span className="font-medium">{row.title}</span> },
      {
        id: 'category',
        label: 'Category',
        render: (_, row) => <span className="text-muted-foreground">{refName(row.categoryId)}</span>,
      },
      {
        id: 'vendor',
        label: 'Vendor',
        render: (_, row) => <span className="text-muted-foreground">{refName(row.vendorId)}</span>,
      },
      {
        id: 'dueDate',
        label: 'Due',
        render: (_, row) => (
          <span className="tabular-nums text-muted-foreground text-xs">
            {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}
          </span>
        ),
      },
      {
        id: 'booking',
        label: 'Booking',
        render: (_, row) => {
          const id = refId(row.bookingId)
          return id ? (
            <Link to={`/bookings/${id}`} className="font-mono text-xs text-primary hover:underline">
              {id.slice(0, 8)}…
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        id: 'invoice',
        label: 'Invoice',
        render: (_, row) => {
          const id = refId(row.invoiceId)
          return id ? (
            <span className="font-mono text-xs text-muted-foreground" title={id}>
              {id.slice(0, 8)}…
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        id: 'total',
        label: 'Total',
        align: 'right',
        render: (_, row) => (
          <span className="tabular-nums font-medium">{formatMoney(expenseTotal(row), row.currency)}</span>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        render: (_, row) => (
          <Badge variant={row.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
            {row.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        label: '',
        align: 'right',
        render: (_, row) =>
          canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {row.status === 'draft' || row.status === 'pending_approval' ? (
                  <DropdownMenuItem onClick={() => act(() => FinanceService.approveExpense(row.id), 'Approve')}>
                    Approve
                  </DropdownMenuItem>
                ) : null}
                {row.status !== 'rejected' && row.status !== 'void' && row.status !== 'paid' ? (
                  <DropdownMenuItem
                    onClick={() => act(() => FinanceService.rejectExpense(row.id, 'Rejected from finance console'), 'Reject')}
                  >
                    Reject
                  </DropdownMenuItem>
                ) : null}
                {row.status === 'approved' ? (
                  <DropdownMenuItem onClick={() => act(() => FinanceService.markPaid(row.id), 'Mark paid')}>
                    Mark paid
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => act(() => FinanceService.voidExpense(row.id), 'Void')}>Void</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
  ]

  return (
    <div className="space-y-4">
      {err && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <StandardTable<FinanceExpense>
        title="Expenses"
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        loading={loading}
        error={null}
        searchPlaceholder="Search title, ref, description…"
        searchValue={search}
        onSearchChange={setSearch}
        searchControlled
        page={page - 1}
        rowsPerPage={limit}
        totalCount={total}
        onPageChange={(p) => setPage(p + 1)}
        toolbarRight={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canView ? (
              <Button type="button" size="sm" variant="outline" onClick={() => void exportCsv()} disabled={exporting}>
                <Download className="mr-1 h-4 w-4" />
                {exporting ? 'Export…' : 'Export CSV (MTD)'}
              </Button>
            ) : null}
            {canManage ? (
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                New expense
              </Button>
            ) : null}
          </div>
        }
        emptyMessage="No expenses yet"
        emptyDescription="Record operating spend with categories, vendors, and approval workflow."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New expense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fe-title">Title</Label>
              <Input
                id="fe-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. AWS invoice — March"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fe-amount">Amount</Label>
                <Input
                  id="fe-amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fe-tax">Tax</Label>
                <Input
                  id="fe-tax"
                  inputMode="decimal"
                  value={form.taxAmount}
                  onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fe-date">Expense date</Label>
              <Input
                id="fe-date"
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fe-inv">Vendor invoice #</Label>
                <Input
                  id="fe-inv"
                  value={form.vendorInvoiceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, vendorInvoiceNumber: e.target.value }))}
                  placeholder="Optional"
                  maxLength={80}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fe-due">Due date</Label>
                <Input
                  id="fe-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cash / bank account</Label>
              <Select value={form.cashAccountId} onValueChange={(v) => setForm((f) => ({ ...f, cashAccountId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vendor (optional)</Label>
              <Select
                value={form.vendorId || '__none__'}
                onValueChange={(v) => setForm((f) => ({ ...f, vendorId: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fe-booking">Booking ID (optional)</Label>
                <Input
                  id="fe-booking"
                  className="font-mono text-xs"
                  placeholder="24-char Mongo ObjectId"
                  value={form.bookingId}
                  onChange={(e) => setForm((f) => ({ ...f, bookingId: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fe-invoice">Invoice ID (optional)</Label>
                <Input
                  id="fe-invoice"
                  className="font-mono text-xs"
                  placeholder="24-char Mongo ObjectId"
                  value={form.invoiceId}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Initial status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as FinanceExpense['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending approval</SelectItem>
                  <SelectItem value="approved">Approved (skip queue)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fe-desc">Notes</Label>
              <Textarea
                id="fe-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitCreate()} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
