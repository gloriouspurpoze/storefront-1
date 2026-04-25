import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleCheck, Download, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { filterActivities } from '../../utils/crmFilters'
import type {
  CrmActivity,
  CrmActivityStatus,
  CrmActivityType,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmRelatedType,
} from '../../types/crm.types'
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
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'

const TYPES: CrmActivityType[] = ['call', 'email', 'meeting', 'task', 'note']
const STATUS_OPTS: CrmActivityStatus[] = ['open', 'done', 'cancelled']

const emptySelection: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function CrmActivities() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const { qInput, setQInput, setParam, searchParams } = useCrmSearchParam()
  const typeFilter = searchParams.get('type') ?? 'all'
  const statusFilter = searchParams.get('status') ?? 'all'

  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmActivity | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rows, setRows] = useState<CrmActivity[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelection)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let c = true
    setLoading(true)
    setLoadError(null)
    Promise.all([
      crmService.listActivities(),
      crmService.listDeals(),
      crmService.listContacts(),
      crmService.listCompanies(),
    ])
      .then(([acts, d, ct, co]) => {
        if (!c) return
        setDeals(d)
        setContacts(ct)
        setCompanies(co)
        setRows(
          [...acts].sort((a, b) => {
            const da = a.dueAt ? new Date(a.dueAt).getTime() : 0
            const db = b.dueAt ? new Date(b.dueAt).getTime() : 0
            return da - db
          })
        )
      })
      .catch(() => {
        if (c) setLoadError('Could not load activities. Check your connection and try again.')
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

  const filteredRows = useMemo(
    () => filterActivities(rows, qInput, typeFilter, statusFilter),
    [rows, qInput, typeFilter, statusFilter]
  )

  const [form, setForm] = useState({
    subject: '',
    type: 'task' as CrmActivityType,
    status: 'open' as CrmActivityStatus,
    priority: 'normal' as 'low' | 'normal' | 'high',
    dueAt: '',
    relatedType: '' as '' | CrmRelatedType,
    relatedId: '',
    body: '',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      subject: '',
      type: 'task',
      status: 'open',
      priority: 'normal',
      dueAt: '',
      relatedType: '',
      relatedId: '',
      body: '',
    })
    setOpen(true)
  }

  const openEdit = useCallback((row: CrmActivity) => {
    setEditing(row)
    setForm({
      subject: row.subject,
      type: row.type,
      status: row.status,
      priority: row.priority,
      dueAt: row.dueAt ? new Date(row.dueAt).toISOString().slice(0, 16) : '',
      relatedType: row.relatedType ?? '',
      relatedId: row.relatedId ?? '',
      body: row.body ?? '',
    })
    setOpen(true)
  }, [])

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const relatedLabel = useCallback(
    (t?: CrmRelatedType, id?: string) => {
      if (!t || !id) return '—'
      if (t === 'deal') return deals.find((d) => d.id === id)?.name ?? id
      if (t === 'contact') {
        const c = contacts.find((x) => x.id === id)
        return c ? `${c.firstName} ${c.lastName}` : id
      }
      if (t === 'company') return companies.find((c) => c.id === id)?.name ?? id
      return '—'
    },
    [deals, contacts, companies]
  )

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteActivity(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'Activities removed' : 'Activity removed', severity: 'success' })
      setDeleteTarget(null)
      setActivityToDeleteId(null)
    } catch {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const baseColumns: GridColDef<CrmActivity>[] = useMemo(
    () => [
      { field: 'subject', headerName: 'Subject', flex: 1.2, minWidth: 180 },
      {
        field: 'type',
        headerName: 'Type',
        width: 100,
        renderCell: (p) => (
          <Badge variant="outline" className="font-normal">
            {String(p.value ?? '—')}
          </Badge>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 100,
        renderCell: (p) => {
          const v = p.value as string
          return (
            <Badge
              variant={v === 'done' ? 'success' : v === 'open' ? 'default' : 'secondary'}
              className="font-normal capitalize"
            >
              {v}
            </Badge>
          )
        },
      },
      { field: 'priority', headerName: 'Priority', width: 90 },
      {
        field: 'dueAt',
        headerName: 'Due',
        width: 160,
        renderCell: (p) =>
          p.row.dueAt
            ? new Date(p.row.dueAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
            : '—',
      },
      {
        field: 'related',
        headerName: 'Related',
        flex: 1,
        minWidth: 140,
        sortable: false,
        renderCell: (p) => relatedLabel(p.row.relatedType, p.row.relatedId),
      },
    ],
    [relatedLabel]
  )

  const actionColumn: GridColDef<CrmActivity> = useMemo(
    () => ({
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 140,
      getActions: ({ row }) => {
        const actions = [<GridActionsCellItem key="edit" icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={() => openEdit(row)} />]
        if (row.status === 'open') {
          actions.push(
            <GridActionsCellItem
              key="done"
              icon={<CircleCheck className="h-4 w-4" />}
              label="Complete"
              onClick={() => {
                void (async () => {
                  try {
                    await crmService.upsertActivity({
                      ...row,
                      subject: row.subject,
                      type: row.type,
                      status: 'done',
                      completedAt: new Date().toISOString(),
                    })
                    refresh()
                    setSnackbar({ open: true, message: 'Marked complete', severity: 'success' })
                  } catch {
                    setSnackbar({ open: true, message: 'Update failed', severity: 'error' })
                  }
                })()
              }}
            />
          )
        }
        actions.push(
          <GridActionsCellItem
            key="del"
            icon={<Trash2 className="h-4 w-4" />}
            label="Delete"
            onClick={() => {
              setActivityToDeleteId(row.id)
              setDeleteTarget('single')
            }}
          />
        )
        return actions
      },
    }),
    [canManage, openEdit, refresh]
  )

  const columns = canManage ? [...baseColumns, actionColumn] : baseColumns

  const selectedIds = useMemo(
    () => Array.from(selectionModel.ids).map((id) => String(id)),
    [selectionModel]
  )

  const isEmpty = !loading && !loadError && rows.length === 0

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Activities"
        subtitle="Calls, tasks, and meetings — tied to deals and contacts."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => crmService.downloadExport('activities')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage ? (
              <Button size="sm" className="gap-1" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Log activity
              </Button>
            ) : null}
          </div>
        }
      />
      <CrmSubnav />

      <p className="mb-4 text-sm text-muted-foreground">
        Tasks past due are highlighted on the CRM overview as overdue work.
      </p>

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search activities…">
        <div className="space-y-1.5">
          <Label className="sr-only">Type</Label>
          <Select value={typeFilter} onValueChange={(v) => setParam('type', v)}>
            <SelectTrigger className="h-9 w-[min(100%,8rem)] sm:w-32" aria-label="Type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="sr-only">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setParam('status', v)}>
            <SelectTrigger className="h-9 w-[min(100%,8rem)] sm:w-32" aria-label="Status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUS_OPTS.map((s) => (
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
              title="No activities yet"
              description="Log calls, meetings, and tasks so your team keeps context in one place."
              actionLabel={canManage ? 'Log activity' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card>
          <CardContent className="p-0">
            {filteredRows.length === 0 && rows.length > 0 ? (
              <CrmEmptyState title="No matching activities" description="Try adjusting search or filters." />
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
        open={deleteTarget === 'single' && !!activityToDeleteId}
        title="Delete this activity?"
        description="This cannot be undone."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setActivityToDeleteId(null)
          }
        }}
        onConfirm={async () => {
          if (activityToDeleteId) await runDeleteIds([activityToDeleteId])
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'bulk'}
        title={`Delete ${selectedIds.length} activities?`}
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
            <DialogTitle>{editing ? 'Edit activity' : 'Log activity'}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[75vh] flex-col gap-3 overflow-y-auto py-1 pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="act-subj">Subject *</Label>
              <Input
                id="act-subj"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CrmActivityType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as CrmActivityStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as 'low' | 'normal' | 'high' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">low</SelectItem>
                  <SelectItem value="normal">normal</SelectItem>
                  <SelectItem value="high">high</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-due">Due</Label>
              <Input
                id="act-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Related type</Label>
              <Select
                value={form.relatedType || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    relatedType: (v === 'none' ? '' : v) as '' | CrmRelatedType,
                    relatedId: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.relatedType === 'deal' ? (
              <div className="space-y-1.5">
                <Label>Deal</Label>
                <Select value={form.relatedId} onValueChange={(v) => setForm((f) => ({ ...f, relatedId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {form.relatedType === 'contact' ? (
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Select value={form.relatedId} onValueChange={(v) => setForm((f) => ({ ...f, relatedId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {form.relatedType === 'company' ? (
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Select value={form.relatedId} onValueChange={(v) => setForm((f) => ({ ...f, relatedId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="act-body">Details</Label>
              <Textarea
                id="act-body"
                rows={3}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
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
                if (!form.subject.trim()) {
                  setSnackbar({ open: true, message: 'Subject is required', severity: 'error' })
                  return
                }
                const relType = form.relatedType || undefined
                const relId = form.relatedId || undefined
                void (async () => {
                  try {
                    await crmService.upsertActivity({
                      id: editing?.id,
                      subject: form.subject.trim(),
                      type: form.type,
                      status: form.status,
                      priority: form.priority,
                      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
                      relatedType: relType,
                      relatedId: relType ? relId : undefined,
                      body: form.body || undefined,
                      completedAt:
                        form.status === 'done' ? editing?.completedAt ?? new Date().toISOString() : undefined,
                    })
                    setOpen(false)
                    refresh()
                    setSnackbar({ open: true, message: 'Activity saved', severity: 'success' })
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
