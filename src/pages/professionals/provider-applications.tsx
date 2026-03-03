/**
 * Provider Applications (Professional onboarding) list and detail.
 * Admin view for "Become a Provider" form submissions.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Drawer,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
  Divider,
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbarContainer,
} from '@mui/x-data-grid'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import {
  ProfessionalApplicationsService,
  ProfessionalApplication,
  ProfessionalApplicationStatus,
} from '../../services/api/professionalApplications.service'

const STATUS_OPTIONS: { value: ProfessionalApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
]

const statusColors: Record<ProfessionalApplicationStatus, string> = {
  new: '#2196F3',
  contacted: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
  archived: '#9E9E9E',
}

function formatDate(value: string | undefined) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
      {/* Filters are rendered in the page, not in the grid toolbar */}
    </GridToolbarContainer>
  )
}

export function ProviderApplications() {
  const [applications, setApplications] = useState<ProfessionalApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<ProfessionalApplicationStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<ProfessionalApplication | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusValue, setStatusValue] = useState<ProfessionalApplicationStatus | ''>('')
  const [adminNotes, setAdminNotes] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ProfessionalApplicationsService.getList({
        page,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        city: cityFilter || undefined,
      })
      setApplications(Array.isArray(res.data) ? res.data : [])
      const meta = (res as { meta?: { pagination?: { total?: number } } }).meta
      setTotal(meta?.pagination?.total ?? 0)
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to load applications', severity: 'error' })
      setApplications([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, searchTerm, cityFilter])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleRefresh = () => {
    fetchList()
    if (selectedApp) {
      ProfessionalApplicationsService.getById(selectedApp._id).then((res) => {
        if (res.data) setSelectedApp(res.data as ProfessionalApplication)
      }).catch(() => {})
    }
  }

  const handleRowClick = (params: { row: ProfessionalApplication }) => {
    setSelectedApp(params.row)
    setStatusValue(params.row.status)
    setAdminNotes(params.row.adminNotes ?? '')
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedApp(null)
    setStatusValue('')
    setAdminNotes('')
  }

  const handleUpdateStatus = async () => {
    if (!selectedApp || !statusValue) return
    try {
      setDetailLoading(true)
      await ProfessionalApplicationsService.updateStatus(selectedApp._id, {
        status: statusValue as ProfessionalApplicationStatus,
        adminNotes: adminNotes || undefined,
      })
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' })
      const updated = await ProfessionalApplicationsService.getById(selectedApp._id)
      if (updated.data) setSelectedApp(updated.data as ProfessionalApplication)
      fetchList()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to update status', severity: 'error' })
    } finally {
      setDetailLoading(false)
    }
  }

  const columns: GridColDef[] = [
    { field: 'applicationId', headerName: 'ID', width: 110 },
    { field: 'fullName', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'phone', headerName: 'Phone', width: 120 },
    { field: 'city', headerName: 'City', width: 120 },
    {
      field: 'servicesInterested',
      headerName: 'Services',
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        const arr = params.value as string[] | undefined
        if (!arr?.length) return '—'
        return (
          <Typography variant="body2" noWrap title={arr.join(', ')}>
            {arr.join(', ')}
          </Typography>
        )
      },
    },
    { field: 'experienceYears', headerName: 'Exp (y)', width: 80, type: 'number' },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => {
        const s = params.value as ProfessionalApplicationStatus
        return (
          <Chip
            size="small"
            label={s ?? '—'}
            sx={{
              bgcolor: alpha(statusColors[s] || '#9E9E9E', 0.2),
              color: statusColors[s] || '#616161',
              fontWeight: 600,
            }}
          />
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Applied',
      width: 150,
      valueFormatter: (value) => formatDate(value as string),
    },
  ]

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Provider Applications"
        subtitle="Onboarding applications from the Become a Provider form"
        action={
          <Button startIcon={<RefreshIcon />} onClick={handleRefresh} variant="outlined" size="medium">
            Refresh
          </Button>
        }
      />

      <Card sx={{ borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search name, phone, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchList()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as ProfessionalApplicationStatus | 'all')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="City"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchList()}
              sx={{ minWidth: 140 }}
            />
            <Button variant="contained" onClick={() => fetchList()}>
              Apply filters
            </Button>
          </Box>

          <Box sx={{ height: 560, width: '100%' }}>
            <DataGrid
              rows={applications}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              disableRowSelectionOnClick
              onRowClick={({ row }) => handleRowClick({ row })}
              slots={{ toolbar: Toolbar }}
              paginationMode="server"
              rowCount={total}
              paginationModel={{ page: page - 1, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page + 1)
                if (model.pageSize !== pageSize) {
                  setPageSize(model.pageSize)
                  setPage(1)
                }
              }}
              pageSizeOptions={[10, 20, 50]}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha('#667eea', 0.06),
                  borderBottom: '1px solid',
                  borderBottomColor: alpha('#000', 0.06),
                },
                '& .MuiDataGrid-row:hover': { bgcolor: alpha('#2196F3', 0.04), cursor: 'pointer' },
              }}
              localeText={{ noRowsLabel: 'No applications match your filters.' }}
            />
          </Box>
        </CardContent>
      </Card>

      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={handleCloseDetail}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Application details</Typography>
            <IconButton onClick={handleCloseDetail} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {selectedApp && (
            <>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedApp.fullName}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedApp.phone}</Typography>

                {selectedApp.email && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Email</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedApp.email}</Typography>
                  </>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">City</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedApp.city}</Typography>
                {selectedApp.state && <Typography variant="body2" sx={{ mb: 2 }}>State: {selectedApp.state}</Typography>}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Services</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedApp.servicesInterested?.length ? selectedApp.servicesInterested.join(', ') : '—'}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Experience (years)</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedApp.experienceYears ?? '—'}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Applied</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>{formatDate(selectedApp.createdAt)}</Typography>

                {selectedApp.message && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Message</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>{selectedApp.message}</Typography>
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Update status</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusValue}
                    label="Status"
                    onChange={(e) => setStatusValue(e.target.value as ProfessionalApplicationStatus)}
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <NotesIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">Admin notes</Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleUpdateStatus}
                  disabled={detailLoading}
                  startIcon={detailLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {detailLoading ? 'Saving...' : 'Save status & notes'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
