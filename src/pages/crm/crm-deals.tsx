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
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { CrmDealPipelineBoard } from '../../components/crm/CrmDealPipelineBoard'
import { ConfirmDeleteDialog } from '../../components/crm/ConfirmDeleteDialog'
import { CrmListToolbar } from '../../components/crm/CrmListToolbar'
import { CrmListShell } from '../../components/crm/CrmListShell'
import { CrmEmptyState } from '../../components/crm/CrmEmptyState'
import { CrmDataGridSkeleton, CrmPipelineSkeleton } from '../../components/crm/CrmDataGridSkeleton'
import { CrmDealDetailDrawer } from '../../components/crm/CrmRecordDrawers'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useCrmSearchParam } from '../../hooks/useCrmUrlFilters'
import { activitiesForDeal, filterDeals } from '../../utils/crmFilters'
import type { CrmActivity, CrmCompany, CrmContact, CrmDeal, CrmDealStage } from '../../types/crm.types'

const STAGES: CrmDealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const STAGE_LABELS: Record<CrmDealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

const emptySelection: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function CrmDeals() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const [searchParams, setSearchParams] = useSearchParams()
  const { qInput, setQInput, setParam } = useCrmSearchParam()
  const stageFilter = searchParams.get('stage') ?? 'all'
  const view: 'pipeline' | 'table' = searchParams.get('view') === 'table' ? 'table' : 'pipeline'

  const setView = (v: 'pipeline' | 'table') => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (v === 'pipeline') p.delete('view')
        else p.set('view', 'table')
        return p
      },
      { replace: true }
    )
  }

  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmDeal | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rows, setRows] = useState<CrmDeal[]>([])
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelection)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [dealToDeleteId, setDealToDeleteId] = useState<string | null>(null)
  const [drawerDeal, setDrawerDeal] = useState<CrmDeal | null>(null)

  useEffect(() => {
    let c = true
    setLoading(true)
    setLoadError(null)
    Promise.all([
      crmService.listDeals(),
      crmService.listCompanies(),
      crmService.listContacts(),
      crmService.listActivities(),
    ])
      .then(([d, co, ct, act]) => {
        if (!c) return
        setRows(d)
        setCompanies(co)
        setContacts(ct)
        setActivities(act)
      })
      .catch(() => {
        if (c) setLoadError('Could not load deals. Check your connection and try again.')
      })
      .finally(() => {
        if (c) setLoading(false)
      })
    return () => {
      c = false
    }
  }, [tick])

  const filteredRows = useMemo(
    () => filterDeals(rows, qInput, stageFilter),
    [rows, qInput, stageFilter]
  )

  const [form, setForm] = useState({
    name: '',
    amount: 0,
    currency: 'GBP',
    stage: 'lead' as CrmDealStage,
    probability: 10,
    companyId: '' as string | undefined,
    primaryContactId: '' as string | undefined,
    expectedCloseDate: '',
    notes: '',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      amount: 0,
      currency: 'GBP',
      stage: 'lead',
      probability: 10,
      companyId: undefined,
      primaryContactId: undefined,
      expectedCloseDate: '',
      notes: '',
    })
    setOpen(true)
  }

  const openEdit = useCallback((row: CrmDeal) => {
    setEditing(row)
    setForm({
      name: row.name,
      amount: row.amount,
      currency: row.currency,
      stage: row.stage,
      probability: row.probability,
      companyId: row.companyId,
      primaryContactId: row.primaryContactId,
      expectedCloseDate: row.expectedCloseDate?.slice(0, 10) ?? '',
      notes: row.notes ?? '',
    })
    setOpen(true)
  }, [])

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const handleMoveDeal = useCallback(
    async (dealId: string, newStage: CrmDealStage) => {
      const deal = rows.find((d) => d.id === dealId)
      if (!deal || deal.stage === newStage) return
      const prev = rows
      setRows((r) => r.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)))
      try {
        await crmService.upsertDeal({
          id: deal.id,
          name: deal.name,
          amount: deal.amount,
          currency: deal.currency,
          stage: newStage,
          probability: deal.probability,
          companyId: deal.companyId,
          primaryContactId: deal.primaryContactId,
          expectedCloseDate: deal.expectedCloseDate,
          notes: deal.notes,
        })
        setSnackbar({ open: true, message: 'Stage updated', severity: 'success' })
      } catch {
        setRows(prev)
        setSnackbar({ open: true, message: 'Could not move deal', severity: 'error' })
        throw new Error('move failed')
      }
    },
    [rows]
  )

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteDeal(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'Deals removed' : 'Deal removed', severity: 'success' })
      setDeleteTarget(null)
      setDealToDeleteId(null)
    } catch {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const baseColumns: GridColDef<CrmDeal>[] = [
    { field: 'name', headerName: 'Deal', flex: 1.2, minWidth: 180 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      renderCell: (p) => formatMoney(p.row.amount, p.row.currency),
    },
    {
      field: 'stage',
      headerName: 'Stage',
      width: 130,
      renderCell: (p) => <Chip size="small" label={STAGE_LABELS[p.row.stage]} />,
    },
    { field: 'probability', headerName: '%', width: 70 },
    {
      field: 'expectedCloseDate',
      headerName: 'Close',
      width: 120,
      renderCell: (p) => (p.row.expectedCloseDate ? String(p.row.expectedCloseDate).slice(0, 10) : '—'),
    },
    {
      field: 'view',
      headerName: '',
      width: 70,
      sortable: false,
      renderCell: (p) => (
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="Details"
          onClick={() => setDrawerDeal(p.row)}
        />
      ),
    },
  ]

  const actionColumn: GridColDef<CrmDeal> = {
    field: 'actions',
    type: 'actions',
    headerName: '',
    width: 100,
    getActions: ({ row }) => [
      <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => openEdit(row)} />,
      <GridActionsCellItem
        key="del"
        icon={<DeleteIcon />}
        label="Delete"
        onClick={() => {
          setDealToDeleteId(row.id)
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
  const drawerActivities = drawerDeal ? activitiesForDeal(activities, drawerDeal.id) : []
  const drawerCompany = drawerDeal?.companyId
    ? companies.find((c) => c.id === drawerDeal.companyId)?.name
    : undefined
  const drawerContactName = useMemo(() => {
    if (!drawerDeal?.primaryContactId) return undefined
    const c = contacts.find((x) => x.id === drawerDeal.primaryContactId)
    return c ? `${c.firstName} ${c.lastName}` : undefined
  }, [drawerDeal, contacts])

  const toolbarFilters = (
    <>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Stage</InputLabel>
        <Select
          label="Stage"
          value={stageFilter}
          onChange={(e) => setParam('stage', e.target.value)}
        >
          <MenuItem value="all">All stages</MenuItem>
          {STAGES.map((s) => (
            <MenuItem key={s} value={s}>
              {STAGE_LABELS[s]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  )

  const isEmpty = !loading && !loadError && rows.length === 0

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Deals"
        subtitle="Opportunity pipeline with weighted value and expected close dates."
        action={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
            >
              <ToggleButton value="pipeline">Pipeline</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => crmService.downloadExport('deals')}>
              Export CSV
            </Button>
            {canManage ? (
              <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
                New deal
              </Button>
            ) : null}
          </Stack>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search deals…">
        {toolbarFilters}
      </CrmListToolbar>

      {canManage && view === 'table' && selectedIds.length > 0 ? (
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
              title="No deals yet"
              description="Create a deal to track opportunities through your pipeline."
              actionLabel={canManage ? 'New deal' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={view === 'pipeline' ? <CrmPipelineSkeleton /> : <CrmDataGridSkeleton />}
      >
        {view === 'table' ? (
          <Card variant="outlined">
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {filteredRows.length === 0 && rows.length > 0 ? (
                <CrmEmptyState title="No matching deals" description="Try adjusting search or stage filter." />
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
        ) : filteredRows.length === 0 && rows.length > 0 ? (
          <Card variant="outlined">
            <CrmEmptyState title="No matching deals" description="Try adjusting search or stage filter." />
          </Card>
        ) : (
          <CrmDealPipelineBoard
            stages={STAGES}
            stageLabels={STAGE_LABELS}
            deals={filteredRows}
            canManage={canManage}
            formatMoney={formatMoney}
            onEdit={openEdit}
            onViewDeal={(d) => setDrawerDeal(d)}
            onMoveDeal={handleMoveDeal}
          />
        )}
      </CrmListShell>

      <CrmDealDetailDrawer
        open={!!drawerDeal}
        onClose={() => setDrawerDeal(null)}
        deal={drawerDeal}
        formatMoney={formatMoney}
        companyName={drawerCompany}
        contactName={drawerContactName}
        activities={drawerActivities}
        onEdit={() => {
          if (drawerDeal) {
            openEdit(drawerDeal)
            setDrawerDeal(null)
          }
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'single' && !!dealToDeleteId}
        title="Delete this deal?"
        description="This cannot be undone. Related activities stay in the system but may show a broken link."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setDealToDeleteId(null)
          }
        }}
        onConfirm={async () => {
          if (dealToDeleteId) await runDeleteIds([dealToDeleteId])
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'bulk'}
        title={`Delete ${selectedIds.length} deals?`}
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
        <DialogTitle>{editing ? 'Edit deal' : 'New deal'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Deal name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
          />
          <TextField
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
          />
          <FormControl fullWidth>
            <InputLabel>Stage</InputLabel>
            <Select
              label="Stage"
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as CrmDealStage }))}
            >
              {STAGES.map((s) => (
                <MenuItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Probability %"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={form.probability}
            onChange={(e) => setForm((f) => ({ ...f, probability: Number(e.target.value) }))}
          />
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
            <InputLabel>Primary contact</InputLabel>
            <Select
              label="Primary contact"
              value={form.primaryContactId ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, primaryContactId: e.target.value ? String(e.target.value) : undefined }))
              }
            >
              <MenuItem value="">None</MenuItem>
              {contacts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Expected close"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.expectedCloseDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))}
          />
          <TextField
            label="Notes"
            multiline
            minRows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!form.name.trim()) {
                setSnackbar({ open: true, message: 'Deal name is required', severity: 'error' })
                return
              }
              void (async () => {
                try {
                  await crmService.upsertDeal({
                    id: editing?.id,
                    name: form.name.trim(),
                    amount: form.amount,
                    currency: form.currency || 'GBP',
                    stage: form.stage,
                    probability: Math.min(100, Math.max(0, form.probability)),
                    companyId: form.companyId,
                    primaryContactId: form.primaryContactId,
                    expectedCloseDate: form.expectedCloseDate || undefined,
                    notes: form.notes || undefined,
                  })
                  setOpen(false)
                  refresh()
                  setSnackbar({ open: true, message: 'Deal saved', severity: 'success' })
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
