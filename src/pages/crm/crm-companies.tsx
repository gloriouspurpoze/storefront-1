import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { ConfirmDeleteDialog } from '../../components/crm/ConfirmDeleteDialog'
import { CrmListToolbar } from '../../components/crm/CrmListToolbar'
import { CrmListShell } from '../../components/crm/CrmListShell'
import { CrmEmptyState } from '../../components/crm/CrmEmptyState'
import { CrmDataGridSkeleton } from '../../components/crm/CrmDataGridSkeleton'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRowSelectionModel,
} from '../../components/crm/CrmDataTable'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useCrmSearchParam } from '../../hooks/useCrmUrlFilters'
import { filterCompanies } from '../../utils/crmFilters'
import type { CrmCompany } from '../../types/crm.types'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
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
import {
  B2B_COUNTRY_PRESETS,
  B2B_DEFAULT_COUNTRY,
  B2B_EMPLOYEE_BANDS,
  B2B_INDUSTRY_PRESETS,
  B2B_REVENUE_BANDS,
  normalizeCompanyPhone,
  normalizeCompanyWebsite,
} from '../../lib/crmCompanyForm'
import { cn } from '../../lib/utils'

const emptySelection: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function CrmCompanies() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const { qInput, setQInput } = useCrmSearchParam()

  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmCompany | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rows, setRows] = useState<CrmCompany[]>([])
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelection)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [companyToDeleteId, setCompanyToDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let c = true
    setLoading(true)
    setLoadError(null)
    crmService
      .listCompanies()
      .then((r) => {
        if (c) setRows(r)
      })
      .catch(() => {
        if (c) setLoadError('Could not load B2B accounts. Check your connection and try again.')
      })
      .finally(() => {
        if (c) setLoading(false)
      })
    return () => {
      c = false
    }
  }, [tick])

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 4000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const filteredRows = useMemo(() => filterCompanies(rows, qInput), [rows, qInput])

  const [form, setForm] = useState({
    name: '',
    industry: '',
    industryOther: '',
    website: '',
    phone: '',
    city: '',
    country: B2B_DEFAULT_COUNTRY,
    employeeCount: '',
    annualRevenue: '',
    notes: '',
  })

  const industrySelectValue = useMemo(() => {
    if (!form.industry) return ''
    if ((B2B_INDUSTRY_PRESETS as readonly string[]).includes(form.industry)) return form.industry
    return 'Other'
  }, [form.industry])

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      industry: '',
      industryOther: '',
      website: '',
      phone: '',
      city: '',
      country: B2B_DEFAULT_COUNTRY,
      employeeCount: '',
      annualRevenue: '',
      notes: '',
    })
    setOpen(true)
  }

  const openEdit = useCallback((row: CrmCompany) => {
    setEditing(row)
    const industry = row.industry ?? ''
    const isPreset = (B2B_INDUSTRY_PRESETS as readonly string[]).includes(industry)
    setForm({
      name: row.name,
      industry: isPreset ? industry : industry ? 'Other' : '',
      industryOther: isPreset ? '' : industry,
      website: row.website?.replace(/^https?:\/\//i, '') ?? '',
      phone: row.phone ?? '',
      city: row.city ?? '',
      country: row.country ?? B2B_DEFAULT_COUNTRY,
      employeeCount: row.employeeCount ?? '',
      annualRevenue: row.annualRevenue ?? '',
      notes: row.notes ?? '',
    })
    setOpen(true)
  }, [])

  const saveCompany = async () => {
    if (!form.name.trim()) {
      setSnackbar({ open: true, message: 'Account name is required', severity: 'error' })
      return
    }
    const industry =
      industrySelectValue === 'Other' ? form.industryOther.trim() : form.industry.trim()
    if (industrySelectValue === 'Other' && !industry) {
      setSnackbar({ open: true, message: 'Enter a custom industry or pick a preset', severity: 'error' })
      return
    }
    setSaving(true)
    try {
      await crmService.upsertCompany({
        id: editing?.id,
        name: form.name.trim(),
        industry: industry || undefined,
        website: normalizeCompanyWebsite(form.website),
        phone: normalizeCompanyPhone(form.phone),
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        employeeCount: form.employeeCount || undefined,
        annualRevenue: form.annualRevenue || undefined,
        notes: form.notes.trim() || undefined,
      })
      setOpen(false)
      refresh()
      setSnackbar({ open: true, message: 'B2B account saved', severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: 'Save failed', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteCompany(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'B2B accounts removed' : 'B2B account removed', severity: 'success' })
      setDeleteTarget(null)
      setCompanyToDeleteId(null)
    } catch {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const baseColumns: GridColDef<CrmCompany>[] = [
    { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 160 },
    { field: 'industry', headerName: 'Industry', width: 130 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'country', headerName: 'Country', width: 110 },
    { field: 'website', headerName: 'Website', flex: 1, minWidth: 160 },
  ]

  const actionColumn: GridColDef<CrmCompany> = {
    field: 'actions',
    type: 'actions',
    headerName: '',
    width: 100,
    getActions: ({ row }) => [
      <GridActionsCellItem key="edit" icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={() => openEdit(row)} />,
      <GridActionsCellItem
        key="del"
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        onClick={() => {
          setCompanyToDeleteId(row.id)
          setDeleteTarget('single')
        }}
      />,
    ],
  }

  const columns = canManage ? [...baseColumns, actionColumn] : baseColumns

  const selectedIds = useMemo(
    () => Array.from(selectionModel.ids).map((id) => String(id)),
    [selectionModel]
  )

  const isEmpty = !loading && !loadError && rows.length === 0

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="B2B accounts"
        subtitle="Societies, builders, and commercial accounts (ProFixer.in) — link contacts and large deals here."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => crmService.downloadExport('companies')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage ? (
              <Button size="sm" className="gap-1" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add B2B account
              </Button>
            ) : null}
          </div>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search B2B accounts…" />

      {canManage && selectedIds.length > 0 ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">{selectedIds.length} selected</p>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget('bulk')}>
            Delete selected
          </Button>
        </div>
      ) : null}

      <CrmListShell
        loading={loading}
        error={loadError}
        onRetry={refresh}
        isEmpty={isEmpty}
        empty={
          <Card>
            <CrmEmptyState
              title="No B2B accounts yet"
              description="Add societies, builders, or commercial clients so contacts and deals can link to them."
              actionLabel={canManage ? 'Add B2B account' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card>
          <CardContent className="p-0">
            {filteredRows.length === 0 && rows.length > 0 ? (
              <CrmEmptyState title="No matching B2B accounts" description="Try a different search term." />
            ) : (
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(r) => r.id}
                pageSizeOptions={[10, 25, 50]}
                initialPageSize={10}
                checkboxSelection={canManage}
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={setSelectionModel}
                minHeight={360}
                className="border-0"
              />
            )}
          </CardContent>
        </Card>
      </CrmListShell>

      <ConfirmDeleteDialog
        open={deleteTarget === 'single' && !!companyToDeleteId}
        title="Delete this B2B account?"
        description="This cannot be undone. Contacts may lose their B2B account link."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setCompanyToDeleteId(null)
          }
        }}
        onConfirm={async () => {
          if (companyToDeleteId) await runDeleteIds([companyToDeleteId])
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'bulk'}
        title={`Delete ${selectedIds.length} B2B accounts?`}
        description="This cannot be undone."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={async () => {
          await runDeleteIds(selectedIds)
        }}
      />

      <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editing ? 'Edit B2B account' : 'New B2B account'}
            </DialogTitle>
            <DialogDescription>
              Societies, builders, and commercial clients. Link contacts and large deals to this account.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(70vh,640px)] overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Account</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="co-name">Account name *</Label>
                    <Input
                      id="co-name"
                      placeholder="e.g. Sunrise Heights CHS"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industry</Label>
                    <Select
                      value={industrySelectValue || undefined}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          industry: v,
                          industryOther: v === 'Other' ? f.industryOther : '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {B2B_INDUSTRY_PRESETS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="co-website">Website</Label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-xs text-muted-foreground">
                        https://
                      </span>
                      <Input
                        id="co-website"
                        className="rounded-l-none"
                        placeholder="company.com"
                        value={form.website}
                        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      />
                    </div>
                  </div>
                  {industrySelectValue === 'Other' ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="co-industry-other">Custom industry</Label>
                      <Input
                        id="co-industry-other"
                        placeholder="e.g. Facility management"
                        value={form.industryOther}
                        onChange={(e) => setForm((f) => ({ ...f, industryOther: e.target.value }))}
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Contact & location</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="co-phone">Phone</Label>
                    <Input
                      id="co-phone"
                      type="tel"
                      placeholder="10-digit mobile or landline"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="co-city">City</Label>
                    <Input
                      id="co-city"
                      placeholder="e.g. Mumbai"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {B2B_COUNTRY_PRESETS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Size & revenue</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Employees</Label>
                    <Select
                      value={form.employeeCount || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, employeeCount: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select band" />
                      </SelectTrigger>
                      <SelectContent>
                        {B2B_EMPLOYEE_BANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Annual revenue</Label>
                    <Select
                      value={form.annualRevenue || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, annualRevenue: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select band" />
                      </SelectTrigger>
                      <SelectContent>
                        {B2B_REVENUE_BANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                <Textarea
                  id="co-notes"
                  rows={3}
                  placeholder="AMC contract, billing contact, GSTIN, society gate rules…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </section>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveCompany()} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {snackbar.open ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-4 left-1/2 z-[200] w-[min(100%,20rem)] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md',
            snackbar.severity === 'error' ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-storm-deep bg-storm-deep text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
