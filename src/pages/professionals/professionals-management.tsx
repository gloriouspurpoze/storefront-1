/**
 * ============================================================================
 * PROFESSIONALS MANAGEMENT PAGE
 * ============================================================================
 * Main page for managing professionals (workers/technicians)
 * 
 * Features:
 * - List all professionals with filters
 * - Search by name, email, phone
 * - Filter by availability, expertise, verification
 * - Create/Edit/Delete professionals
 * - Update verification status
 * - Update availability status
 * - View statistics
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CheckCircle as VerifiedIcon,
  AccessTime as AvailabilityIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import {
  ProfessionalTable,
  ProfessionalFilters,
  ProfessionalStatsWidget,
} from '../../components/professionals'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { Professional, UpdateAvailabilityData } from '../../types/professional.types'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import { useNavigate } from 'react-router-dom'

export function ProfessionalsManagement() {
  const navigate = useNavigate()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(Date.now())

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [expertiseFilter, setExpertiseFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')

  // Pagination
  const [page, setPage] = useState(0)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  // Dialogs
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingProfessional, setViewingProfessional] = useState<Professional | null>(null)

  const [verificationForm, setVerificationForm] = useState<{
    status: 'pending' | 'verified' | 'rejected'
    notes: string
  }>({ status: 'pending', notes: '' })

  // Availability form
  const [availabilityData, setAvailabilityData] = useState<UpdateAvailabilityData>({
    availability: 'available',
    reason: '',
  })

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuProfessional, setMenuProfessional] = useState<Professional | null>(null)

  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  useEffect(() => {
    fetchProfessionals()
  }, [page, limit, searchTerm, availabilityFilter, expertiseFilter, verificationFilter, categoryFilter, accountFilter])

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const query: Record<string, string | number | boolean | undefined> = {
        page: page + 1,
        limit,
        search: searchTerm || undefined,
        availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
        expertiseLevel: expertiseFilter !== 'all' ? expertiseFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      }
      if (verificationFilter === 'verified') {
        query.isVerified = true
      } else if (verificationFilter === 'pending') {
        query.isVerified = false
        query.verificationStatus = 'pending'
      } else if (verificationFilter === 'rejected') {
        query.verificationStatus = 'rejected'
      }
      if (accountFilter === 'active') {
        query.isActive = true
      } else if (accountFilter === 'inactive') {
        query.isActive = false
      }

      const response = await ProfessionalsService.getProfessionals(query as any)
      const payload = response.data as { professionals?: Professional[]; pagination?: { total: number } } | undefined
      if (payload?.professionals) {
        setProfessionals(payload.professionals)
        setTotal(payload.pagination?.total || 0)
      } else {
        setProfessionals([])
        setTotal(0)
      }
    } catch (error: any) {
      console.error('Error fetching professionals:', error)
      showSnackbar(error.message || 'Failed to fetch professionals', 'error')
      setProfessionals([])
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    fetchProfessionals()
    setRefreshKey(Date.now())
  }

  const handleCreate = () => {
    navigate('/professionals/create')
  }

  const handleEdit = (professional: Professional) => {
    navigate(`/professionals/edit/${professional._id}`)
    handleMenuClose()
  }

  const handleOpenHub = (professional: Professional) => {
    navigate(`/professionals/${professional._id}`)
    handleMenuClose()
  }

  const handleView = (professional: Professional) => {
    setViewingProfessional(professional)
    setViewDialogOpen(true)
    handleMenuClose()
  }

  const handleDelete = async () => {
    if (!selectedProfessional) return

    try {
      await ProfessionalsService.deleteProfessional(selectedProfessional._id)
      showSnackbar('Professional deleted successfully', 'success')
      handleSuccess()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete professional', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedProfessional(null)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!selectedProfessional) return

    try {
      const status = verificationForm.status
      await ProfessionalsService.updateVerification(selectedProfessional._id, {
        isVerified: status === 'verified',
        verificationStatus: status,
        verificationNotes: verificationForm.notes || undefined,
      })
      showSnackbar('Verification updated successfully', 'success')
      handleSuccess()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update verification', 'error')
    } finally {
      setVerificationDialogOpen(false)
      setSelectedProfessional(null)
      setVerificationForm({ status: 'pending', notes: '' })
    }
  }

  const handleAvailabilitySubmit = async () => {
    if (!selectedProfessional) return

    try {
      await ProfessionalsService.updateAvailability(selectedProfessional._id, availabilityData)
      showSnackbar('Availability updated successfully', 'success')
      handleSuccess()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update availability', 'error')
    } finally {
      setAvailabilityDialogOpen(false)
      setSelectedProfessional(null)
      setAvailabilityData({ availability: 'available', reason: '' })
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, professional: Professional) => {
    setMenuAnchor(event.currentTarget)
    setMenuProfessional(professional)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuProfessional(null)
  }

  const openVerificationDialog = () => {
    if (menuProfessional) {
      setSelectedProfessional(menuProfessional)
      const v = menuProfessional.verificationStatus
      let status: 'pending' | 'verified' | 'rejected' = 'pending'
      if (v === 'verified' || v === 'rejected' || v === 'pending') {
        status = v
      } else if (menuProfessional.isVerified) {
        status = 'verified'
      }
      setVerificationForm({ status, notes: '' })
      setVerificationDialogOpen(true)
    }
    handleMenuClose()
  }

  const openAvailabilityDialog = () => {
    if (menuProfessional) {
      setSelectedProfessional(menuProfessional)
      setAvailabilityData({
        availability: menuProfessional.availability,
        reason: '',
      })
      setAvailabilityDialogOpen(true)
    }
    handleMenuClose()
  }

  const openDeleteDialog = () => {
    if (menuProfessional) {
      setSelectedProfessional(menuProfessional)
      setDeleteDialogOpen(true)
    }
    handleMenuClose()
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setAvailabilityFilter('all')
    setExpertiseFilter('all')
    setVerificationFilter('all')
    setCategoryFilter('all')
    setAccountFilter('all')
    setPage(0)
  }

  const handleApplyFilters = () => {
    setPage(0)
    fetchProfessionals()
  }

  return (
    <Box>
      <PageHeader
        title="Professionals"
        subtitle="Manage service professionals (workers/technicians)"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ borderRadius: 2 }}
          >
            Add Professional
          </Button>
        }
      />

      {/* Stats Cards */}
      <ProfessionalStatsWidget onRefresh={refreshKey} />

      {/* Filters */}
      <ProfessionalFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        availabilityFilter={availabilityFilter}
        onAvailabilityChange={setAvailabilityFilter}
        expertiseFilter={expertiseFilter}
        onExpertiseChange={setExpertiseFilter}
        verificationFilter={verificationFilter}
        onVerificationChange={setVerificationFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        accountFilter={accountFilter}
        onAccountFilterChange={setAccountFilter}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Professionals Table */}
      <ProfessionalTable
        professionals={professionals}
        loading={loading}
        onMenuClick={handleMenuClick}
        onOpenHub={handleOpenHub}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => menuProfessional && handleView(menuProfessional)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => menuProfessional && handleOpenHub(menuProfessional)}>
          <DashboardIcon sx={{ mr: 1 }} fontSize="small" />
          Command center
        </MenuItem>
        <MenuItem onClick={() => menuProfessional && handleEdit(menuProfessional)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={openVerificationDialog}>
          <VerifiedIcon sx={{ mr: 1 }} fontSize="small" />
          Update Verification
        </MenuItem>
        <MenuItem onClick={openAvailabilityDialog}>
          <AvailabilityIcon sx={{ mr: 1 }} fontSize="small" />
          Update Availability
        </MenuItem>
        <Divider />
        <MenuItem onClick={openDeleteDialog} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* View details */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Professional details</DialogTitle>
        <DialogContent>
          {viewingProfessional && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Name and ID
              </Typography>
              <Typography sx={{ mb: 2 }}>
                {viewingProfessional.firstName} {viewingProfessional.lastName} — {viewingProfessional.professionalId}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Contact
              </Typography>
              <Typography sx={{ mb: 0.5 }}>{viewingProfessional.email}</Typography>
              <Typography sx={{ mb: 2 }}>{viewingProfessional.phoneNumber}</Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Trades / categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {(viewingProfessional.categories || []).map((c) => (
                  <span key={c} style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                    {getProfessionalCategoryLabel(c)}
                  </span>
                ))}
                {(viewingProfessional.categories || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                )}
              </Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Work
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Expertise: {viewingProfessional.expertiseLevel} · {viewingProfessional.experience} years experience
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Availability: {viewingProfessional.availability} · Verification: {viewingProfessional.verificationStatus}
              </Typography>
              {viewingProfessional.serviceProviderId && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Company: {viewingProfessional.serviceProviderId.businessName}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewingProfessional ? (
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false)
                navigate(`/professionals/${viewingProfessional._id}`)
              }}
            >
              Command center
            </Button>
          ) : null}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Verification Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Verification status</InputLabel>
              <Select
                value={verificationForm.status}
                onChange={(e) =>
                  setVerificationForm({
                    ...verificationForm,
                    status: e.target.value as 'pending' | 'verified' | 'rejected',
                  })
                }
                label="Verification status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Admin notes (optional)"
              value={verificationForm.notes}
              onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleVerificationSubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={availabilityDialogOpen} onClose={() => setAvailabilityDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Availability</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availabilityData.availability}
                onChange={(e) =>
                  setAvailabilityData({
                    ...availabilityData,
                    availability: e.target.value as any,
                  })
                }
                label="Availability"
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="busy">Busy</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Reason (Optional)"
              value={availabilityData.reason || ''}
              onChange={(e) =>
                setAvailabilityData({
                  ...availabilityData,
                  reason: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvailabilityDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAvailabilitySubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Professional</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedProfessional?.firstName} {selectedProfessional?.lastName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

