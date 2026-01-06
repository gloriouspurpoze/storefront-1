import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Menu,
  Divider,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material'
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Star as StarIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { 
  ProviderTable, 
  ProviderFilters, 
  ProviderDetailsDialog,
  VerificationStatusDialog,
  DeleteProviderDialog,
  ProviderStatsWidget,
  BulkActions,
} from '../../components/providers'
import { ProvidersService } from '../../services/api/providers.service'
import { ServiceProvider } from '../../types'
import { useNavigate } from 'react-router-dom'

interface ProviderStats {
  total_providers: number
  verified_providers: number
  pending_providers: number
  average_rating: number
}

export function ProvidersManagement() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')

  // Pagination
  const [page, setPage] = useState(0)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  // Dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuProvider, setMenuProvider] = useState<ServiceProvider | null>(null)

  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  useEffect(() => {
    fetchProviders()
  }, [page, limit, searchTerm, statusFilter, experienceFilter])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const query = {
        page: page + 1,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        experience: experienceFilter !== 'all' ? experienceFilter : undefined,
      }

      const response = await ProvidersService.getProviders(query)
      
      if (response.data?.serviceProviders || response.data?.providers) {
        // Handle both API formats
        const providersList = response.data?.serviceProviders || response.data?.providers || []
        
        // Transform the data to match expected format
        const transformedProviders = providersList.map((provider: any) => ({
          ...provider,
          // Map snake_case to camelCase if needed
          businessName: provider.business_name || provider.businessName,
          businessLicense: provider.business_license || provider.businessLicense,
          servicesOffered: provider.services_offered || provider.servicesOffered || [],
          serviceAreas: provider.service_areas || provider.serviceAreas || [],
          verificationStatus: provider.verification_status || provider.verificationStatus,
          yearsExperience: provider.years_experience || provider.yearsExperience,
          // Keep original fields
          business_name: provider.business_name || provider.businessName,
          services_offered: provider.services_offered || provider.servicesOffered || [],
          service_areas: provider.service_areas || provider.serviceAreas || [],
          verification_status: provider.verification_status || provider.verificationStatus,
          years_experience: provider.years_experience || provider.yearsExperience,
        }))
        
        setProviders(transformedProviders)
        setTotal(response.data.pagination?.total || 0)
      } else {
        setProviders([])
        setTotal(0)
      }
    } catch (error: any) {
      console.error('Error fetching providers:', error)
      showSnackbar(error.message || 'Failed to fetch providers', 'error')
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    fetchProviders()
    setRefreshKey(Date.now())
    setSelectedProviderIds([]) // Clear selection after action
  }

  const handleCreate = () => {
    // Navigate to full-page create form
    navigate('/providers/create')
  }

  const handleEdit = (provider: ServiceProvider) => {
    // Navigate to full-page edit form (future)
    // For now, keep edit in dialog or navigate to edit page
    navigate(`/providers/edit/${provider.id}`)
    handleMenuClose()
  }

  const handleView = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setDetailsDialogOpen(true)
    handleMenuClose()
  }

  const handleDelete = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const handleVerificationStatus = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setVerificationDialogOpen(true)
    handleMenuClose()
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, provider: ServiceProvider) => {
    setMenuAnchor(event.currentTarget)
    setMenuProvider(provider)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuProvider(null)
  }

  // Form submit handler removed - now using full-page navigation

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setExperienceFilter('all')
    setPage(0)
  }

  const handleApplyFilters = () => {
    setPage(0)
    fetchProviders()
  }

  return (
    <Box>
      <PageHeader
        title="Service Providers"
        subtitle="Manage service providers and their verification status"
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <BulkActions
              selectedIds={selectedProviderIds}
              onSuccess={handleSuccess}
              onClearSelection={() => setSelectedProviderIds([])}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ borderRadius: 2 }}
            >
              Add Provider
            </Button>
          </Box>
        }
      />

      {/* Stats Cards */}
      <ProviderStatsWidget onRefresh={refreshKey} />

      {/* Filters */}
      <ProviderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        experienceFilter={experienceFilter}
        onExperienceChange={setExperienceFilter}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Providers Table */}
      <ProviderTable
        providers={providers}
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
        <MenuItem onClick={() => menuProvider && handleView(menuProvider)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => menuProvider && handleEdit(menuProvider)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => menuProvider && handleVerificationStatus(menuProvider)}>
          <VerifiedIcon sx={{ mr: 1 }} fontSize="small" />
          Update Verification
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => menuProvider && handleDelete(menuProvider)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Details Dialog - Only for viewing provider details */}
      <ProviderDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        provider={selectedProvider}
      />

      {/* Verification Status Dialog */}
      <VerificationStatusDialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        provider={selectedProvider}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProviderDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        provider={selectedProvider}
        onSuccess={handleSuccess}
      />

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
