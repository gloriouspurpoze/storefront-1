import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload, Sparkles, Ban, PlusCircle, Loader2, Link2 } from 'lucide-react'
import { parseCsvText } from '../../lib/csv'
import { parseBankDate, parseMoneyCell } from '../../lib/financeCsvMapping'
import { FinanceService } from '../../services/api/finance.service'
import type {
  FinanceCashAccount,
  FinanceExpense,
  FinanceStatementBatch,
  FinanceStatementLine,
} from '../../types/finance.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'

function colLabels(headers: string[]) {
  return headers.map((h, i) => ({ i, label: h || `Column ${i + 1}` }))
}

export function FinanceReconciliationPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const [accounts, setAccounts] = useState<FinanceCashAccount[]>([])
  const [batches, setBatches] = useState<FinanceStatementBatch[]>([])
  const [batchId, setBatchId] = useState<string>('')
  const [lines, setLines] = useState<FinanceStatementLine[]>([])
  const [linePage, setLinePage] = useState(1)
  const [lineTotal, setLineTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [fileName, setFileName] = useState('')
  const [importAccountId, setImportAccountId] = useState('')
  const [hasHeader, setHasHeader] = useState(true)
  const [dateCol, setDateCol] = useState('0')
  const [narrationCol, setNarrationCol] = useState('1')
  const [mode, setMode] = useState<'dual' | 'single'>('dual')
  const [debitCol, setDebitCol] = useState('2')
  const [creditCol, setCreditCol] = useState('3')
  const [amountCol, setAmountCol] = useState('2')
  const [singleOutflowPositive, setSingleOutflowPositive] = useState(true)

  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestLineId, setSuggestLineId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<FinanceExpense[]>([])

  const headers = csvRows[0] || []
  const colOpts = useMemo(() => colLabels(headers), [headers])

  const loadAccounts = useCallback(async () => {
    const r = await FinanceService.listAccounts()
    setAccounts(r.data)
    setImportAccountId((prev) => prev || r.data[0]?.id || '')
  }, [])

  const loadBatches = useCallback(async () => {
    const r = await FinanceService.listStatementBatches({ page: '1', limit: '50' })
    setBatches(r.data)
    setBatchId((prev) => prev || r.data[0]?.id || '')
  }, [])

  const loadLines = useCallback(async () => {
    if (!batchId) {
      setLines([])
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const r = await FinanceService.listStatementLines(batchId, {
        page: String(linePage),
        limit: '40',
      })
      setLines(r.data)
      const p = r.meta?.pagination as { total?: number } | undefined
      setLineTotal(p?.total ?? r.data.length)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load lines')
    } finally {
      setLoading(false)
    }
  }, [batchId, linePage])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    void loadBatches()
  }, [loadBatches])

  useEffect(() => {
    void loadLines()
  }, [loadLines])

  const onFile = async (f: File | null) => {
    if (!f) return
    setFileName(f.name)
    const text = await f.text()
    const { rows } = parseCsvText(text)
    setCsvRows(rows)
    if (rows[0]?.length) {
      setDateCol('0')
      setNarrationCol(rows[0].length > 1 ? '1' : '0')
      setDebitCol(String(Math.min(2, rows[0].length - 1)))
      setCreditCol(String(Math.min(3, rows[0].length - 1)))
      setAmountCol(String(Math.min(2, rows[0].length - 1)))
    }
  }

  const buildLinesPayload = () => {
    const start = hasHeader ? 1 : 0
    const out: Array<{
      postedAt: string
      narration: string
      amount: number
      direction: 'debit' | 'credit'
      raw?: string
    }> = []
    for (let r = start; r < csvRows.length; r++) {
      const row = csvRows[r]
      if (!row?.length) continue
      const di = parseInt(dateCol, 10)
      const ni = parseInt(narrationCol, 10)
      const dateCell = row[di] ?? ''
      const narrCell = row[ni] ?? ''
      const d = parseBankDate(dateCell)
      if (!d) continue
      let amount = 0
      let direction: 'debit' | 'credit' = 'debit'
      if (mode === 'dual') {
        const deb = parseMoneyCell(row[parseInt(debitCol, 10)] ?? '')
        const cred = parseMoneyCell(row[parseInt(creditCol, 10)] ?? '')
        if (deb > 0) {
          amount = deb
          direction = 'debit'
        } else if (cred > 0) {
          amount = cred
          direction = 'credit'
        } else continue
      } else {
        const v = parseMoneyCell(row[parseInt(amountCol, 10)] ?? '')
        if (v <= 0) continue
        amount = v
        direction = singleOutflowPositive ? 'debit' : 'credit'
      }
      out.push({
        postedAt: d.toISOString(),
        narration: narrCell || '—',
        amount,
        direction,
        raw: row.join(',').slice(0, 4000),
      })
    }
    return out
  }

  const submitImport = async () => {
    if (!canManage || !importAccountId) return
    setErr(null)
    const linesPayload = buildLinesPayload()
    if (linesPayload.length === 0) {
      setErr('No valid rows (check date column and amount columns).')
      return
    }
    try {
      await FinanceService.createStatementBatch({
        cashAccountId: importAccountId,
        fileName: fileName || 'statement.csv',
        lines: linesPayload,
      })
      setCsvRows([])
      setFileName('')
      await loadBatches()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Import failed')
    }
  }

  const openSuggest = async (lineId: string) => {
    setSuggestLineId(lineId)
    setSuggestOpen(true)
    const r = await FinanceService.statementLineSuggestions(lineId, 10)
    setSuggestions(r.data)
  }

  const linkSuggestion = async (expenseId: string) => {
    if (!suggestLineId) return
    await FinanceService.patchStatementLine(suggestLineId, {
      matchStatus: 'matched',
      matchedExpenseId: expenseId,
    })
    setSuggestOpen(false)
    void loadLines()
  }

  const ignoreLine = async (lineId: string) => {
    await FinanceService.patchStatementLine(lineId, { matchStatus: 'ignored' })
    void loadLines()
  }

  const createFromLine = async (lineId: string) => {
    await FinanceService.createExpenseFromStatementLine(lineId, {})
    void loadLines()
  }

  return (
    <div className="space-y-8">
      {err && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import statement</CardTitle>
            <CardDescription>
              Map columns from your bank export. Debits are matched to company spend; credits are stored for completeness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Account</Label>
                <Select value={importAccountId} onValueChange={setImportAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cash / bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>File</Label>
                <Input type="file" accept=".csv,.txt,.tsv" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            {csvRows.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="hdr" checked={hasHeader} onCheckedChange={(v) => setHasHeader(v === true)} />
                    <Label htmlFor="hdr">First row is header</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount layout</Label>
                    <Select value={mode} onValueChange={(v) => setMode(v as 'dual' | 'single')}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dual">Separate debit &amp; credit columns</SelectItem>
                        <SelectItem value="single">Single amount column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="grid gap-2">
                    <Label>Date column</Label>
                    <Select value={dateCol} onValueChange={setDateCol}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colOpts.map((c) => (
                          <SelectItem key={c.i} value={String(c.i)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Description / narration</Label>
                    <Select value={narrationCol} onValueChange={setNarrationCol}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colOpts.map((c) => (
                          <SelectItem key={c.i} value={String(c.i)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {mode === 'dual' ? (
                    <>
                      <div className="grid gap-2">
                        <Label>Debit (out)</Label>
                        <Select value={debitCol} onValueChange={setDebitCol}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colOpts.map((c) => (
                              <SelectItem key={c.i} value={String(c.i)}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Credit (in)</Label>
                        <Select value={creditCol} onValueChange={setCreditCol}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colOpts.map((c) => (
                              <SelectItem key={c.i} value={String(c.i)}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-2 sm:col-span-2">
                      <Label>Amount column</Label>
                      <Select value={amountCol} onValueChange={setAmountCol}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colOpts.map((c) => (
                            <SelectItem key={c.i} value={String(c.i)}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="outpos"
                          checked={singleOutflowPositive}
                          onCheckedChange={(v) => setSingleOutflowPositive(v === true)}
                        />
                        <Label htmlFor="outpos">Positive values are outflows (debits)</Label>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Preview ({Math.min(5, csvRows.length - (hasHeader ? 1 : 0))} rows):{' '}
                  {buildLinesPayload()
                    .slice(0, 5)
                    .map((l) => `${l.postedAt.slice(0, 10)} ${l.direction} ${l.amount}`)
                    .join(' · ') || '—'}
                </p>

                <Button type="button" onClick={() => void submitImport()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {buildLinesPayload().length} lines
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-lg">Statement lines</CardTitle>
            <CardDescription>Select a batch, reconcile debits to expenses, or ignore noise.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={batchId} onValueChange={(v) => { setBatchId(v); setLinePage(1) }}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {(typeof b.cashAccountId === 'object' ? b.cashAccountId.name : '') || 'Account'} —{' '}
                    {b.fileName} ({b.rowCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Dir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((ln) => (
                  <TableRow key={ln.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {ln.postedAt ? new Date(ln.postedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">{ln.narration}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(ln.amount)}</TableCell>
                    <TableCell className="uppercase text-xs">{ln.direction}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ln.matchStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && ln.direction === 'debit' && ln.matchStatus === 'unmatched' ? (
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => void openSuggest(ln.id)}>
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => void createFromLine(ln.id)}>
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => void ignoreLine(ln.id)}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : ln.matchedExpenseId && typeof ln.matchedExpenseId === 'object' ? (
                        <span className="text-xs text-muted-foreground">
                          {(ln.matchedExpenseId as FinanceExpense).title}
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {lineTotal > 40 ? (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={linePage <= 1}
                onClick={() => setLinePage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={linePage * 40 >= lineTotal}
                onClick={() => setLinePage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggested expenses</DialogTitle>
          </DialogHeader>
          <ul className="max-h-[320px] space-y-2 overflow-y-auto">
            {suggestions.length === 0 ? (
              <li className="text-sm text-muted-foreground">No close matches (amount ±2% within ±5 days).</li>
            ) : (
              suggestions.map((ex) => (
                <li key={ex.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-2 text-sm">
                  <div>
                    <div className="font-medium">{ex.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ex.expenseDate?.slice(0, 10)} · {formatMoney(ex.amount + (ex.taxAmount || 0))}
                    </div>
                  </div>
                  <Button type="button" size="sm" onClick={() => void linkSuggestion(ex.id)}>
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    Link
                  </Button>
                </li>
              ))
            )}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuggestOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
