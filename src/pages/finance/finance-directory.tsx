import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Trash2, Upload, GitMerge } from 'lucide-react'
import { parseCsvText } from '../../lib/csv'
import { FinanceService } from '../../services/api/finance.service'
import type { FinanceCashAccount, FinanceExpenseCategory, FinanceVendor } from '../../types/finance.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import type { ApiError } from '../../services/api/base'
import type { FinanceCategoryDetailResponse, FinanceVendorDetailResponse } from '../../types/finance.types'

function csvRowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return rows.slice(1).map((cells) => {
    const o: Record<string, string> = {}
    headers.forEach((h, i) => {
      o[h] = (cells[i] ?? '').trim()
    })
    return o
  })
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'message' in e && 'status' in e
}

const VENDOR_EMPTY = {
  name: '',
  legalName: '',
  email: '',
  phone: '',
  taxId: '',
  billingAddress: '',
  paymentTermsDays: '',
  notes: '',
  isActive: true,
}

const CAT_EMPTY = {
  name: '',
  code: '',
  glHint: '',
  description: '',
  isActive: true,
}

export function FinanceDirectoryPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_finance')

  const [accounts, setAccounts] = useState<FinanceCashAccount[]>([])
  const [vendors, setVendors] = useState<FinanceVendor[]>([])
  const [categories, setCategories] = useState<FinanceExpenseCategory[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  const [acctOpen, setAcctOpen] = useState(false)
  const [acctEdit, setAcctEdit] = useState<FinanceCashAccount | null>(null)
  const [acctName, setAcctName] = useState('')
  const [acctKind, setAcctKind] = useState<FinanceCashAccount['kind']>('bank')
  const [acctInstitution, setAcctInstitution] = useState('')
  const [acctMask, setAcctMask] = useState('')
  const [acctNotes, setAcctNotes] = useState('')
  const [acctActive, setAcctActive] = useState(true)

  const [vendOpen, setVendOpen] = useState(false)
  const [vendEditId, setVendEditId] = useState<string | null>(null)
  const [vendForm, setVendForm] = useState(VENDOR_EMPTY)

  const [catOpen, setCatOpen] = useState(false)
  const [catEditId, setCatEditId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState(CAT_EMPTY)

  const [deleteTarget, setDeleteTarget] = useState<
    { kind: 'vendor' | 'category'; id: string; name: string } | null
  >(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [vendorMergeFrom, setVendorMergeFrom] = useState('')
  const [vendorMergeTo, setVendorMergeTo] = useState('')
  const [vendorMergePreview, setVendorMergePreview] = useState<FinanceVendorDetailResponse | null>(null)
  const [mergeBusy, setMergeBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const vendorFileRef = useRef<HTMLInputElement>(null)
  const categoryFileRef = useRef<HTMLInputElement>(null)

  const [categoryMergeFrom, setCategoryMergeFrom] = useState('')
  const [categoryMergeTo, setCategoryMergeTo] = useState('')
  const [categoryMergePreview, setCategoryMergePreview] = useState<FinanceCategoryDetailResponse | null>(null)

  const [vendorToolsErr, setVendorToolsErr] = useState<string | null>(null)
  const [categoryToolsErr, setCategoryToolsErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadErr(null)
    try {
      const [a, v, c] = await Promise.all([
        FinanceService.listAccounts(),
        FinanceService.listVendors(),
        FinanceService.listCategories(),
      ])
      setAccounts(a.data)
      setVendors(v.data)
      setCategories(c.data)
    } catch (e: unknown) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load directory')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openNewAccount = () => {
    setActionErr(null)
    setAcctEdit(null)
    setAcctName('')
    setAcctKind('bank')
    setAcctInstitution('')
    setAcctMask('')
    setAcctNotes('')
    setAcctActive(true)
    setAcctOpen(true)
  }

  const openEditAccount = (a: FinanceCashAccount) => {
    setActionErr(null)
    setAcctEdit(a)
    setAcctName(a.name)
    setAcctKind(a.kind)
    setAcctInstitution(a.institution ?? '')
    setAcctMask(a.accountMask ?? '')
    setAcctNotes(a.notes ?? '')
    setAcctActive(a.isActive)
    setAcctOpen(true)
  }

  const saveAccount = async () => {
    if (!acctName.trim()) return
    setActionErr(null)
    try {
      if (acctEdit) {
        await FinanceService.updateAccount(acctEdit.id, {
          name: acctName.trim(),
          kind: acctKind,
          institution: acctInstitution.trim() || undefined,
          accountMask: acctMask.trim() || undefined,
          notes: acctNotes.trim() || undefined,
          isActive: acctActive,
        })
      } else {
        await FinanceService.createAccount({
          name: acctName.trim(),
          kind: acctKind,
          currency: 'INR',
          institution: acctInstitution.trim() || undefined,
          accountMask: acctMask.trim() || undefined,
          notes: acctNotes.trim() || undefined,
        })
      }
      setAcctOpen(false)
      void load()
    } catch (e: unknown) {
      setActionErr(isApiError(e) ? e.message : 'Save failed')
    }
  }

  const openNewVendor = () => {
    setActionErr(null)
    setVendEditId(null)
    setVendForm(VENDOR_EMPTY)
    setVendOpen(true)
  }

  const openEditVendor = (v: FinanceVendor) => {
    setActionErr(null)
    setVendEditId(v.id)
    setVendForm({
      name: v.name,
      legalName: v.legalName ?? '',
      email: v.email ?? '',
      phone: v.phone ?? '',
      taxId: v.taxId ?? '',
      billingAddress: v.billingAddress ?? '',
      paymentTermsDays: v.paymentTermsDays != null ? String(v.paymentTermsDays) : '',
      notes: v.notes ?? '',
      isActive: v.isActive !== false,
    })
    setVendOpen(true)
  }

  const saveVendor = async () => {
    if (!vendForm.name.trim()) return
    setActionErr(null)
    const terms = parseInt(vendForm.paymentTermsDays, 10)
    const body: Record<string, unknown> = {
      name: vendForm.name.trim(),
      legalName: vendForm.legalName.trim() || undefined,
      email: vendForm.email.trim() || undefined,
      phone: vendForm.phone.trim() || undefined,
      taxId: vendForm.taxId.trim() || undefined,
      billingAddress: vendForm.billingAddress.trim() || undefined,
      notes: vendForm.notes.trim() || undefined,
      isActive: vendForm.isActive,
    }
    if (vendForm.paymentTermsDays.trim() && !Number.isNaN(terms) && terms >= 0) {
      body.paymentTermsDays = terms
    }
    try {
      if (vendEditId) {
        await FinanceService.updateVendor(vendEditId, body)
      } else {
        await FinanceService.createVendor(body)
      }
      setVendOpen(false)
      void load()
    } catch (e: unknown) {
      setActionErr(isApiError(e) ? e.message : 'Save failed')
    }
  }

  const openNewCategory = () => {
    setActionErr(null)
    setCatEditId(null)
    setCatForm(CAT_EMPTY)
    setCatOpen(true)
  }

  const openEditCategory = (c: FinanceExpenseCategory) => {
    setActionErr(null)
    setCatEditId(c.id)
    setCatForm({
      name: c.name,
      code: c.code ?? '',
      glHint: c.glHint ?? '',
      description: c.description ?? '',
      isActive: c.isActive !== false,
    })
    setCatOpen(true)
  }

  const saveCategory = async () => {
    if (!catForm.name.trim()) return
    setActionErr(null)
    const body: Record<string, unknown> = {
      name: catForm.name.trim(),
      glHint: catForm.glHint.trim() || undefined,
      description: catForm.description.trim() || undefined,
      isActive: catForm.isActive,
    }
    const editing = catEditId ? categories.find((x) => x.id === catEditId) : null
    if (!editing?.isSystem && catForm.code.trim()) {
      body.code = catForm.code.trim().toUpperCase()
    }
    try {
      if (catEditId) {
        await FinanceService.updateCategory(catEditId, body)
      } else {
        await FinanceService.createCategory(body)
      }
      setCatOpen(false)
      void load()
    } catch (e: unknown) {
      setActionErr(isApiError(e) ? e.message : 'Save failed')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteBusy(true)
    setActionErr(null)
    try {
      if (deleteTarget.kind === 'vendor') {
        await FinanceService.deleteVendor(deleteTarget.id)
      } else {
        await FinanceService.deleteCategory(deleteTarget.id)
      }
      setDeleteTarget(null)
      void load()
    } catch (e: unknown) {
      if (isApiError(e) && e.status === 409) {
        setActionErr(`${e.message} You can deactivate instead.`)
      } else {
        setActionErr(isApiError(e) ? e.message : 'Delete failed')
      }
    } finally {
      setDeleteBusy(false)
    }
  }

  const deactivateFromConflict = async () => {
    if (!deleteTarget) return
    setDeleteBusy(true)
    setActionErr(null)
    try {
      if (deleteTarget.kind === 'vendor') {
        await FinanceService.updateVendor(deleteTarget.id, { isActive: false })
      } else {
        await FinanceService.updateCategory(deleteTarget.id, { isActive: false })
      }
      setDeleteTarget(null)
      void load()
    } catch (e: unknown) {
      setActionErr(isApiError(e) ? e.message : 'Update failed')
    } finally {
      setDeleteBusy(false)
    }
  }

  const editingCategory = catEditId ? categories.find((c) => c.id === catEditId) : null

  const OID = /^[a-f0-9]{24}$/i

  const loadVendorMergePreview = async () => {
    if (!OID.test(vendorMergeFrom)) {
      setVendorMergePreview(null)
      return
    }
    try {
      const r = await FinanceService.getVendor(vendorMergeFrom)
      setVendorMergePreview(r.data)
    } catch {
      setVendorMergePreview(null)
    }
  }

  const loadCategoryMergePreview = async () => {
    if (!OID.test(categoryMergeFrom)) {
      setCategoryMergePreview(null)
      return
    }
    try {
      const r = await FinanceService.getCategory(categoryMergeFrom)
      setCategoryMergePreview(r.data)
    } catch {
      setCategoryMergePreview(null)
    }
  }

  const runVendorMerge = async () => {
    if (!OID.test(vendorMergeFrom) || !OID.test(vendorMergeTo) || vendorMergeFrom === vendorMergeTo) {
      setVendorToolsErr('Pick two different vendors (valid IDs).')
      return
    }
    setMergeBusy(true)
    setVendorToolsErr(null)
    try {
      await FinanceService.mergeVendors(vendorMergeFrom, vendorMergeTo)
      setVendorMergeFrom('')
      setVendorMergeTo('')
      setVendorMergePreview(null)
      void load()
    } catch (e: unknown) {
      setVendorToolsErr(isApiError(e) ? e.message : 'Merge failed')
    } finally {
      setMergeBusy(false)
    }
  }

  const runCategoryMerge = async () => {
    if (!OID.test(categoryMergeFrom) || !OID.test(categoryMergeTo) || categoryMergeFrom === categoryMergeTo) {
      setCategoryToolsErr('Pick two different categories (valid IDs).')
      return
    }
    setMergeBusy(true)
    setCategoryToolsErr(null)
    try {
      await FinanceService.mergeCategories(categoryMergeFrom, categoryMergeTo)
      setCategoryMergeFrom('')
      setCategoryMergeTo('')
      setCategoryMergePreview(null)
      void load()
    } catch (e: unknown) {
      setCategoryToolsErr(isApiError(e) ? e.message : 'Merge failed')
    } finally {
      setMergeBusy(false)
    }
  }

  const handleVendorCsv = async (file: File | null) => {
    if (!file) return
    setImportBusy(true)
    setVendorToolsErr(null)
    try {
      const text = await file.text()
      const { rows } = parseCsvText(text)
      const objs = csvRowsToObjects(rows) as unknown as Record<string, unknown>[]
      const res = await FinanceService.importVendors(objs)
      const extra = res.data.errors?.length
        ? ` Some rows failed: ${res.data.errors.slice(0, 4).join(' · ')}${res.data.errors.length > 4 ? '…' : ''}`
        : ''
      setVendorToolsErr(`Inserted ${res.data.inserted}, skipped ${res.data.skipped}.${extra}`)
      void load()
    } catch (e: unknown) {
      setVendorToolsErr(isApiError(e) ? e.message : 'Import failed')
    } finally {
      setImportBusy(false)
      if (vendorFileRef.current) vendorFileRef.current.value = ''
    }
  }

  const handleCategoryCsv = async (file: File | null) => {
    if (!file) return
    setImportBusy(true)
    setCategoryToolsErr(null)
    try {
      const text = await file.text()
      const { rows } = parseCsvText(text)
      const objs = csvRowsToObjects(rows) as unknown as Record<string, unknown>[]
      const res = await FinanceService.importCategories(objs)
      const extra = res.data.errors?.length
        ? ` Some rows failed: ${res.data.errors.slice(0, 4).join(' · ')}${res.data.errors.length > 4 ? '…' : ''}`
        : ''
      setCategoryToolsErr(`Inserted ${res.data.inserted}, skipped ${res.data.skipped}.${extra}`)
      void load()
    } catch (e: unknown) {
      setCategoryToolsErr(isApiError(e) ? e.message : 'Import failed')
    } finally {
      setImportBusy(false)
      if (categoryFileRef.current) categoryFileRef.current.value = ''
    }
  }

  return (
    <Tabs defaultValue="accounts" className="space-y-4">
      <TabsList>
        <TabsTrigger value="accounts">Cash &amp; bank</TabsTrigger>
        <TabsTrigger value="vendors">Vendors</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>

      {loadErr && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadErr}
        </div>
      )}

      <TabsContent value="accounts">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cash &amp; bank accounts</CardTitle>
            <CardDescription>Used on expenses and bank reconciliation imports.</CardDescription>
            <div className="flex justify-end">
              {canManage ? (
                <Button type="button" size="sm" onClick={openNewAccount}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add account
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="w-[100px]" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{a.kind}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.institution ?? '—'}</TableCell>
                    <TableCell>{a.currency}</TableCell>
                    <TableCell>
                      <Badge variant={a.isActive ? 'secondary' : 'outline'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEditAccount(a)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vendors">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendors</CardTitle>
            <CardDescription>Legal, tax, and contact details for AP and reporting.</CardDescription>
            <div className="flex justify-end">
              {canManage ? (
                <Button type="button" size="sm" onClick={openNewVendor}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add vendor
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Legal name</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="w-[120px]" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground text-sm">{v.legalName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{v.taxId ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{v.phone ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{v.email ?? '—'}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground text-sm">
                      {v.paymentTermsDays != null ? `${v.paymentTermsDays}d` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.isActive !== false ? 'secondary' : 'outline'}>
                        {v.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditVendor(v)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setActionErr(null)
                                setDeleteTarget({ kind: 'vendor', id: v.id, name: v.name })
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {canManage ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitMerge className="h-4 w-4" aria-hidden />
                  Merge vendors
                </CardTitle>
                <CardDescription>
                  Moves all expenses and recurring templates from the source vendor to the target, then deletes the
                  source. Use when you have duplicates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendorToolsErr ? (
                  <p
                    className={
                      vendorToolsErr.startsWith('Inserted')
                        ? 'text-sm text-emerald-800 dark:text-emerald-200'
                        : 'text-sm text-destructive'
                    }
                  >
                    {vendorToolsErr}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Source vendor</Label>
                    <Select
                      value={vendorMergeFrom || '__none__'}
                      onValueChange={(v) => {
                        setVendorMergeFrom(v === '__none__' ? '' : v)
                        setVendorMergePreview(null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select —</SelectItem>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Target vendor</Label>
                    <Select
                      value={vendorMergeTo || '__none__'}
                      onValueChange={(v) => setVendorMergeTo(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Into" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select —</SelectItem>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void loadVendorMergePreview()}>
                    Show usage (source)
                  </Button>
                  <Button type="button" size="sm" disabled={mergeBusy} onClick={() => void runVendorMerge()}>
                    Merge now
                  </Button>
                </div>
                {vendorMergePreview ? (
                  <p className="text-xs text-muted-foreground">
                    Source usage: {vendorMergePreview.usage.expenses} expenses ·{' '}
                    {vendorMergePreview.usage.recurringTemplates} recurring templates.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4" aria-hidden />
                  Import vendors (CSV)
                </CardTitle>
                <CardDescription>
                  Header row required. Columns: <span className="font-mono">name</span>,{' '}
                  <span className="font-mono">email</span>, <span className="font-mono">phone</span>,{' '}
                  <span className="font-mono">tax_id</span>, <span className="font-mono">legal_name</span>,{' '}
                  <span className="font-mono">billing_address</span>, <span className="font-mono">payment_terms_days</span>
                  , <span className="font-mono">notes</span>. Up to 500 rows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  ref={vendorFileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => void handleVendorCsv(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" size="sm" disabled={importBusy} onClick={() => vendorFileRef.current?.click()}>
                  {importBusy ? 'Importing…' : 'Choose CSV file'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense categories</CardTitle>
            <CardDescription>
              System categories ship with the product; you can edit labels and hints but not their codes. Custom
              categories can be deleted when unused.
            </CardDescription>
            <div className="flex justify-end">
              {canManage ? (
                <Button type="button" size="sm" onClick={openNewCategory}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add category
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>GL hint</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="w-[120px]" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.name}
                      {c.isSystem ? (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          system
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.code ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.glHint ?? '—'}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground text-sm">{c.description ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive !== false ? 'secondary' : 'outline'}>
                        {c.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditCategory(c)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={c.isSystem ? 'text-muted-foreground' : 'text-destructive'}
                              disabled={!!c.isSystem}
                              onClick={() => {
                                if (!c.isSystem) {
                                  setActionErr(null)
                                  setDeleteTarget({ kind: 'category', id: c.id, name: c.name })
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {canManage ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitMerge className="h-4 w-4" aria-hidden />
                  Merge categories
                </CardTitle>
                <CardDescription>
                  Reassigns expenses, recurring templates, and budget lines from the source to the target, then removes
                  the source category. You cannot use a system category as the source (you may merge into one).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryToolsErr ? (
                  <p
                    className={
                      categoryToolsErr.startsWith('Inserted')
                        ? 'text-sm text-emerald-800 dark:text-emerald-200'
                        : 'text-sm text-destructive'
                    }
                  >
                    {categoryToolsErr}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label>Source (custom only)</Label>
                    <Select
                      value={categoryMergeFrom || '__none__'}
                      onValueChange={(v) => {
                        setCategoryMergeFrom(v === '__none__' ? '' : v)
                        setCategoryMergePreview(null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select —</SelectItem>
                        {categories
                          .filter((c) => !c.isSystem)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Target category</Label>
                    <Select
                      value={categoryMergeTo || '__none__'}
                      onValueChange={(v) => setCategoryMergeTo(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Into" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select —</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.isSystem ? ' (system)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void loadCategoryMergePreview()}>
                    Show usage (source)
                  </Button>
                  <Button type="button" size="sm" disabled={mergeBusy} onClick={() => void runCategoryMerge()}>
                    Merge now
                  </Button>
                </div>
                {categoryMergePreview ? (
                  <p className="text-xs text-muted-foreground">
                    Source usage: {categoryMergePreview.usage.expenses} expenses ·{' '}
                    {categoryMergePreview.usage.recurringTemplates} recurring · {categoryMergePreview.usage.budgetLines}{' '}
                    budget lines.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4" aria-hidden />
                  Import categories (CSV)
                </CardTitle>
                <CardDescription>
                  Columns: <span className="font-mono">name</span>, <span className="font-mono">code</span>,{' '}
                  <span className="font-mono">gl_hint</span>, <span className="font-mono">description</span>. Codes must
                  be unique. Up to 500 rows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={categoryFileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => void handleCategoryCsv(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" size="sm" disabled={importBusy} onClick={() => categoryFileRef.current?.click()}>
                  {importBusy ? 'Importing…' : 'Choose CSV file'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </TabsContent>

      <Dialog open={acctOpen} onOpenChange={setAcctOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{acctEdit ? 'Edit account' : 'New cash / bank account'}</DialogTitle>
          </DialogHeader>
          {actionErr ? <p className="text-sm text-destructive">{actionErr}</p> : null}
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="da-name">Name</Label>
              <Input id="da-name" value={acctName} onChange={(e) => setAcctName(e.target.value)} placeholder="e.g. HDFC Current" />
            </div>
            <div className="grid gap-2">
              <Label>Kind</Label>
              <Select value={acctKind} onValueChange={(v) => setAcctKind(v as FinanceCashAccount['kind'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="da-inst">Institution (optional)</Label>
              <Input id="da-inst" value={acctInstitution} onChange={(e) => setAcctInstitution(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="da-mask">Account mask / last digits (optional)</Label>
              <Input id="da-mask" value={acctMask} onChange={(e) => setAcctMask(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="da-notes">Notes (optional)</Label>
              <Textarea id="da-notes" rows={2} value={acctNotes} onChange={(e) => setAcctNotes(e.target.value)} />
            </div>
            {acctEdit ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <Label htmlFor="da-active">Active</Label>
                <Switch id="da-active" checked={acctActive} onCheckedChange={setAcctActive} />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAcctOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveAccount()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={vendOpen}
        onOpenChange={(o) => {
          setVendOpen(o)
          if (!o) setActionErr(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{vendEditId ? 'Edit vendor' : 'New vendor'}</DialogTitle>
            <DialogDescription>Stored for invoices, expenses, and tax reporting.</DialogDescription>
          </DialogHeader>
          {actionErr ? <p className="text-sm text-destructive">{actionErr}</p> : null}
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dv-name">Display name</Label>
              <Input id="dv-name" value={vendForm.name} onChange={(e) => setVendForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dv-legal">Legal name (optional)</Label>
              <Input id="dv-legal" value={vendForm.legalName} onChange={(e) => setVendForm((f) => ({ ...f, legalName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="dv-email">Email</Label>
                <Input id="dv-email" type="email" value={vendForm.email} onChange={(e) => setVendForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dv-phone">Phone</Label>
                <Input id="dv-phone" value={vendForm.phone} onChange={(e) => setVendForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dv-tax">Tax ID / GST (optional)</Label>
              <Input id="dv-tax" value={vendForm.taxId} onChange={(e) => setVendForm((f) => ({ ...f, taxId: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dv-addr">Billing address (optional)</Label>
              <Textarea id="dv-addr" rows={2} value={vendForm.billingAddress} onChange={(e) => setVendForm((f) => ({ ...f, billingAddress: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dv-terms">Default payment terms (days)</Label>
              <Input
                id="dv-terms"
                inputMode="numeric"
                placeholder="e.g. 30"
                value={vendForm.paymentTermsDays}
                onChange={(e) => setVendForm((f) => ({ ...f, paymentTermsDays: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dv-notes">Internal notes (optional)</Label>
              <Textarea id="dv-notes" rows={2} value={vendForm.notes} onChange={(e) => setVendForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <Label htmlFor="dv-active">Active (shown in pickers)</Label>
              <Switch id="dv-active" checked={vendForm.isActive} onCheckedChange={(c) => setVendForm((f) => ({ ...f, isActive: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVendOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveVendor()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={catOpen}
        onOpenChange={(o) => {
          setCatOpen(o)
          if (!o) setActionErr(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{catEditId ? 'Edit category' : 'New category'}</DialogTitle>
            {editingCategory?.isSystem ? (
              <DialogDescription>System category: code is fixed; you can adjust name, GL hint, and description.</DialogDescription>
            ) : (
              <DialogDescription>Codes should be short and unique (e.g. R_AND_D).</DialogDescription>
            )}
          </DialogHeader>
          {actionErr ? <p className="text-sm text-destructive">{actionErr}</p> : null}
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dc-name">Name</Label>
              <Input id="dc-name" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dc-code">Code {editingCategory?.isSystem ? '(read-only for system)' : '(optional)'}</Label>
              <Input
                id="dc-code"
                value={catForm.code}
                disabled={!!editingCategory?.isSystem}
                onChange={(e) => setCatForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. R_AND_D"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dc-gl">GL hint (optional)</Label>
              <Input id="dc-gl" value={catForm.glHint} onChange={(e) => setCatForm((f) => ({ ...f, glHint: e.target.value }))} placeholder="e.g. 6100 — SaaS" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dc-desc">Description (optional)</Label>
              <Textarea id="dc-desc" rows={2} value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <Label htmlFor="dc-active">Active (shown in pickers)</Label>
              <Switch id="dc-active" checked={catForm.isActive} onCheckedChange={(c) => setCatForm((f) => ({ ...f, isActive: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCatOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveCategory()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.kind}?</DialogTitle>
            <DialogDescription>
              This removes <strong>{deleteTarget?.name}</strong> permanently. It only works when nothing references this{' '}
              {deleteTarget?.kind}.
            </DialogDescription>
          </DialogHeader>
          {actionErr ? <p className="text-sm text-destructive">{actionErr}</p> : null}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {actionErr?.toLowerCase().includes('deactivate') ? (
              <Button type="button" variant="secondary" onClick={() => void deactivateFromConflict()} disabled={deleteBusy}>
                Deactivate instead
              </Button>
            ) : null}
            <div className="flex flex-1 justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleteBusy}>
                {deleteBusy ? '…' : 'Delete'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
