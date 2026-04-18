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
  TextField,
  Snackbar,
  Alert,
  Stack,
  Typography,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material'
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
import { filterCompanies } from '../../utils/crmFilters'
import type { CrmCompany } from '../../types/crm.types'

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
      <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => openEdit(row)} />,
      <GridActionsCellItem
        key="del"
        icon={<DeleteIcon />}
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Companies"
        subtitle="Accounts and organizations — linked from contacts and deals."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => crmService.downloadExport('companies')}>
              Export CSV
            </Button>
            {canManage ? (
              <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
                Add company
              </Button>
            ) : null}
          </Stack>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search companies…" />

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
              title="No companies yet"
              description="Add accounts you work with so contacts and deals can link to them."
              actionLabel={canManage ? 'Add company' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={<CrmDataGridSkeleton />}
      >
        <Card variant="outlined">
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {filteredRows.length === 0 && rows.length > 0 ? (
              <CrmEmptyState title="No matching companies" description="Try a different search term." />
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit company' : 'New company'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField label="Industry" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          <TextField label="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <TextField label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <TextField label="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          <TextField
            label="Employees"
            value={form.employeeCount}
            onChange={(e) => setForm((f) => ({ ...f, employeeCount: e.target.value }))}
          />
          <TextField
            label="Annual revenue"
            value={form.annualRevenue}
            onChange={(e) => setForm((f) => ({ ...f, annualRevenue: e.target.value }))}
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
