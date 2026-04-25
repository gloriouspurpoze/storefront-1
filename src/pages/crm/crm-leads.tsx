import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { ConfirmDeleteDialog } from '../../components/crm/ConfirmDeleteDialog'
import { CrmListToolbar } from '../../components/crm/CrmListToolbar'
import { CrmListShell } from '../../components/crm/CrmListShell'
import { CrmEmptyState } from '../../components/crm/CrmEmptyState'
import { CrmDataGridSkeleton } from '../../components/crm/CrmDataGridSkeleton'
import { CrmContactDetailDrawer } from '../../components/crm/CrmRecordDrawers'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRowSelectionModel,
} from '../../components/crm/CrmDataTable'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useCrmSearchParam } from '../../hooks/useCrmUrlFilters'
import { activitiesForContact, filterContacts } from '../../utils/crmFilters'
import type { CrmActivity, CrmCompany, CrmContact, CrmContactLifecycle } from '../../types/crm.types'
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
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'

const FUNNEL: CrmContactLifecycle[] = ['subscriber', 'lead', 'mql', 'sql', 'opportunity']

function isLeadRow(c: CrmContact) {
  return FUNNEL.includes(c.lifecycle)
}

const emptySelection: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function CrmLeads() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const { qInput, setQInput, setParam, searchParams } = useCrmSearchParam()
  const lifecycleFilter = searchParams.get('lifecycle') ?? 'all'

  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmContact | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [allContacts, setAllContacts] = useState<CrmContact[]>([])
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelection)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(null)
  const [drawerContact, setDrawerContact] = useState<CrmContact | null>(null)

  useEffect(() => {
    let c = true
    setLoading(true)
    setLoadError(null)
    Promise.all([crmService.listContacts(), crmService.listCompanies(), crmService.listActivities()])
      .then(([contacts, co, act]) => {
        if (!c) return
        setAllContacts(contacts)
        setCompanies(co)
        setActivities(act)
      })
      .catch(() => {
        if (c) setLoadError('Could not load leads. Check your connection and try again.')
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

  const leadRows = useMemo(() => allContacts.filter(isLeadRow), [allContacts])

  const companyName = useCallback(
    (id?: string) => (id ? companies.find((x) => x.id === id)?.name : undefined),
    [companies]
  )

  const filteredRows = useMemo(
    () => filterContacts(leadRows, qInput, lifecycleFilter, companyName),
    [leadRows, qInput, lifecycleFilter, companyName]
  )

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    companyId: '' as string | undefined,
    lifecycle: 'lead' as CrmContactLifecycle,
    leadSource: '',
  })

  const resetForm = () =>
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      companyId: undefined,
      lifecycle: 'lead',
      leadSource: '',
    })

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const openEdit = useCallback((row: CrmContact) => {
    setEditing(row)
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone ?? '',
      jobTitle: row.jobTitle ?? '',
      companyId: row.companyId,
      lifecycle: row.lifecycle,
      leadSource: row.leadSource ?? '',
    })
    setOpen(true)
  }, [])

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteContact(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'Leads removed' : 'Lead removed', severity: 'success' })
      setDeleteTarget(null)
      setContactToDeleteId(null)
    } catch {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns: GridColDef<CrmContact>[] = useMemo(() => {
    const base: GridColDef<CrmContact>[] = [
      { field: 'firstName', headerName: 'First', flex: 1, minWidth: 100 },
      { field: 'lastName', headerName: 'Last', flex: 1, minWidth: 100 },
      { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 180 },
      {
        field: 'lifecycle',
        headerName: 'Stage',
        width: 130,
        renderCell: (p) => (
          <Badge variant="outline" className="font-normal">
            {String(p.value ?? '—')}
          </Badge>
        ),
      },
      { field: 'leadSource', headerName: 'Source', width: 120 },
      {
        field: 'companyId',
        headerName: 'Company',
        flex: 1,
        minWidth: 140,
        renderCell: (p) => {
          const co = companies.find((c) => c.id === p.row.companyId)
          return co?.name ?? '—'
        },
      },
      {
        field: 'view',
        headerName: '',
        width: 70,
        sortable: false,
        renderCell: (p) => (
          <div className="inline-flex">
            <GridActionsCellItem icon={<Eye className="h-4 w-4" />} label="Details" onClick={() => setDrawerContact(p.row)} />
          </div>
        ),
      },
    ]
    if (!canManage) return base
    return [
      ...base,
      {
        field: 'actions',
        type: 'actions' as const,
        headerName: '',
        width: 100,
        getActions: (p: { row: CrmContact }) => [
          <GridActionsCellItem key="edit" icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={() => openEdit(p.row)} />,
          <GridActionsCellItem
            key="del"
            icon={<Trash2 className="h-4 w-4" />}
            label="Delete"
            onClick={() => {
              setContactToDeleteId(p.row.id)
              setDeleteTarget('single')
            }}
          />,
        ],
      },
    ]
  }, [canManage, companies, openEdit])

  const selectedIds = useMemo(
    () => Array.from(selectionModel.ids).map((id) => String(id)),
    [selectionModel]
  )

  const drawerActivities = drawerContact ? activitiesForContact(activities, drawerContact.id) : []
  const drawerCompanyName = drawerContact?.companyId ? companyName(drawerContact.companyId) : undefined

  const isEmpty = !loading && !loadError && leadRows.length === 0

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Leads"
        subtitle="Pre-customer contacts in your marketing & sales funnel."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => crmService.downloadExport('contacts')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage ? (
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  setEditing(null)
                  resetForm()
                  setOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                New lead
              </Button>
            ) : null}
          </div>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search leads…">
        <div className="space-y-1.5">
          <Label className="sr-only">Funnel stage</Label>
          <Select value={lifecycleFilter} onValueChange={(v) => setParam('lifecycle', v)}>
            <SelectTrigger className="h-9 w-[min(100%,10rem)] sm:w-40" aria-label="Funnel stage">
              <SelectValue placeholder="Funnel stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {FUNNEL.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CrmListToolbar>

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
              title="No leads in the funnel"
              description="Create a lead to track prospects before they become customers."
              actionLabel={canManage ? 'New lead' : undefined}
              onAction={
                canManage
                  ? () => {
                      setEditing(null)
                      resetForm()
                      setOpen(true)
                    }
                  : undefined
              }
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card>
          <CardContent className="p-0">
            {filteredRows.length === 0 && leadRows.length > 0 ? (
              <CrmEmptyState title="No matching leads" description="Try adjusting search or funnel stage." />
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

      <CrmContactDetailDrawer
        open={!!drawerContact}
        onClose={() => setDrawerContact(null)}
        contact={drawerContact}
        companyName={drawerCompanyName}
        activities={drawerActivities}
        onEdit={() => {
          if (drawerContact) {
            openEdit(drawerContact)
            setDrawerContact(null)
          }
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'single' && !!contactToDeleteId}
        title="Delete this lead?"
        description="This cannot be undone."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setContactToDeleteId(null)
          }
        }}
        onConfirm={async () => {
          if (contactToDeleteId) await runDeleteIds([contactToDeleteId])
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'bulk'}
        title={`Delete ${selectedIds.length} leads?`}
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
            <DialogTitle>{editing ? 'Edit lead' : 'New lead'}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto py-1 pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="ld-first">First name *</Label>
              <Input
                id="ld-first"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-last">Last name *</Label>
              <Input
                id="ld-last"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-email">Email *</Label>
              <Input
                id="ld-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-phone">Phone</Label>
              <Input
                id="ld-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-job">Title</Label>
              <Input
                id="ld-job"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select
                value={form.companyId ?? 'none'}
                onValueChange={(v) => setForm((f) => ({ ...f, companyId: v === 'none' ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Funnel stage</Label>
              <Select
                value={form.lifecycle}
                onValueChange={(v) => setForm((f) => ({ ...f, lifecycle: v as CrmContactLifecycle }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNNEL.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-src">Lead source</Label>
              <Input
                id="ld-src"
                value={form.leadSource}
                onChange={(e) => setForm((f) => ({ ...f, leadSource: e.target.value }))}
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
                if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
                  setSnackbar({ open: true, message: 'Name and email are required', severity: 'error' })
                  return
                }
                void (async () => {
                  try {
                    await crmService.upsertContact({
                      id: editing?.id,
                      firstName: form.firstName.trim(),
                      lastName: form.lastName.trim(),
                      email: form.email.trim(),
                      phone: form.phone || undefined,
                      jobTitle: form.jobTitle || undefined,
                      companyId: form.companyId,
                      lifecycle: form.lifecycle,
                      leadSource: form.leadSource || undefined,
                    })
                    setOpen(false)
                    refresh()
                    setSnackbar({ open: true, message: 'Lead saved', severity: 'success' })
                  } catch {
                    setSnackbar({ open: true, message: 'Failed to save lead', severity: 'error' })
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
            snackbar.severity === 'error'
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-emerald-600 bg-emerald-600 text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
