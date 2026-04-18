import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Chip,
  Snackbar,
  Alert,
  Stack,
  Typography,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { ConfirmDeleteDialog } from '../../components/crm/ConfirmDeleteDialog'
import { CrmListToolbar } from '../../components/crm/CrmListToolbar'
import { CrmListShell } from '../../components/crm/CrmListShell'
import { CrmEmptyState } from '../../components/crm/CrmEmptyState'
import { CrmDataGridSkeleton } from '../../components/crm/CrmDataGridSkeleton'
import { CrmContactDetailDrawer } from '../../components/crm/CrmRecordDrawers'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useCrmSearchParam } from '../../hooks/useCrmUrlFilters'
import { activitiesForContact, filterContacts } from '../../utils/crmFilters'
import type { CrmActivity, CrmCompany, CrmContact, CrmContactLifecycle } from '../../types/crm.types'

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
        renderCell: (p) => <Chip size="small" label={p.value} variant="outlined" />,
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
          <GridActionsCellItem icon={<ViewIcon />} label="Details" onClick={() => setDrawerContact(p.row)} />
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
          <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => openEdit(p.row)} />,
          <GridActionsCellItem
            key="del"
            icon={<DeleteIcon />}
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Leads"
        subtitle="Pre-customer contacts in your marketing & sales funnel."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => crmService.downloadExport('contacts')}>
              Export CSV
            </Button>
            {canManage ? (
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => {
                  setEditing(null)
                  resetForm()
                  setOpen(true)
                }}
              >
                New lead
              </Button>
            ) : null}
          </Stack>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search leads…">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Funnel stage</InputLabel>
          <Select label="Funnel stage" value={lifecycleFilter} onChange={(e) => setParam('lifecycle', e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {FUNNEL.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CrmListToolbar>

      {canManage && selectedIds.length > 0 ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2">{selectedIds.length} selected</Typography>
          <Button size="small" color="error" variant="outlined" onClick={() => setDeleteTarget('bulk')}>
            Delete selected
          </Button>
        </Stack>
      ) : null}

      <CrmListShell
        loading={loading}
        error={loadError}
        onRetry={refresh}
        isEmpty={isEmpty}
        empty={
          <Card variant="outlined">
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
        <Card variant="outlined">
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {filteredRows.length === 0 && leadRows.length > 0 ? (
              <CrmEmptyState title="No matching leads" description="Try adjusting search or funnel stage." />
            ) : (
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(r) => r.id}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                checkboxSelection={canManage}
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={setSelectionModel}
                disableRowSelectionOnClick
                autoHeight
                sx={{ border: 'none', minHeight: 360 }}
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit lead' : 'New lead'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="First name"
            required
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <TextField
            label="Last name"
            required
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <TextField label="Title" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
          <FormControl fullWidth>
            <InputLabel>Company</InputLabel>
            <Select
              label="Company"
              value={form.companyId ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyId: e.target.value ? String(e.target.value) : undefined }))
              }
            >
              <MenuItem value="">None</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Funnel stage</InputLabel>
            <Select
              label="Funnel stage"
              value={form.lifecycle}
              onChange={(e) => setForm((f) => ({ ...f, lifecycle: e.target.value as CrmContactLifecycle }))}
            >
              {FUNNEL.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Lead source"
            value={form.leadSource}
            onChange={(e) => setForm((f) => ({ ...f, leadSource: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
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
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
