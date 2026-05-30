import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Play, Loader2, Pencil } from 'lucide-react'
import { FinanceService } from '../../services/api/finance.service'
import type { FinanceCashAccount, FinanceExpenseCategory, FinanceRecurringExpense, FinanceVendor } from '../../types/finance.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
import { Checkbox } from '../../components/ui/checkbox'

export function FinanceRecurringPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const [rows, setRows] = useState<FinanceRecurringExpense[]>([])
  const [due, setDue] = useState<FinanceRecurringExpense[]>([])
  const [categories, setCategories] = useState<FinanceExpenseCategory[]>([])
  const [vendors, setVendors] = useState<FinanceVendor[]>([])
  const [accounts, setAccounts] = useState<FinanceCashAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    taxAmount: '0',
    frequency: 'monthly' as FinanceRecurringExpense['frequency'],
    dayOfMonth: '1',
    dayOfWeek: '1',
    nextRunAt: new Date().toISOString().slice(0, 10),
    categoryId: '',
    vendorId: '',
    cashAccountId: '',
    generatedExpenseStatus: 'pending_approval' as 'draft' | 'pending_approval',
    isActive: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, d, c, v, a] = await Promise.all([
        FinanceService.listRecurring(),
        FinanceService.listRecurringDue(15),
        FinanceService.listCategories(),
        FinanceService.listVendors(true),
        FinanceService.listAccounts(),
      ])
      setRows(r.data)
      setDue(d.data)
      setCategories(c.data)
      setVendors(v.data)
      setAccounts(a.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activeCategories = categories.filter((c) => c.isActive !== false)
  const activeAccounts = accounts.filter((a) => a.isActive !== false)

  const openCreate = () => {
    setEditId(null)
    setForm({
      title: '',
      amount: '',
      taxAmount: '0',
      frequency: 'monthly',
      dayOfMonth: '1',
      dayOfWeek: '1',
      nextRunAt: new Date().toISOString().slice(0, 10),
      categoryId: activeCategories[0]?.id ?? '',
      vendorId: '',
      cashAccountId: activeAccounts[0]?.id ?? '',
      generatedExpenseStatus: 'pending_approval',
      isActive: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: FinanceRecurringExpense) => {
    setEditId(row.id)
    setForm({
      title: row.title,
      amount: String(row.amount),
      taxAmount: String(row.taxAmount ?? 0),
      frequency: row.frequency,
      dayOfMonth: String(row.dayOfMonth),
      dayOfWeek: String(row.dayOfWeek),
      nextRunAt: row.nextRunAt ? row.nextRunAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      categoryId: typeof row.categoryId === 'object' ? row.categoryId.id : row.categoryId || '',
      vendorId: typeof row.vendorId === 'object' ? row.vendorId.id : row.vendorId || '',
      cashAccountId: typeof row.cashAccountId === 'object' ? row.cashAccountId.id : row.cashAccountId || '',
      generatedExpenseStatus: row.generatedExpenseStatus,
      isActive: row.isActive,
    })
    setDialogOpen(true)
  }

  const saveTemplate = async () => {
    const amount = parseFloat(form.amount)
    if (!form.title.trim() || Number.isNaN(amount) || amount < 0) return
    const body: Record<string, unknown> = {
      title: form.title.trim(),
      amount,
      taxAmount: parseFloat(form.taxAmount) || 0,
      currency: 'INR',
      frequency: form.frequency,
      dayOfMonth: parseInt(form.dayOfMonth, 10) || 1,
      dayOfWeek: parseInt(form.dayOfWeek, 10) || 0,
      nextRunAt: new Date(form.nextRunAt).toISOString(),
      categoryId: form.categoryId || undefined,
      vendorId: form.vendorId || undefined,
      cashAccountId: form.cashAccountId || undefined,
      generatedExpenseStatus: form.generatedExpenseStatus,
      isActive: form.isActive,
    }
    if (editId) await FinanceService.updateRecurring(editId, body)
    else await FinanceService.createRecurring(body)
    setDialogOpen(false)
    void load()
  }

  const generateOne = async (id: string) => {
    await FinanceService.generateRecurring(id)
    void load()
  }

  return (
    <div className="space-y-6">
      {due.length > 0 && (
        <Card className="border-bloom-coral/40 bg-bloom-coral/5">
          <CardHeader>
            <CardTitle className="text-lg">Due now</CardTitle>
            <CardDescription>Templates whose next run date is today or earlier — generate expenses manually.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {due.map((d) => (
              <Button key={d.id} type="button" size="sm" variant="secondary" onClick={() => void generateOne(d.id)}>
                <Play className="mr-1 h-3.5 w-3.5" />
                {d.title}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recurring templates</CardTitle>
            <CardDescription>Schedules create expenses with your approval defaults; advance dates after each run.</CardDescription>
          </div>
          {canManage ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              New template
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Next run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{row.frequency}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.amount + (row.taxAmount || 0), row.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {row.nextRunAt ? new Date(row.nextRunAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? 'secondary' : 'outline'}>{row.isActive ? 'Active' : 'Off'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => void generateOne(row.id)}>
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit template' : 'New recurring template'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Tax</Label>
                <Input value={form.taxAmount} onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as FinanceRecurringExpense['frequency'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.frequency === 'weekly' ? (
              <div className="grid gap-2">
                <Label>Day of week (0=Sun … 6=Sat)</Label>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Day of month (1–28)</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dayOfMonth}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Next run date</Label>
              <Input
                type="date"
                value={form.nextRunAt}
                onChange={(e) => setForm((f) => ({ ...f, nextRunAt: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.isActive !== false || c.id === form.categoryId)
                    .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cash account</Label>
              <Select value={form.cashAccountId} onValueChange={(v) => setForm((f) => ({ ...f, cashAccountId: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.isActive !== false || a.id === form.cashAccountId)
                    .map((a) => (
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
                  <SelectValue />
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
            <div className="grid gap-2">
              <Label>Generated expense status</Label>
              <Select
                value={form.generatedExpenseStatus}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, generatedExpenseStatus: v as 'draft' | 'pending_approval' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_approval">Pending approval</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="act"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v === true }))}
              />
              <Label htmlFor="act">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveTemplate()} disabled={!canManage}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
