import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bus,
  Coffee,
  Loader2,
  Plus,
  Save,
  Building2,
  Cloud,
  Server,
  Smartphone,
  Wifi,
  Zap,
  Receipt,
  CalendarClock,
} from 'lucide-react'
import { FinanceService } from '../../services/api/finance.service'
import type {
  FinanceBudgetVariance,
  FinanceCashAccount,
  FinanceExpense,
  FinanceExpenseCategory,
  FinanceRecurringExpense,
} from '../../types/finance.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import {
  OPERATING_EXPENSE_PRESETS,
  expenseCategoryId,
  filterOperatingExpensesForMonth,
  presetByCode,
  presetForCategory,
  sumExpenseAmount,
  type OperatingCadence,
  type OperatingExpensePreset,
} from '../../lib/financeOperatingPresets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Checkbox } from '../../components/ui/checkbox'
import { cn } from '../../lib/utils'

function cadenceIcon(p: OperatingExpensePreset) {
  switch (p.id) {
    case 'tea':
      return Coffee
    case 'travel':
      return Bus
    case 'internet':
      return Wifi
    case 'mobile':
      return Smartphone
    case 'rent':
      return Building2
    case 'aws':
      return Server
    case 'cloud':
      return Cloud
    case 'utilities':
      return Zap
    default:
      return Receipt
  }
}

export function FinanceOperatingHubPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [categories, setCategories] = useState<FinanceExpenseCategory[]>([])
  const [accounts, setAccounts] = useState<FinanceCashAccount[]>([])
  const [expenses, setExpenses] = useState<FinanceExpense[]>([])
  const [recurring, setRecurring] = useState<FinanceRecurringExpense[]>([])
  const [variance, setVariance] = useState<FinanceBudgetVariance | null>(null)
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingExpense, setSavingExpense] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [quickCadence, setQuickCadence] = useState<OperatingCadence>('daily')
  const [quickForm, setQuickForm] = useState({
    presetCode: 'OPS-TEA',
    expenseDate: new Date().toISOString().slice(0, 10),
    amount: '',
    note: '',
    paymentMethod: 'cash',
    markPaid: true,
  })

  const [recDialogOpen, setRecDialogOpen] = useState(false)
  const [recForm, setRecForm] = useState({
    presetCode: 'OPS-INTERNET',
    title: '',
    amount: '',
    dayOfMonth: '5',
    nextRunAt: new Date().toISOString().slice(0, 10),
    cashAccountId: '',
  })
  const [savingRec, setSavingRec] = useState(false)

  const presetsForCadence = useMemo(
    () => OPERATING_EXPENSE_PRESETS.filter((p) => p.cadence === quickCadence),
    [quickCadence],
  )

  useEffect(() => {
    const first = presetsForCadence[0]?.code
    if (first && !presetsForCadence.some((p) => p.code === quickForm.presetCode)) {
      setQuickForm((f) => ({ ...f, presetCode: first }))
    }
  }, [quickCadence, presetsForCadence, quickForm.presetCode])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      let cats = (await FinanceService.listCategories()).data

      if (canManage) {
        const codes = new Set(cats.map((c) => c.code).filter(Boolean))
        for (const p of OPERATING_EXPENSE_PRESETS) {
          if (codes.has(p.code)) continue
          try {
            await FinanceService.createCategory({
              name: p.name,
              code: p.code,
              description: p.description,
              isActive: true,
            })
            codes.add(p.code)
          } catch {
            /* duplicate race or validation — refresh below */
          }
        }
        cats = (await FinanceService.listCategories()).data
      }

      const [expRes, recRes, varRes, accRes] = await Promise.all([
        FinanceService.listExpenses({ page: 1, limit: 100 }),
        FinanceService.listRecurring(false),
        FinanceService.getBudgetVariance(year, month),
        FinanceService.listAccounts(),
      ])

      const lines = (await FinanceService.listBudgetLines(year, month)).data
      const draft: Record<string, string> = {}
      for (const row of lines) {
        const cid = typeof row.categoryId === 'object' ? row.categoryId.id : row.categoryId
        draft[cid] = String(row.amount)
      }

      setCategories(cats)
      setExpenses(expRes.data)
      setRecurring(recRes.data)
      setVariance(varRes.data)
      setBudgetDraft(draft)
      setAccounts(accRes.data.filter((a) => a.isActive !== false))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load operating hub')
    } finally {
      setLoading(false)
    }
  }, [year, month, canManage])

  useEffect(() => {
    void load()
  }, [load])

  const operatingCategories = useMemo(
    () =>
      categories.filter((c) => {
        const pr = presetForCategory(c)
        return pr && c.isActive !== false
      }),
    [categories],
  )

  const monthOperatingExpenses = useMemo(
    () => filterOperatingExpensesForMonth(expenses, categories, year, month),
    [expenses, categories, year, month],
  )

  const totalsByCadence = useMemo(() => {
    let daily = 0
    let monthly = 0
    for (const e of monthOperatingExpenses) {
      const cid = expenseCategoryId(e)
      const cat = cid ? categories.find((c) => c.id === cid) : undefined
      const pr = cat ? presetForCategory(cat) : undefined
      const v = sumExpenseAmount(e)
      if (pr?.cadence === 'daily') daily += v
      else if (pr?.cadence === 'monthly') monthly += v
    }
    return { daily, monthly, combined: daily + monthly }
  }, [monthOperatingExpenses, categories])

  const operatingVarianceRows = useMemo(() => {
    if (!variance) return []
    const ids = new Set(operatingCategories.map((c) => c.id))
    return variance.rows.filter((r) => ids.has(r.categoryId))
  }, [variance, operatingCategories])

  const operatingBudgetTotal = useMemo(() => {
    let b = 0
    for (const c of operatingCategories) {
      const raw = budgetDraft[c.id]
      const n = raw != null && raw !== '' ? parseFloat(raw) : NaN
      if (!Number.isNaN(n)) b += n
    }
    return b
  }, [budgetDraft, operatingCategories])

  const operatingActualTotal = useMemo(() => {
    return operatingVarianceRows.reduce((s, r) => s + r.actual, 0)
  }, [operatingVarianceRows])

  const recurringOperating = useMemo(() => {
    const ids = new Set(operatingCategories.map((c) => c.id))
    return recurring.filter((r) => {
      const cid = typeof r.categoryId === 'object' ? r.categoryId?.id : r.categoryId
      return cid && ids.has(cid)
    })
  }, [recurring, operatingCategories])

  const submitQuickExpense = async () => {
    const preset = presetByCode(quickForm.presetCode)
    if (!preset) return
    const cat = categories.find((c) => c.code === preset.code)
    if (!cat) {
      setErr('Category not ready — refresh the page.')
      return
    }
    const amount = parseFloat(quickForm.amount)
    if (Number.isNaN(amount) || amount < 0) {
      setErr('Enter a valid amount.')
      return
    }
    const acct = accounts[0]?.id
    setSavingExpense(true)
    setErr(null)
    try {
      const titleBase = preset.titleHint
      const title =
        quickForm.note.trim().length > 0 ? `${titleBase} — ${quickForm.note.trim()}` : titleBase
      await FinanceService.createExpense({
        title,
        amount,
        taxAmount: 0,
        currency: 'INR',
        expenseDate: new Date(quickForm.expenseDate).toISOString(),
        categoryId: cat.id,
        cashAccountId: acct,
        paymentMethod: quickForm.paymentMethod,
        status: quickForm.markPaid ? 'paid' : 'pending_approval',
        tags: ['operating-hub', preset.cadence === 'daily' ? 'cadence-daily' : 'cadence-monthly'],
        billable: false,
        description: quickForm.note.trim() || undefined,
      })
      setQuickForm((f) => ({ ...f, amount: '', note: '' }))
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not save expense')
    } finally {
      setSavingExpense(false)
    }
  }

  const saveBudgetLine = async (categoryId: string) => {
    const raw = budgetDraft[categoryId]
    const amount = parseFloat(raw ?? '')
    if (Number.isNaN(amount) || amount < 0) {
      setErr('Enter a valid budget amount')
      return
    }
    setErr(null)
    try {
      await FinanceService.upsertBudgetLine({ year, month, categoryId, amount, currency: 'INR' })
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Budget save failed')
    }
  }

  const openRecDialog = (preset?: OperatingExpensePreset) => {
    const p = preset ?? presetByCode('OPS-INTERNET')!
    setRecForm({
      presetCode: p.code,
      title: p.titleHint,
      amount: '',
      dayOfMonth: '5',
      nextRunAt: new Date().toISOString().slice(0, 10),
      cashAccountId: accounts[0]?.id ?? '',
    })
    setRecDialogOpen(true)
  }

  const saveRecurring = async () => {
    const preset = presetByCode(recForm.presetCode)
    const cat = preset ? categories.find((c) => c.code === preset.code) : undefined
    const amount = parseFloat(recForm.amount)
    if (!preset || !cat || !recForm.title.trim() || Number.isNaN(amount) || amount < 0) {
      setErr('Fill title, amount, and category.')
      return
    }
    setSavingRec(true)
    setErr(null)
    try {
      await FinanceService.createRecurring({
        title: recForm.title.trim(),
        amount,
        taxAmount: 0,
        currency: 'INR',
        frequency: 'monthly',
        dayOfMonth: Math.min(28, Math.max(1, parseInt(recForm.dayOfMonth, 10) || 1)),
        dayOfWeek: 0,
        nextRunAt: new Date(recForm.nextRunAt).toISOString(),
        categoryId: cat.id,
        cashAccountId: recForm.cashAccountId || accounts[0]?.id || undefined,
        generatedExpenseStatus: 'pending_approval',
        isActive: true,
      })
      setRecDialogOpen(false)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not create template')
    } finally {
      setSavingRec(false)
    }
  }

  const monthLabel = `${year}-${String(month).padStart(2, '0')}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Operating costs</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Log variable daily spend (tea, travel) and track fixed monthly bills (rent, cloud, telecom). Budgets
            are per category for the selected month — same data as{' '}
            <Link className="text-primary underline-offset-4 hover:underline" to="/finance/budgets">
              Budgets
            </Link>{' '}
            and{' '}
            <Link className="text-primary underline-offset-4 hover:underline" to="/finance/expenses">
              Expenses
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Input
              className="h-9 w-24"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Input
              className="h-9 w-20"
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            />
          </div>
        </div>
      </div>

      {err && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading operating data…
        </div>
      ) : null}

      {!loading && operatingCategories.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Preset categories</CardTitle>
            <CardDescription>
              Operating shortcuts use finance categories with codes like <code className="text-xs">OPS-TEA</code>,{' '}
              <code className="text-xs">OPS-AWS</code>, etc. A user with{' '}
              <strong className="font-medium">manage finance</strong> can open this page once — categories are created
              automatically. Everyone else then sees budgets, logs, and recurring filtered to those lines.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loading && operatingCategories.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Coffee className="h-4 w-4" />
                  Daily-style ({monthLabel})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{formatMoney(totalsByCadence.daily, 'INR')}</p>
                <p className="text-xs text-muted-foreground">Tea, auto/bus, and other variable lines</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Monthly-style ({monthLabel})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{formatMoney(totalsByCadence.monthly, 'INR')}</p>
                <p className="text-xs text-muted-foreground">Logged bill payments &amp; subscriptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Operating budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{formatMoney(operatingBudgetTotal, 'INR')}</p>
                <p className="text-xs text-muted-foreground">Sum of preset categories below</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Actual vs budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{formatMoney(operatingActualTotal, 'INR')}</p>
                <p
                  className={cn(
                    'text-xs font-medium',
                    operatingActualTotal > operatingBudgetTotal && operatingBudgetTotal > 0
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                  )}
                >
                  {operatingBudgetTotal > 0
                    ? `${operatingActualTotal > operatingBudgetTotal ? 'Over' : 'Within'} plan vs ₹${operatingBudgetTotal.toLocaleString('en-IN')} budget`
                    : 'Set budgets per category to compare'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick log</CardTitle>
                <CardDescription>
                  One-tap style entry — tagged for this hub. Uses your first cash/bank account if none selected on
                  the main expense form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={quickCadence} onValueChange={(v) => setQuickCadence(v as OperatingCadence)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly charge</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="mt-4 space-y-3">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select
                        value={quickForm.presetCode}
                        onValueChange={(code) => setQuickForm((f) => ({ ...f, presetCode: code }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {presetsForCadence.map((p) => (
                            <SelectItem key={p.code} value={p.code}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-1">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={quickForm.expenseDate}
                          onChange={(e) => setQuickForm((f) => ({ ...f, expenseDate: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label>Amount (INR)</Label>
                        <Input
                          inputMode="decimal"
                          placeholder="0"
                          value={quickForm.amount}
                          onChange={(e) => setQuickForm((f) => ({ ...f, amount: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label>Note (optional)</Label>
                      <Input
                        placeholder="e.g. Auto to client site"
                        value={quickForm.note}
                        onChange={(e) => setQuickForm((f) => ({ ...f, note: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-1">
                        <Label>Payment</Label>
                        <Select
                          value={quickForm.paymentMethod}
                          onValueChange={(v) => setQuickForm((f) => ({ ...f, paymentMethod: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={quickForm.markPaid}
                            onCheckedChange={(c) => setQuickForm((f) => ({ ...f, markPaid: c === true }))}
                          />
                          Mark as paid
                        </label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={!canManage || savingExpense || accounts.length === 0}
                      onClick={() => void submitQuickExpense()}
                    >
                      {savingExpense ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Record expense
                    </Button>
                    {!canManage && (
                      <p className="text-xs text-muted-foreground">You need finance manage permission to log.</p>
                    )}
                    {accounts.length === 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Add a cash account under{' '}
                        <Link className="underline" to="/finance/directory">
                          Directory
                        </Link>{' '}
                        to attach payouts.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Monthly bill templates</CardTitle>
                  <CardDescription>
                    Recurring schedules post draft/pending expenses — same as{' '}
                    <Link className="text-primary underline-offset-4 hover:underline" to="/finance/recurring">
                      Recurring
                    </Link>
                    .
                  </CardDescription>
                </div>
                <Button type="button" size="sm" variant="secondary" disabled={!canManage} onClick={() => openRecDialog()}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  New template
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {OPERATING_EXPENSE_PRESETS.filter((p) => p.cadence === 'monthly').map((p) => {
                    const Ic = cadenceIcon(p)
                    return (
                      <Button
                        key={p.code}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={!canManage}
                        onClick={() => openRecDialog(p)}
                      >
                        <Ic className="h-3.5 w-3.5" />
                        {p.name}
                      </Button>
                    )
                  })}
                </div>
                {recurringOperating.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recurring rows mapped to these categories yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Next</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringOperating.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.title}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(r.amount, r.currency)}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums text-xs">
                            {r.nextRunAt ? new Date(r.nextRunAt).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flexible monthly budgets (preset categories)</CardTitle>
              <CardDescription>
                Planned spend per line for {monthLabel}. Saving updates the shared finance budget model.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    {canManage ? <TableHead className="w-[100px]" /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatingCategories.map((c) => {
                    const pr = presetForCategory(c)!
                    const vr = variance?.rows.find((row) => row.categoryId === c.id)
                    const v = vr?.variance ?? 0
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {pr.cadence}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage ? (
                            <Input
                              className="ml-auto inline-flex h-8 max-w-[120px] text-right tabular-nums"
                              inputMode="decimal"
                              placeholder="0"
                              value={budgetDraft[c.id] ?? ''}
                              onChange={(e) => setBudgetDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                            />
                          ) : (
                            <span className="tabular-nums">
                              {(() => {
                                const n = parseFloat(budgetDraft[c.id] ?? '')
                                return Number.isFinite(n) ? formatMoney(n, 'INR') : '—'
                              })()}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {vr ? formatMoney(vr.actual, vr.currency) : '—'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right tabular-nums font-medium',
                            v < 0 ? 'text-destructive' : 'text-muted-foreground',
                          )}
                        >
                          {vr ? formatMoney(v, vr.currency) : '—'}
                        </TableCell>
                        {canManage ? (
                          <TableCell className="text-right">
                            <Button type="button" size="sm" variant="ghost" onClick={() => void saveBudgetLine(c.id)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">This month — operating lines</CardTitle>
                <CardDescription>Expense rows dated in {monthLabel} with a preset category.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/finance/expenses">
                  All expenses
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {monthOperatingExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing logged yet for these categories in this month.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthOperatingExpenses
                      .slice()
                      .sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1))
                      .slice(0, 40)
                      .map((e) => {
                        const cid = expenseCategoryId(e)
                        const cat = cid ? categories.find((x) => x.id === cid) : undefined
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums text-xs">
                              {e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="font-medium">{e.title}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{cat?.name ?? '—'}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatMoney(sumExpenseAmount(e), e.currency)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {(e.status || '').replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
              {monthOperatingExpenses.length > 40 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing 40 of {monthOperatingExpenses.length}. Open Expenses for the full ledger.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={recDialogOpen} onOpenChange={setRecDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Monthly recurring template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label>Preset category</Label>
              <Select
                value={recForm.presetCode}
                onValueChange={(code) => {
                  const p = presetByCode(code)
                  setRecForm((f) => ({
                    ...f,
                    presetCode: code,
                    title: p?.titleHint ?? f.title,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATING_EXPENSE_PRESETS.filter((p) => p.cadence === 'monthly').map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Title</Label>
              <Input
                value={recForm.title}
                onChange={(e) => setRecForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Amount (INR)</Label>
                <Input
                  inputMode="decimal"
                  value={recForm.amount}
                  onChange={(e) => setRecForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Day of month</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={recForm.dayOfMonth}
                  onChange={(e) => setRecForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Next run date</Label>
              <Input
                type="date"
                value={recForm.nextRunAt}
                onChange={(e) => setRecForm((f) => ({ ...f, nextRunAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setRecDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={savingRec || !canManage} onClick={() => void saveRecurring()}>
              {savingRec ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
