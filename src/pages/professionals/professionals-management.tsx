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
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import {
  ProfessionalTable,
  ProfessionalFilters,
  ProfessionalStatsWidget,
} from '../../components/professionals'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { Professional, UpdateVerificationData, UpdateAvailabilityData } from '../../types/professional.types'
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

  // Pagination
  const [page, setPage] = useState(0)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  // Dialogs
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)

  // Verification form
  const [verificationData, setVerificationData] = useState<UpdateVerificationData>({
    isVerified: false,
    verificationNotes: '',
  })

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
  }, [page, limit, searchTerm, availabilityFilter, expertiseFilter, verificationFilter, categoryFilter])

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const query: any = {
        page: page + 1,
        limit,
        search: searchTerm || undefined,
        availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
        expertiseLevel: expertiseFilter !== 'all' ? expertiseFilter : undefined,
        isVerified: verificationFilter === 'verified' ? true : verificationFilter === 'pending' ? false : undefined,
      }

      const response = await ProfessionalsService.getProfessionals(query)
      
      if (response.data?.professionals) {
        setProfessionals(response.data.professionals)
        setTotal(response.data.pagination?.total || 0)
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

  const handleView = (professional: Professional) => {
    // TODO: Open details dialog
    console.log('View professional:', professional)
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
      await ProfessionalsService.updateVerification(selectedProfessional._id, verificationData)
      showSnackbar('Verification updated successfully', 'success')
      handleSuccess()
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update verification', 'error')
    } finally {
      setVerificationDialogOpen(false)
      setSelectedProfessional(null)
      setVerificationData({ isVerified: false, verificationNotes: '' })
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
      setVerificationData({
        isVerified: menuProfessional.isVerified,
        verificationNotes: '',
      })
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
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Professionals Table */}
      <ProfessionalTable
        professionals={professionals}
        loading={loading}
        onMenuClick={handleMenuClick}
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

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Verification Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Verification Status</InputLabel>
              <Select
                value={verificationData.isVerified ? 'verified' : 'pending'}
                onChange={(e) =>
                  setVerificationData({
                    ...verificationData,
                    isVerified: e.target.value === 'verified',
                  })
                }
                label="Verification Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={verificationData.verificationNotes || ''}
              onChange={(e) =>
                setVerificationData({
                  ...verificationData,
                  verificationNotes: e.target.value,
                })
              }
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

