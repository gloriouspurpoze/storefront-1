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
import { CrmWhatsAppStaffPlaybook } from '../../components/crm/CrmWhatsAppStaffPlaybook'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRowSelectionModel,
} from '../../components/crm/CrmDataTable'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useCrmFieldAccess } from '../../hooks/useCrmFieldAccess'
import { buildCrmContactUpsertPayload, canCreateContactWithPolicies } from '../../lib/crmContactUpsertPayload'
import { useCrmSearchParam } from '../../hooks/useCrmUrlFilters'
import { activitiesForContact, filterContacts } from '../../utils/crmFilters'
import type { CrmActivity, CrmCompany, CrmContact, CrmContactLifecycle, CrmRecordType } from '../../types/crm.types'
import {
  ALL_CONTACT_LIFECYCLES,
  CONTACT_LIFECYCLE_LABELS,
  CRM_LEAD_SOURCE_PRESETS,
  CRM_WHATSAPP_LEAD_SOURCE,
  RECORD_TYPE_LABELS,
} from '../../lib/crmNiche'
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

const emptySelection: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function CrmContacts() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const { fields: crmFieldPolicies } = useCrmFieldAccess()
  const { qInput, setQInput, setParam, searchParams } = useCrmSearchParam()
  const lifecycleFilter = searchParams.get('lifecycle') ?? 'all'

  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmContact | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rows, setRows] = useState<CrmContact[]>([])
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
        setRows(contacts)
        setCompanies(co)
        setActivities(act)
      })
      .catch(() => {
        if (c) setLoadError('Could not load contacts. Check your connection and try again.')
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

  const companyName = useCallback(
    (id?: string) => (id ? companies.find((x) => x.id === id)?.name : undefined),
    [companies]
  )

  const filteredRows = useMemo(
    () => filterContacts(rows, qInput, lifecycleFilter, companyName),
    [rows, qInput, lifecycleFilter, companyName]
  )

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    companyId: '' as string | undefined,
    recordType: 'customer' as CrmRecordType,
    lifecycle: 'inquiry' as CrmContactLifecycle,
    leadSource: '',
    notes: '',
    locality: '',
    serviceCategory: '',
    platformUserId: '',
    platformBookingId: '',
    platformOrderId: '',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      companyId: undefined,
      recordType: 'customer',
      lifecycle: 'inquiry',
      leadSource: '',
      notes: '',
      locality: '',
      serviceCategory: '',
      platformUserId: '',
      platformBookingId: '',
      platformOrderId: '',
    })
    setOpen(true)
  }

  const openCreateWithLeadSource = (leadSource: string) => {
    setEditing(null)
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      companyId: undefined,
      recordType: 'customer',
      lifecycle: 'inquiry',
      leadSource,
      notes: '',
      locality: '',
      serviceCategory: '',
      platformUserId: '',
      platformBookingId: '',
      platformOrderId: '',
    })
    setOpen(true)
  }

  const openEdit = useCallback((row: CrmContact) => {
    setEditing(row)
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone ?? '',
      jobTitle: row.jobTitle ?? '',
      companyId: row.companyId,
      recordType: row.recordType ?? 'customer',
      lifecycle: row.lifecycle,
      leadSource: row.leadSource ?? '',
      notes: row.notes ?? '',
      locality: row.locality ?? '',
      serviceCategory: row.serviceCategory ?? '',
      platformUserId: row.platformUserId ?? '',
      platformBookingId: row.platformBookingId ?? '',
      platformOrderId: row.platformOrderId ?? '',
    })
    setOpen(true)
  }, [])

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteContact(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'Contacts removed' : 'Contact removed', severity: 'success' })
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
        field: 'recordType',
        headerName: 'Type',
        width: 140,
        renderCell: (p) => (
          <Badge variant="secondary" className="font-normal">
            {RECORD_TYPE_LABELS[p.row.recordType ?? 'customer']}
          </Badge>
        ),
      },
      {
        field: 'lifecycle',
        headerName: 'Stage',
        width: 150,
        renderCell: (p) => (
          <Badge variant="outline" className="font-normal">
            {CONTACT_LIFECYCLE_LABELS[p.row.lifecycle]}
          </Badge>
        ),
      },
      { field: 'locality', headerName: 'Locality', width: 110 },
      { field: 'leadSource', headerName: 'Source', width: 110 },
      {
        field: 'companyId',
        headerName: 'B2B account',
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
            <GridActionsCellItem
              icon={<Eye className="h-4 w-4" />}
              label="Details"
              onClick={() => setDrawerContact(p.row)}
            />
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

  const isEmpty = !loading && !loadError && rows.length === 0

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Contacts"
        subtitle="Customers, partners, and B2B contacts — link to platform user / booking / order when known."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => crmService.downloadExport('contacts')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage ? (
              <>
                <Button type="button" size="sm" variant="secondary" className="gap-1" onClick={() => openCreateWithLeadSource(CRM_WHATSAPP_LEAD_SOURCE)}>
                  <Plus className="h-4 w-4" />
                  Add WhatsApp contact
                </Button>
                <Button size="sm" className="gap-1" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Add contact
                </Button>
              </>
            ) : null}
          </div>
        }
      />
      <CrmSubnav />

      <div className="mb-4">
        <CrmWhatsAppStaffPlaybook />
      </div>

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search contacts…">
        <div className="space-y-1.5">
          <Label className="sr-only">Lifecycle</Label>
          <Select value={lifecycleFilter} onValueChange={(v) => setParam('lifecycle', v)}>
            <SelectTrigger className="h-9 w-[min(100%,10rem)] sm:w-40" aria-label="Lifecycle">
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {ALL_CONTACT_LIFECYCLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTACT_LIFECYCLE_LABELS[s]}
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
              title="No contacts yet"
              description="Add homeowners, partners, or B2B contacts and link them to the platform when IDs exist."
              actionLabel={canManage ? 'Add contact' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card>
          <CardContent className="p-0">
            {filteredRows.length === 0 && rows.length > 0 ? (
              <CrmEmptyState title="No matching contacts" description="Try adjusting search or lifecycle filter." />
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
        title="Delete this contact?"
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
        title={`Delete ${selectedIds.length} contacts?`}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit contact' : 'New contact'}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto py-1 pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="ct-first">First name *</Label>
              <Input
                id="ct-first"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-last">Last name *</Label>
              <Input
                id="ct-last"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-email">Email *</Label>
              <Input
                id="ct-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-phone">Phone</Label>
              <Input
                id="ct-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-title">Role / job title (optional)</Label>
              <Input
                id="ct-title"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Record type</Label>
              <Select
                value={form.recordType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    recordType: v as CrmRecordType,
                    lifecycle:
                      v === 'partner' && !f.lifecycle.startsWith('partner_')
                        ? 'partner_applied'
                        : v !== 'partner' && f.lifecycle.startsWith('partner_')
                          ? 'inquiry'
                          : f.lifecycle,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RECORD_TYPE_LABELS) as CrmRecordType[]).map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {RECORD_TYPE_LABELS[rt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>B2B account</Label>
              <Select
                value={form.companyId ?? 'none'}
                onValueChange={(v) => setForm((f) => ({ ...f, companyId: v === 'none' ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="B2B account" />
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
              <Label>Lifecycle / stage</Label>
              <Select
                value={form.lifecycle}
                onValueChange={(v) => setForm((f) => ({ ...f, lifecycle: v as CrmContactLifecycle }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CONTACT_LIFECYCLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CONTACT_LIFECYCLE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-locality">Locality</Label>
              <Input
                id="ct-locality"
                value={form.locality}
                onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
                placeholder="e.g. Borivali"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-svc">Service category</Label>
              <Input
                id="ct-svc"
                value={form.serviceCategory}
                onChange={(e) => setForm((f) => ({ ...f, serviceCategory: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-src">Lead source</Label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {CRM_LEAD_SOURCE_PRESETS.slice(0, 5).map((src) => (
                  <Button
                    key={src}
                    type="button"
                    size="sm"
                    variant={form.leadSource === src ? 'default' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => setForm((f) => ({ ...f, leadSource: src }))}
                  >
                    {src}
                  </Button>
                ))}
              </div>
              <Input
                id="ct-src"
                list="crm-contact-sources"
                value={form.leadSource}
                onChange={(e) => setForm((f) => ({ ...f, leadSource: e.target.value }))}
                placeholder="e.g. WhatsApp"
              />
              <datalist id="crm-contact-sources">
                {CRM_LEAD_SOURCE_PRESETS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-puid">Platform user ID</Label>
              <p className="text-xs text-muted-foreground">From admin Users — enables “Open user” in the contact panel.</p>
              <Input
                id="ct-puid"
                value={form.platformUserId}
                onChange={(e) => setForm((f) => ({ ...f, platformUserId: e.target.value }))}
                placeholder="Mongo ObjectId"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-pbid">Platform booking ID</Label>
              <p className="text-xs text-muted-foreground">From Bookings detail URL when a job exists.</p>
              <Input
                id="ct-pbid"
                value={form.platformBookingId}
                onChange={(e) => setForm((f) => ({ ...f, platformBookingId: e.target.value }))}
                placeholder="Booking id"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-poid">Platform order ID</Label>
              <p className="text-xs text-muted-foreground">From Orders when payment / order context exists.</p>
              <Input
                id="ct-poid"
                value={form.platformOrderId}
                onChange={(e) => setForm((f) => ({ ...f, platformOrderId: e.target.value }))}
                placeholder="Order id"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-notes">Notes</Label>
              <Textarea
                id="ct-notes"
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
                if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
                  setSnackbar({ open: true, message: 'Name and email are required', severity: 'error' })
                  return
                }
                if (!editing?.id && !canCreateContactWithPolicies(crmFieldPolicies)) {
                  setSnackbar({
                    open: true,
                    message:
                      'CRM field policies block creating contacts (first name, last name, or email is read-only for your role). Ask an admin to update field policies.',
                    severity: 'error',
                  })
                  return
                }
                void (async () => {
                  try {
                    const payload = buildCrmContactUpsertPayload(crmFieldPolicies, {
                      id: editing?.id,
                      firstName: form.firstName,
                      lastName: form.lastName,
                      email: form.email,
                      phone: form.phone || undefined,
                      jobTitle: form.jobTitle || undefined,
                      companyId: form.companyId,
                      recordType: form.recordType,
                      lifecycle: form.lifecycle,
                      leadSource: form.leadSource || undefined,
                      notes: form.notes || undefined,
                      locality: form.locality || undefined,
                      serviceCategory: form.serviceCategory || undefined,
                      platformUserId: form.platformUserId.trim() || undefined,
                      platformBookingId: form.platformBookingId.trim() || undefined,
                      platformOrderId: form.platformOrderId.trim() || undefined,
                    })
                    await crmService.upsertContact(payload)
                    setOpen(false)
                    refresh()
                    setSnackbar({ open: true, message: 'Contact saved', severity: 'success' })
                  } catch (e: unknown) {
                    setSnackbar({
                      open: true,
                      message: e instanceof Error ? e.message : 'Save failed',
                      severity: 'error',
                    })
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
              : 'border-storm-deep bg-storm-deep text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
