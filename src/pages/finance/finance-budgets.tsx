import React, { useCallback, useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { FinanceService } from '../../services/api/finance.service'
import type { FinanceBudgetLine, FinanceBudgetVariance, FinanceExpenseCategory } from '../../types/finance.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export function FinanceBudgetsPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [categories, setCategories] = useState<FinanceExpenseCategory[]>([])
  const [lines, setLines] = useState<FinanceBudgetLine[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [variance, setVariance] = useState<FinanceBudgetVariance | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [c, b, v] = await Promise.all([
        FinanceService.listCategories(),
        FinanceService.listBudgetLines(year, month),
        FinanceService.getBudgetVariance(year, month),
      ])
      setCategories(c.data)
      setLines(b.data)
      setVariance(v.data)
      const next: Record<string, string> = {}
      for (const row of b.data) {
        const cid = typeof row.categoryId === 'object' ? row.categoryId.id : row.categoryId
        next[cid] = String(row.amount)
      }
      setDraft(next)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    void load()
  }, [load])

  const amountForCategory = (catId: string) => draft[catId] ?? ''

  const saveLine = async (categoryId: string) => {
    const raw = draft[categoryId]
    const amount = parseFloat(raw)
    if (Number.isNaN(amount) || amount < 0) {
      setErr('Enter a valid non-negative amount')
      return
    }
    setErr(null)
    try {
      await FinanceService.upsertBudgetLine({ year, month, categoryId, amount, currency: 'INR' })
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-lg">Operating budgets</CardTitle>
          <CardDescription>Plan by category and month. Actuals roll up from approved and paid expenses.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Year</label>
            <Input
              className="w-24"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Month</label>
            <Input
              className="w-20"
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Math.min(12, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {err && (
          <div role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {err}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budget ({year}-{String(month).padStart(2, '0')})</TableHead>
                {canManage ? <TableHead className="w-[120px]" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const existing = lines.find((l) => {
                  const id = typeof l.categoryId === 'object' ? l.categoryId.id : l.categoryId
                  return id === c.id
                })
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      {c.glHint ? <div className="text-xs text-muted-foreground">{c.glHint}</div> : null}
                      {c.isSystem ? (
                        <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          system
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      {canManage ? (
                        <Input
                          className="ml-auto max-w-[140px] text-right tabular-nums"
                          inputMode="decimal"
                          value={amountForCategory(c.id)}
                          placeholder={existing ? String(existing.amount) : '0'}
                          onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                        />
                      ) : (
                        <span className="tabular-nums font-medium">
                          {existing ? formatMoney(existing.amount, existing.currency) : '—'}
                        </span>
                      )}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <Button type="button" size="sm" variant="secondary" onClick={() => void saveLine(c.id)}>
                          <Save className="mr-1 h-3.5 w-3.5" />
                          Save
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {variance && variance.rows.length > 0 && (
          <div className="mt-8 space-y-2">
            <h3 className="text-sm font-semibold">Budget vs actual ({year}-{String(month).padStart(2, '0')})</h3>
            <p className="text-xs text-muted-foreground">
              Actuals include approved and paid expenses for the calendar month (amount + tax).
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variance.rows.map((r) => (
                  <TableRow key={r.categoryId}>
                    <TableCell>
                      <div className="font-medium">{r.categoryName}</div>
                      {r.categoryCode ? (
                        <div className="text-xs text-muted-foreground">{r.categoryCode}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.budget, r.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.actual, r.currency)}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-medium ${r.variance < 0 ? 'text-destructive' : ''}`}
                    >
                      {formatMoney(r.variance, r.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.variancePct != null ? `${(r.variancePct * 100).toFixed(1)}%` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(variance.totals.budget, variance.rows[0]?.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(variance.totals.actual, variance.rows[0]?.currency)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${variance.totals.variance < 0 ? 'text-destructive' : ''}`}
                  >
                    {formatMoney(variance.totals.variance, variance.rows[0]?.currency)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
