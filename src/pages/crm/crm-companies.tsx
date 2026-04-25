import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
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
        if (c) setLoadError('Could not load companies. Check your connection and try again.')
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
    website: '',
    phone: '',
    city: '',
    country: '',
    employeeCount: '',
    annualRevenue: '',
    notes: '',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      industry: '',
      website: '',
      phone: '',
      city: '',
      country: '',
      employeeCount: '',
      annualRevenue: '',
      notes: '',
    })
    setOpen(true)
  }

  const openEdit = useCallback((row: CrmCompany) => {
    setEditing(row)
    setForm({
      name: row.name,
      industry: row.industry ?? '',
      website: row.website ?? '',
      phone: row.phone ?? '',
      city: row.city ?? '',
      country: row.country ?? '',
      employeeCount: row.employeeCount ?? '',
      annualRevenue: row.annualRevenue ?? '',
      notes: row.notes ?? '',
    })
    setOpen(true)
  }, [])

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteCompany(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'Companies removed' : 'Company removed', severity: 'success' })
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
        title="Companies"
        subtitle="Accounts and organizations — linked from contacts and deals."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => crmService.downloadExport('companies')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage ? (
              <Button size="sm" className="gap-1" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add company
              </Button>
            ) : null}
          </div>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search companies…" />

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
              title="No companies yet"
              description="Add accounts you work with so contacts and deals can link to them."
              actionLabel={canManage ? 'Add company' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card>
          <CardContent className="p-0">
            {filteredRows.length === 0 && rows.length > 0 ? (
              <CrmEmptyState title="No matching companies" description="Try a different search term." />
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
        title="Delete this company?"
        description="This cannot be undone. Contacts may lose their company link."
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
        title={`Delete ${selectedIds.length} companies?`}
        description="This cannot be undone."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={async () => {
          await runDeleteIds(selectedIds)
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit company' : 'New company'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="co-name">Name *</Label>
              <Input
                id="co-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            {(['industry', 'website', 'phone', 'city', 'country'] as const).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="capitalize" htmlFor={`co-${key}`}>
                  {key}
                </Label>
                <Input
                  id={`co-${key}`}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="co-emp">Employees</Label>
              <Input
                id="co-emp"
                value={form.employeeCount}
                onChange={(e) => setForm((f) => ({ ...f, employeeCount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-rev">Annual revenue</Label>
              <Input
                id="co-rev"
                value={form.annualRevenue}
                onChange={(e) => setForm((f) => ({ ...f, annualRevenue: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-notes">Notes</Label>
              <Textarea
                id="co-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim()) {
                  setSnackbar({ open: true, message: 'Name is required', severity: 'error' })
                  return
                }
                void (async () => {
                  try {
                    await crmService.upsertCompany({
                      id: editing?.id,
                      name: form.name.trim(),
                      industry: form.industry || undefined,
                      website: form.website || undefined,
                      phone: form.phone || undefined,
                      city: form.city || undefined,
                      country: form.country || undefined,
                      employeeCount: form.employeeCount || undefined,
                      annualRevenue: form.annualRevenue || undefined,
                      notes: form.notes || undefined,
                    })
                    setOpen(false)
                    refresh()
                    setSnackbar({ open: true, message: 'Company saved', severity: 'success' })
                  } catch {
                    setSnackbar({ open: true, message: 'Save failed', severity: 'error' })
                  }
                })()
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {snackbar.open ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-4 left-1/2 z-[200] w-[min(100%,20rem)] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md',
            snackbar.severity === 'error' ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-emerald-600 bg-emerald-600 text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
