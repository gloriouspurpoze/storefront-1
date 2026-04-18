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
  Typography,
  Chip,
  Snackbar,
  Alert,
  Stack,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as DoneIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { ConfirmDeleteDialog } from '../../components/crm/ConfirmDeleteDialog'
import { CrmListToolbar } from '../../components/crm/CrmListToolbar'
import { CrmListShell } from '../../components/crm/CrmListShell'
import { CrmEmptyState } from '../../components/crm/CrmEmptyState'
import { CrmDataGridSkeleton } from '../../components/crm/CrmDataGridSkeleton'
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

  const relatedLabel = (t?: CrmRelatedType, id?: string) => {
    if (!t || !id) return '—'
    if (t === 'deal') return deals.find((d) => d.id === id)?.name ?? id
    if (t === 'contact') {
      const c = contacts.find((x) => x.id === id)
      return c ? `${c.firstName} ${c.lastName}` : id
    }
    if (t === 'company') return companies.find((c) => c.id === id)?.name ?? id
    return '—'
  }

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

  const baseColumns: GridColDef<CrmActivity>[] = useMemo(() => [
    { field: 'subject', headerName: 'Subject', flex: 1.2, minWidth: 180 },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (p) => <Chip size="small" label={p.value} variant="outlined" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value}
          color={p.value === 'done' ? 'success' : p.value === 'open' ? 'primary' : 'default'}
        />
      ),
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
  ], [deals, contacts, companies])

  const actionColumn: GridColDef<CrmActivity> = useMemo(() => ({
    field: 'actions',
    type: 'actions',
    headerName: '',
    width: canManage ? 140 : 0,
    getActions: ({ row }) => {
      if (!canManage) return []
      const actions = [
        <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => openEdit(row)} />,
      ]
      if (row.status === 'open') {
        actions.push(
          <GridActionsCellItem
            key="done"
            icon={<DoneIcon />}
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
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => {
            setActivityToDeleteId(row.id)
            setDeleteTarget('single')
          }}
        />
      )
      return actions
    },
  }), [canManage, openEdit, refresh])

  const columns = canManage ? [...baseColumns, actionColumn] : baseColumns

  const selectedIds = useMemo(
    () => Array.from(selectionModel.ids).map((id) => String(id)),
    [selectionModel]
  )

  const isEmpty = !loading && !loadError && rows.length === 0

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Activities"
        subtitle="Calls, tasks, and meetings — tied to deals and contacts."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => crmService.downloadExport('activities')}>
              Export CSV
            </Button>
            {canManage ? (
              <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
                Log activity
              </Button>
            ) : null}
          </Stack>
        }
      />
      <CrmSubnav />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tasks past due are highlighted on the CRM overview as overdue work.
      </Typography>

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search activities…">
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeFilter} onChange={(e) => setParam('type', e.target.value)}>
            <MenuItem value="all">All types</MenuItem>
            {TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setParam('status', e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {STATUS_OPTS.map((s) => (
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
              title="No activities yet"
              description="Log calls, meetings, and tasks so your team keeps context in one place."
              actionLabel={canManage ? 'Log activity' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card variant="outlined">
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {filteredRows.length === 0 && rows.length > 0 ? (
              <CrmEmptyState title="No matching activities" description="Try adjusting search or filters." />
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit activity' : 'Log activity'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CrmActivityType }))}
            >
              {TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CrmActivityStatus }))}
            >
              {STATUS_OPTS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value as 'low' | 'normal' | 'high' }))
              }
            >
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="normal">normal</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Due"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={form.dueAt}
            onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>Related type</InputLabel>
            <Select
              label="Related type"
              value={form.relatedType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  relatedType: (e.target.value || '') as '' | CrmRelatedType,
                  relatedId: '',
                }))
              }
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="deal">Deal</MenuItem>
              <MenuItem value="contact">Contact</MenuItem>
              <MenuItem value="company">Company</MenuItem>
            </Select>
          </FormControl>
          {form.relatedType === 'deal' ? (
            <FormControl fullWidth>
              <InputLabel>Deal</InputLabel>
              <Select
                label="Deal"
                value={form.relatedId}
                onChange={(e) => setForm((f) => ({ ...f, relatedId: String(e.target.value) }))}
              >
                {deals.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          {form.relatedType === 'contact' ? (
            <FormControl fullWidth>
              <InputLabel>Contact</InputLabel>
              <Select
                label="Contact"
                value={form.relatedId}
                onChange={(e) => setForm((f) => ({ ...f, relatedId: String(e.target.value) }))}
              >
                {contacts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          {form.relatedType === 'company' ? (
            <FormControl fullWidth>
              <InputLabel>Company</InputLabel>
              <Select
                label="Company"
                value={form.relatedId}
                onChange={(e) => setForm((f) => ({ ...f, relatedId: String(e.target.value) }))}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          <TextField
            label="Details"
            multiline
            minRows={2}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
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
